/**
 * Thin typed wrapper over the current Resend REST API for the monthly
 * newsletter system.
 *
 * Why not the `resend` npm SDK? The installed `resend@4.7.0` predates Resend's
 * 2026 "Audiences -> Segments + Topics" rename: its `broadcasts.create` only
 * knows the legacy `audienceId` field and has no notion of topics. The SDK is
 * pinned because auth-critical transactional email (`lib/email/service.ts`)
 * depends on it, so instead of upgrading we call the REST API directly here.
 *
 * All request/response field names below were verified against the live docs
 * (July 2026). Doc URLs are cited inline where the shape is non-obvious.
 * REST fields are snake_case; the external function signatures use camelCase.
 */

const RESEND_BASE_URL = "https://api.resend.com";

/** Error thrown for any non-2xx Resend REST response. */
export interface ResendApiError extends Error {
  status: number;
  body: unknown;
}

function makeResendApiError(status: number, body: unknown, path: string): ResendApiError {
  // Resend error bodies look like { statusCode, name, message }.
  const message =
    body && typeof body === "object" && "message" in body
      ? String((body as { message?: unknown }).message)
      : `Resend API request failed (${status})`;
  const err = new Error(`${message} [${status} ${path}]`) as ResendApiError;
  err.name = "ResendApiError";
  err.status = status;
  err.body = body;
  return err;
}

interface ResendFetchOptions {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
}

/**
 * Performs an authenticated request against the Resend REST API.
 *
 * @param options - HTTP method, path (leading slash), and optional JSON body.
 * @returns The parsed JSON response body.
 * @throws {ResendApiError} When the API key is missing or the response is non-2xx.
 */
async function resendFetch<T>(options: ResendFetchOptions): Promise<T> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not set") as ResendApiError;
    err.name = "ResendApiError";
    err.status = 0;
    err.body = null;
    throw err;
  }

  const res = await fetch(`${RESEND_BASE_URL}${options.path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw makeResendApiError(res.status, parsed, options.path);
  }

  return parsed as T;
}

/**
 * Determines whether a Resend error signals that the contact already exists,
 * which we treat as success (create-contact is effectively an upsert intent).
 *
 * Resend's docs do not pin down a single duplicate signal, so we accept a 409
 * Conflict or a 422 validation error whose message mentions "already exists".
 */
// TODO(verify-live): confirm the exact status/name Resend returns for a
// duplicate contact (observed candidates: 409, or 422 with a
// "Contact already exists" message). Adjust the check if it differs live.
function isContactAlreadyExists(err: ResendApiError): boolean {
  if (err.status === 409) return true;
  const body = err.body;
  if (body && typeof body === "object" && "message" in body) {
    const message = String((body as { message?: unknown }).message ?? "").toLowerCase();
    return message.includes("already exists");
  }
  return false;
}

// --- Contacts ------------------------------------------------------------

/**
 * Creates (or upserts) a contact and attaches it to segments/topics.
 *
 * Ref: https://resend.com/docs/api-reference/contacts/create-contact
 * Request body: { email, first_name?, last_name?, segments: [{ id }],
 * topics: [{ id, subscription: "opt_in" | "opt_out" }] }.
 * A pre-existing contact is treated as success; note the duplicate error body
 * may not echo the contact id, in which case the returned id is empty.
 *
 * @param opts - Contact email plus optional name, segment ids, and topic subs.
 * @returns The created (or existing) contact id.
 */
export async function createContact(opts: {
  email: string;
  firstName?: string;
  lastName?: string;
  segmentIds?: string[];
  topics?: { id: string; subscribed: boolean }[];
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = { email: opts.email };
  if (opts.firstName !== undefined) body.first_name = opts.firstName;
  if (opts.lastName !== undefined) body.last_name = opts.lastName;
  if (opts.segmentIds?.length) {
    body.segments = opts.segmentIds.map((id) => ({ id }));
  }
  if (opts.topics?.length) {
    body.topics = opts.topics.map((t) => ({
      id: t.id,
      subscription: t.subscribed ? "opt_in" : "opt_out",
    }));
  }

  try {
    const res = await resendFetch<{ object: string; id: string }>({
      method: "POST",
      path: "/contacts",
      body,
    });
    return { id: res.id };
  } catch (error) {
    const err = error as ResendApiError;
    if (err.name === "ResendApiError" && isContactAlreadyExists(err)) {
      // Contact already present — treat as success. The error body may not
      // carry an id, so surface whatever id is available (possibly empty).
      const existingId =
        err.body && typeof err.body === "object" && "id" in err.body
          ? String((err.body as { id?: unknown }).id ?? "")
          : "";
      return { id: existingId };
    }
    throw err;
  }
}

// --- Topics --------------------------------------------------------------

/**
 * Creates a subscription topic.
 *
 * Ref: https://resend.com/docs/api-reference/topics/create-topic
 * Request body: { name, default_subscription: "opt_in" | "opt_out", description? }.
 * `default_subscription` is required by the API and cannot be changed later.
 *
 * @param opts - Topic name plus optional description and default subscription.
 * @returns The created topic id.
 */
export async function createTopic(opts: {
  name: string;
  description?: string;
  defaultSubscription?: "opt_in" | "opt_out";
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    name: opts.name,
    default_subscription: opts.defaultSubscription ?? "opt_in",
  };
  if (opts.description !== undefined) body.description = opts.description;

  const res = await resendFetch<{ object: string; id: string }>({
    method: "POST",
    path: "/topics",
    body,
  });
  return { id: res.id };
}

/**
 * Lists existing topics (used for idempotent setup).
 *
 * Ref: https://resend.com/docs/api-reference/topics/list-topics
 * Response: { object: "list", has_more, data: [{ id, name, ... }] }.
 *
 * @returns The array of existing topics with id and name.
 */
export async function listTopics(): Promise<{ id: string; name: string }[]> {
  const res = await resendFetch<{ data?: { id: string; name: string }[] }>({
    method: "GET",
    path: "/topics",
  });
  return res.data ?? [];
}

// --- Segments ------------------------------------------------------------

/**
 * Creates a segment.
 *
 * Ref: https://resend.com/docs/api-reference/segments/create-segment
 * Request body: { name }. Response: { object: "segment", id, name }.
 *
 * @param opts - The segment name.
 * @returns The created segment id.
 */
export async function createSegment(opts: { name: string }): Promise<{ id: string }> {
  const res = await resendFetch<{ object: string; id: string; name: string }>({
    method: "POST",
    path: "/segments",
    body: { name: opts.name },
  });
  return { id: res.id };
}

/**
 * Lists existing segments (used for idempotent setup).
 *
 * Ref: https://resend.com/docs/api-reference/segments/list-segments
 * Response: { object: "list", has_more, data: [{ id, name, created_at }] }.
 *
 * @returns The array of existing segments with id and name.
 */
export async function listSegments(): Promise<{ id: string; name: string }[]> {
  const res = await resendFetch<{ data?: { id: string; name: string }[] }>({
    method: "GET",
    path: "/segments",
  });
  return res.data ?? [];
}

// --- Broadcasts ----------------------------------------------------------

/**
 * Creates a broadcast scoped to a segment (and optionally a topic).
 *
 * Ref: https://resend.com/docs/api-reference/broadcasts/create-broadcast
 * Request body: { segment_id, from, subject, reply_to?, html, text?, name?,
 * topic_id? }. The current REST API uses `segment_id` (not the legacy
 * `audience_id`) and `topic_id` for topic scoping.
 *
 * @param opts - Broadcast segment/topic ids, sender, subject, and content.
 * @returns The created broadcast id.
 */
export async function createBroadcast(opts: {
  segmentId: string;
  topicId?: string;
  from: string;
  replyTo?: string;
  subject: string;
  previewText?: string;
  html: string;
  text?: string;
  name?: string;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    segment_id: opts.segmentId,
    from: opts.from,
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.topicId !== undefined) body.topic_id = opts.topicId;
  if (opts.replyTo !== undefined) body.reply_to = opts.replyTo;
  if (opts.text !== undefined) body.text = opts.text;
  if (opts.name !== undefined) body.name = opts.name;
  // NOTE: The current broadcasts REST API has no `preview_text` field
  // (verified against create-broadcast.md, July 2026). The inbox preheader is
  // instead embedded in the rendered HTML by `renderNewsletter`, so
  // `previewText` is accepted here for signature stability but not forwarded.
  // TODO(verify-live): re-add a `preview_text` body field if Resend restores it.
  void opts.previewText;

  const res = await resendFetch<{ id: string }>({
    method: "POST",
    path: "/broadcasts",
    body,
  });
  return { id: res.id };
}

/**
 * Sends (or schedules) an existing broadcast.
 *
 * Ref: https://resend.com/docs/api-reference/broadcasts/send-broadcast
 * POST /broadcasts/:id/send with optional { scheduled_at } (natural language
 * or ISO 8601). Omitting `scheduled_at` sends immediately.
 *
 * @param id - The broadcast id to send.
 * @param opts - Optional scheduled-at instant (ISO 8601).
 * @returns The broadcast id.
 */
export async function sendBroadcast(
  id: string,
  opts?: { scheduledAt?: string }
): Promise<{ id: string }> {
  const body: Record<string, unknown> = {};
  if (opts?.scheduledAt !== undefined) body.scheduled_at = opts.scheduledAt;

  const res = await resendFetch<{ id: string }>({
    method: "POST",
    path: `/broadcasts/${id}/send`,
    body,
  });
  return { id: res.id };
}

/**
 * Retrieves a broadcast's current status.
 *
 * Ref: https://resend.com/docs/api-reference/broadcasts/get-broadcast
 * Response includes id, status (draft/queued/sent/...), scheduled_at, sent_at.
 *
 * @param id - The broadcast id to fetch.
 * @returns The broadcast id, status, and schedule/sent timestamps.
 */
export async function getBroadcast(
  id: string
): Promise<{ id: string; status: string; scheduled_at: string | null; sent_at: string | null }> {
  const res = await resendFetch<{
    id: string;
    status: string;
    scheduled_at: string | null;
    sent_at: string | null;
  }>({
    method: "GET",
    path: `/broadcasts/${id}`,
  });
  return {
    id: res.id,
    status: res.status,
    scheduled_at: res.scheduled_at ?? null,
    sent_at: res.sent_at ?? null,
  };
}
