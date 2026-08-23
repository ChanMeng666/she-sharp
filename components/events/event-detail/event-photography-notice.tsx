import Link from "next/link";
import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { isPastEvent } from "@/lib/data/event-utils";
import { PRIVACY_EMAIL } from "@/lib/config/contact-addresses";

/**
 * Photography notice, on every event detail page.
 *
 * She Sharp photographs its events and publishes a selection, and until now the
 * only place that was written down was a privacy policy line listing "Photo" as
 * a category of data collected — which is not something an attendee reads before
 * turning up. Nothing told anyone they could ask not to be photographed, and
 * nothing told them how to have a published photograph taken down.
 *
 * THIS IS A NOTICE AND A REMOVAL ROUTE, NOT A CONSENT MECHANISM. Consent would
 * be an opt-in collected at registration, which happens on Humanitix, outside
 * this codebase. Saying so here is deliberate: a page that implied consent had
 * been gathered when it had not would be worse than the silence it replaces.
 *
 * The tense follows the event, because the useful sentence is different either
 * side of the day: before it, that you can opt out on arrival; after it, that a
 * published frame can be removed. Both are shown regardless — an upcoming event
 * becomes a past one without anybody editing this page.
 *
 * The removal promise has an operational cost that has to be honoured:
 * `/img/*` is served with a one-year immutable cache, so taking a photograph
 * down is a code change plus an edit to the public Google Photos album, not a
 * click. See `docs/development/PHOTOGRAPHING_MINORS.md`.
 */
export function EventPhotographyNotice({
  event,
  className,
}: {
  event: EventV3;
  className?: string;
}) {
  const past = isPastEvent(event);

  return (
    <Section spacing="section" className={cn("py-10 md:py-14", className)}>
      <Container size="full">
        <aside
          aria-labelledby="photography-notice"
          className="max-w-3xl border-t border-border pt-6"
        >
          <h2
            id="photography-notice"
            className="text-label text-brand"
          >
            Photography at this event
          </h2>

          <p className="mt-4 text-base leading-relaxed text-ink-600">
            {past
              ? "We photographed this event and publish a selection here and in a public album."
              : "We photograph our events and publish a selection on this site and in a public album. A She Sharp organiser or photographer may be taking photographs on the day — tell a member of the team if you would rather not be photographed, and we will make sure you are not."}
          </p>

          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Where children attend, we publish photographs of activities rather
            than portraits of individual children, we never name a child, and
            for events run with a school or youth organisation we rely on that
            organisation&apos;s media consent.
          </p>

          <p className="mt-3 text-base leading-relaxed text-ink-600">
            If you would prefer a photograph of you or your child not to be
            published, email{" "}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="font-medium text-brand hover:underline"
            >
              {PRIVACY_EMAIL}
            </a>{" "}
            and we will remove it. See our{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-brand hover:underline"
            >
              privacy policy
            </Link>{" "}
            and{" "}
            <Link
              href="/code-of-conduct"
              className="font-medium text-brand hover:underline"
            >
              code of conduct
            </Link>
            .
          </p>
        </aside>
      </Container>
    </Section>
  );
}
