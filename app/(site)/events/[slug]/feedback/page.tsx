import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllEvents,
  getEventBySlug,
  formatEventDate,
  isFutureDate,
  parseDateString,
} from "@/lib/data/events";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  EventFeedbackForm,
  type FeedbackSource,
} from "@/components/events/event-feedback-form";

interface FeedbackPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const events = getAllEvents();
  return events.map((event) => ({
    slug: event.slug,
  }));
}

/**
 * Drops a trailing venue clause from an event title, for the heading only.
 *
 * Titles in `events-custom.json` routinely append the venue after an em-dash —
 * "Aotearoa AI Hackathon Festival 2026 — AUT City Campus" — which is useful on
 * a listing and noise inside a question. At 390px the full title runs to four
 * lines before the first field, which is the wrong thing to put between an
 * attendee and the form.
 *
 * The full title is still what gets stored on the row and shown in Slack, where
 * the venue disambiguates rather than distracts. Only the `<h1>` is trimmed,
 * and only when what remains is long enough to still name the event.
 */
function headingTitle(title: string): string {
  const [head] = title.split(/\s+—\s+/);
  return head && head.trim().length >= 12 ? head.trim() : title;
}

/**
 * Maps the `?s=` provenance marker onto the API's `source` enum.
 *
 * `/f/<code>` appends `?s=qr`; on-site links use `?s=event`; newsletter and
 * fulfilment mail use `?s=email`. Anything else — a pasted link, a typed URL,
 * a stripped param — is `direct_link`, which is also the honest answer when we
 * simply do not know.
 */
function resolveSource(raw: string | string[] | undefined): FeedbackSource {
  const value = Array.isArray(raw) ? raw[0] : raw;
  switch (value) {
    case "qr":
      return "deck_qr";
    case "event":
      return "event_page";
    case "email":
      return "email";
    default:
      return "direct_link";
  }
}

export async function generateMetadata({
  params,
}: FeedbackPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return {
      title: { absolute: "Feedback | She Sharp" },
      robots: { index: false, follow: true },
    };
  }

  /*
   * Three deliberate metadata decisions. All three are the kind of thing a
   * later "tidy-up" removes without visible consequence, and the damage only
   * surfaces in Search Console weeks later.
   *
   * 1. The self-canonical is MANDATORY. `app/(site)/events/layout.tsx` declares
   *    `alternates: { canonical: "/events" }`, and canonical cascades to
   *    children. A `noindex` child that inherits a canonical pointing at
   *    `/events` ships a contradictory pair, and one way Google resolves it is
   *    by applying the noindex to `/events` itself — de-indexing the events
   *    hub. Same trap as `/mentorship/{mentor,mentee}/apply`.
   *
   * 2. `title.absolute` is MANDATORY. That same layout sets a plain string
   *    `title`, which stops the root `%s | She Sharp` template from reaching
   *    this page. Without `absolute` the tab reads bare.
   *
   * 3. `noindex` because this is a content-free form replicated across every
   *    event slug — the textbook thin-duplicate pattern — and because an
   *    indexed feedback form invites ratings from people who were never in the
   *    room. `/mentorship/*` and `/present/*` are the settled precedent.
   *
   * Two matching constraints in files this page does not own: it must NOT be
   * added to `app/sitemap.ts` (a noindex URL in the sitemap is exactly what GSC
   * reports as "Submitted URL marked 'noindex'"), and it must NOT be added to
   * `DISALLOWED_PATHS` in `app/robots.ts` (a Disallow stops crawlers reading
   * the noindex, so the URL stays indexed with no snippet).
   */
  return {
    title: { absolute: `Feedback — ${event.title} | She Sharp` },
    description: `Tell us how ${event.title} went. Takes under a minute, no sign-in needed.`,
    alternates: { canonical: `/events/${slug}/feedback` },
    robots: { index: false, follow: true },
  };
}

export default async function EventFeedbackPage({
  params,
  searchParams,
}: FeedbackPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const source = resolveSource((await searchParams).s);
  const isFuture = isFutureDate(event.date);

  // Someone scanning a code off an old slide deck or a photo in their camera
  // roll needs to be told which event they are rating. A month is the point
  // where "today" stops being a safe assumption.
  const daysSince =
    (Date.now() - parseDateString(event.date).getTime()) / 86_400_000;
  const isLongPast = daysSince > 30;

  /*
   * A deliberately bare shell: no `EventHeader`, no sidebar, no related events,
   * and no `Reveal`. This page is reached by a phone on venue wifi with the
   * lights coming up — a form that fades in feels slow, and event chrome is
   * three screens of scrolling between the attendee and the first question.
   */
  return (
    <Section bgColor="accent">
      <Container>
        <div className="py-6 sm:py-10">
          <p className="text-label text-ink-500 mb-4">Event feedback</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How was {headingTitle(event.title)}?
          </h1>
          {/* Says what it costs, honestly. This line used to read "no sign-in,
              no email needed" — name and email became required on 2026-08-03,
              and a promise the form then breaks two screens later is worse
              than no promise at all. There is still no sign-in, which is the
              part that actually stops people in a hall. */}
          <p className="mt-4 mb-8 text-lg text-ink-700 leading-relaxed">
            Under a minute, and no sign-in.
          </p>

          <EventFeedbackForm
            eventSlug={event.slug}
            eventTitle={event.title}
            eventDateLabel={formatEventDate(event, "long")}
            isFutureEvent={isFuture}
            isLongPast={isLongPast}
            source={source}
          />
        </div>
      </Container>
    </Section>
  );
}
