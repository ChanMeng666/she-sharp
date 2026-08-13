import { NextResponse } from 'next/server';
import type { z } from 'zod';

/**
 * Builds the 400 response for a request body that failed `safeParse`.
 *
 * The `error` string is the joined issue messages, which is the shape the
 * pre-existing zod routes (contact, sponsors/inquiry, forms/*\/public, auth/*)
 * already return and the shape every client in this repo reads. `details`
 * carries the per-field breakdown for debugging and is purely additive.
 */
export function invalidBody(error: z.ZodError): NextResponse {
  return NextResponse.json(
    {
      error: error.errors.map((e) => e.message).join(', ') || 'Invalid request body',
      details: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Reads a JSON body, returning `{}` when the request carries no body or
 * unparseable JSON. Only for handlers that already treated an absent body as an
 * empty object — everywhere else a malformed body should surface as a 400.
 */
export async function readOptionalJson(request: Request): Promise<unknown> {
  return request.json().catch(() => ({}));
}
