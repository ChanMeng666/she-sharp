import { NextRequest, NextResponse } from "next/server";
import { eventSlugForFeedbackCode } from "@/lib/data/feedback-codes";

/**
 * The short link a projected feedback QR encodes: `/f/<code>` -> the event's
 * feedback form.
 *
 * The whole reason this hop exists is QR module size — see the header comment
 * in `lib/data/feedback-codes.ts`. Everything below follows from the fact that
 * the person on the other end is standing in a hall holding up a phone.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const slug = eventSlugForFeedbackCode(code);

  // An unknown code lands on the events index rather than a 404. Someone has
  // physically walked to the front of a room to scan this; the worst outcome is
  // handing them a dead end when a list of events is one tap from useful.
  if (!slug) {
    return NextResponse.redirect(new URL("/events", request.url), 307);
  }

  // 307, never 308. A permanent redirect is cached by the phone browser
  // indefinitely, so a code that ever has to be re-pointed — a duplicated
  // event, a corrected slug — stays broken on every device that already
  // scanned it, with no way to reach those people.
  //
  // `new URL(..., request.url)` resolves against the request origin, so local
  // testing stays local. Note the opposite rule in `feedbackUrlForSlug()`: the
  // URL baked into a projected QR must come from the compile-time `SITE_URL`,
  // because a code encoding `localhost` renders perfectly and fails silently on
  // every phone in the room.
  //
  // `?s=qr` records provenance. The alias hop exists regardless, so attributing
  // scans costs nothing.
  return NextResponse.redirect(
    new URL(`/events/${slug}/feedback?s=qr`, request.url),
    307
  );
}
