/**
 * Schema constants derived from types/event.ts. Used by the Slack bot in two
 * places:
 *   1. `schemaBlock()` is injected into the AI system prompt so the model
 *      knows which fields are required, which are enums, and what common
 *      update shapes look like.
 *   2. `validatePatchForMerge()` is called by applyPatch as a last-line
 *      safety net — enum values and (for create) required-field presence
 *      are checked before any JSON is committed.
 *
 * Single source of truth: if types/event.ts changes, update this file.
 */

import { EVENT_CATEGORIES, EVENT_FORMATS, EVENT_STATUSES } from "@/types/event";

export { EVENT_CATEGORIES, EVENT_FORMATS, EVENT_STATUSES };

interface FieldDescriptor {
  name: string;
  description: string;
}

/** Top-level EventV3 fields that MUST be present when creating an event. */
export const REQUIRED_EVENT_FIELDS: ReadonlyArray<FieldDescriptor> = [
  { name: "id", description: "Integer — server auto-assigns if omitted" },
  { name: "slug", description: "kebab-case identifier, e.g. \"she-sharp-candice-murray-own-your-energy\"" },
  { name: "title", description: "Full human-readable title" },
  { name: "date", description: "Human-readable date, e.g. \"April 16, 2026\"" },
  { name: "coverImage", description: "{ url: \"/img/events/<slug>-cover.png\", alt: \"<descriptive alt>\" }" },
  { name: "detailPageUrl", description: "https://shesharp.org.nz/events/{slug}" },
  { name: "shortDescription", description: "One-sentence summary (< 300 chars)" },
  { name: "attendees", description: "Registered count (number|null)" },
  { name: "checkedIn", description: "Checked-in count (number|null, typically 0 before the event)" },
  { name: "detailPageData", description: "See REQUIRED detailPageData FIELDS below" },
];

/** detailPageData fields that MUST be present when creating an event. */
export const REQUIRED_DETAIL_FIELDS: ReadonlyArray<FieldDescriptor> = [
  { name: "url", description: "Same URL as detailPageUrl" },
  { name: "title", description: "Same as top-level title" },
  { name: "subtitle", description: "Short tagline, e.g. \"Career Mindset Workshop\"" },
  { name: "date", description: "Same as top-level date" },
  { name: "time", description: "Time range, e.g. \"5:00pm - 7:30pm NZDT\"" },
  { name: "location", description: "{ format, venueName, address, city, country } — format is an enum (see below)" },
  { name: "fullDescription", description: "string[] — one paragraph per array item" },
  { name: "speakers", description: "{ keynote_speakers?, panel_speakers?, guest_speakers?, panel_facilitators? } — groups have { heading, speakers[] }" },
  { name: "organizers", description: "EventSpeakerV3[] — usually []" },
  { name: "sponsors", description: "{ main: [...], other: [...] } — both arrays always present, can be empty" },
  { name: "specialSections", description: "[{ type, title, content[] }] — typically includes an \"agenda\" section. Empty [] if none." },
  { name: "photos", description: "EventPhotoV3[] — [] before the event is over" },
  { name: "galleryUrl", description: "Google Photos album URL; \"\" if not yet published" },
  { name: "registrationUrl", description: "Ticket / RSVP link" },
  { name: "images", description: "EventPhotoV3[] — [] if none" },
  { name: "category", description: `Enum — one of: ${EVENT_CATEGORIES.join(", ")}` },
  { name: "status", description: `Enum — one of: ${EVENT_STATUSES.join(", ")}` },
  { name: "isFeatured", description: "boolean — whether to feature on the homepage" },
];

/** Optional detailPageData fields that are sometimes present. */
export const OPTIONAL_DETAIL_FIELDS: ReadonlyArray<FieldDescriptor> = [
  { name: "humanitixUrl", description: "Humanitix event page URL" },
  { name: "humanitixId", description: "Humanitix event ID (string)" },
  { name: "refundPolicy", description: "Refund policy text, e.g. \"No refunds\"" },
  { name: "dateTime", description: "Humanitix-style full datetime string (auto-imported)" },
  { name: "startTime", description: "Auto-extracted start time" },
  { name: "endTime", description: "Auto-extracted end time" },
  { name: "timezone", description: "e.g. \"NZDT\"" },
];

/**
 * High-frequency update shapes. Helps the AI pick the correct nested path
 * for the 5 most common admin intents instead of re-deriving each time.
 */
export const COMMON_UPDATE_PATTERNS = `
PATTERN (a) — Mark an event as completed (post-event wrap):
  { "detailPageData": { "status": "completed", "galleryUrl": "<Google Photos URL from channel>" }, "checkedIn": <number> }

PATTERN (b) — Add a keynote speaker. Arrays are REPLACED by deep-merge, so
you must include the CURRENT list plus the new entry. If you don't have the
current list, return op="clarify" asking admin to confirm who is already listed:
  { "detailPageData": { "speakers": { "keynote_speakers": { "heading": "Meet Our Speakers", "speakers": [ /* existing speakers */, { "name": "...", "title": "...", "company": "...", "bio": "...", "image": "/img/events/<slug>-<first-last>.jpg", "linkedin": "" } ] } } } }

PATTERN (c) — Add / replace a main sponsor (arrays are REPLACED, include all):
  { "detailPageData": { "sponsors": { "main": [ /* existing */, { "name": "Metlifecare", "logo": "/img/sponsors/metlifecare.svg" } ] } } }

PATTERN (d) — Change time or location:
  { "detailPageData": { "time": "6:00pm - 8:00pm NZDT", "location": { "format": "in_person", "venueName": "...", "address": "...", "city": "Auckland", "country": "New Zealand" } } }

PATTERN (e) — Cancel an event:
  { "detailPageData": { "status": "cancelled" } }
`.trim();

/** Produces the text block injected into the AI system prompt. */
export function schemaBlock(): string {
  const fmt = (fs: ReadonlyArray<FieldDescriptor>) =>
    fs.map((f) => `  - ${f.name}: ${f.description}`).join("\n");
  return `
EVENT SCHEMA REFERENCE

Required top-level fields (EventV3):
${fmt(REQUIRED_EVENT_FIELDS)}

Required detailPageData fields:
${fmt(REQUIRED_DETAIL_FIELDS)}

Optional detailPageData fields (only include when admin/channel explicitly provides them):
${fmt(OPTIONAL_DETAIL_FIELDS)}

Enum values (must match exactly — any other value is rejected by server):
  status:   ${EVENT_STATUSES.join(" | ")}
  category: ${EVENT_CATEGORIES.join(" | ")}
  location.format: ${EVENT_FORMATS.join(" | ")}

COMMON UPDATE PATTERNS — use the pattern closest to the admin's intent:
${COMMON_UPDATE_PATTERNS}

CREATE OP POLICY: op="create" must populate all required top-level fields
AND all required detailPageData fields above. If any required value is
missing from the channel and the /event text, return op="clarify" with a
specific list of what you need. A create patch missing required fields
will be rejected by the server before the PR is opened.
`.trim();
}

// ============================================================
// Validation (enforced by applyPatch)
// ============================================================

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Validates a patch payload before it is merged into events-custom.json.
 * Returns an array of issues; empty array means the payload is valid.
 *
 * For op="update", only enum values are checked (a delta may legitimately
 * touch just one field).
 * For op="create", all required fields must be present AND enum values must
 * be valid.
 */
export function validatePatchForMerge(
  op: "update" | "create",
  payload: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  checkEnum(payload, "detailPageData.status", EVENT_STATUSES, issues);
  checkEnum(payload, "detailPageData.category", EVENT_CATEGORIES, issues);
  checkEnum(payload, "detailPageData.location.format", EVENT_FORMATS, issues);

  if (op === "create") {
    for (const { name } of REQUIRED_EVENT_FIELDS) {
      if (name === "id") continue;
      if (!(name in payload)) {
        issues.push({ path: name, message: "Required top-level field is missing." });
      }
    }
    const detail = payload["detailPageData"];
    if (isPlainObject(detail)) {
      for (const { name } of REQUIRED_DETAIL_FIELDS) {
        if (!(name in detail)) {
          issues.push({
            path: `detailPageData.${name}`,
            message: "Required detailPageData field is missing.",
          });
        }
      }
    }
  }

  return issues;
}

function checkEnum(
  root: Record<string, unknown>,
  dottedPath: string,
  allowed: ReadonlyArray<string>,
  issues: ValidationIssue[],
): void {
  const value = getDeep(root, dottedPath);
  if (value === undefined) return;
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({
      path: dottedPath,
      message: `Must be one of: ${allowed.join(", ")}. Got: ${JSON.stringify(value)}`,
    });
  }
}

function getDeep(root: Record<string, unknown>, dottedPath: string): unknown {
  let cursor: unknown = root;
  for (const part of dottedPath.split(".")) {
    if (!isPlainObject(cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
