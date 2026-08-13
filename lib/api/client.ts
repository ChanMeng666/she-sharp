/**
 * A single place for browser-side calls to this app's own `/api/*` routes.
 *
 * Before this, 77 raw `fetch()` calls across 26 client files each re-implemented
 * the same four steps — set the JSON headers, stringify the body, check
 * `res.ok`, dig the message out of `{ error }` — and each got a slightly
 * different subset right. `apiFetch` does the four steps once and throws
 * `ApiError` on a non-2xx so a call site is a plain `try`/`catch`.
 *
 * It deliberately does NOT decide what the user sees. Existing screens variously
 * `alert()`, `toast()` or swallow errors; the wrapper leaves that to the caller.
 */

/** Thrown by `apiFetch` for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  /**
   * The parsed response body, when it was JSON. Kept so a call site that reads
   * a non-standard field (`body.message`, `body.valid`, …) can still do so.
   */
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** True for an `ApiError`, narrowing in a `catch` block. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * `RequestInit` plus `json`: pass a value and it is stringified with the right
 * content-type. Use `body` directly for FormData or a pre-serialised string.
 */
export type ApiRequestInit = RequestInit & { json?: unknown };

/** Pulls the human-readable message out of whatever the route returned. */
function messageFrom(body: unknown, response: Response): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error) return record.error;
    if (typeof record.message === 'string' && record.message) return record.message;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  return response.statusText || `Request failed with status ${response.status}`;
}

/** Reads the body as JSON where possible, falling back to text, then to null. */
async function readBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Calls an app API route and returns its parsed JSON body.
 *
 * Throws `ApiError` when the response is not 2xx. A 204 or an empty body
 * resolves to `undefined`, so `T` should be optional in that case.
 */
export async function apiFetch<T = unknown>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const requestInit: RequestInit = { ...rest };

  if (json !== undefined) {
    requestInit.body = JSON.stringify(json);
    requestInit.headers = { 'Content-Type': 'application/json', ...headers };
  } else if (headers) {
    requestInit.headers = headers;
  }

  const response = await fetch(path, requestInit);
  const body = await readBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(body, response), body);
  }

  return body as T;
}

/** GET a route and return its JSON. */
export function apiGet<T = unknown>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'GET' });
}

/** POST a JSON body and return the JSON response. */
export function apiPost<T = unknown>(path: string, json?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'POST', json });
}

/** PUT a JSON body and return the JSON response. */
export function apiPut<T = unknown>(path: string, json?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'PUT', json });
}

/** PATCH a JSON body and return the JSON response. */
export function apiPatch<T = unknown>(path: string, json?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'PATCH', json });
}

/** DELETE a route, optionally with a JSON body, and return the JSON response. */
export function apiDelete<T = unknown>(path: string, json?: unknown, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'DELETE', json });
}
