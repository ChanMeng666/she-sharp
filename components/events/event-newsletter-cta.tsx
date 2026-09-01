"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";

export interface EventNewsletterCtaProps {
  /** True once the event's date has passed. Decides the whole tone below. */
  isPast: boolean;
}

/**
 * The newsletter ask on an event detail page.
 *
 * One component with two jobs, because the same page serves two very different
 * readers:
 *
 * - **Upcoming.** Quiet, and low on the page. This reader already has a next
 *   action — get a ticket — and anything that competes with it costs an
 *   attendee to gain a subscriber, which is a bad trade.
 * - **Past.** The primary forward action, and the only one. There are ~97 of
 *   these pages against a handful of upcoming ones, they are what search sends
 *   people to, and a reader who lands on one has just found out they missed it.
 *   Without this the page's only offer is a photo gallery.
 *
 * A client leaf on purpose: this is the only interactive thing on the page, and
 * the page itself must stay in the static build.
 */
export function EventNewsletterCta({ isPast }: EventNewsletterCtaProps) {
  return (
    <Section bgColor={isPast ? "accent" : "white"}>
      <Container size="full">
        <div
          className={
            isPast
              ? "grid gap-8 md:grid-cols-2 md:items-center md:gap-16"
              : "flex flex-col gap-6 border-t border-border pt-10 md:flex-row md:items-center md:justify-between md:gap-12"
          }
        >
          <div className={isPast ? undefined : "max-w-md"}>
            <h2
              className={
                isPast
                  ? "text-display-sm text-foreground"
                  : "text-xl font-semibold text-foreground"
              }
            >
              {isPast
                ? "This one’s been and gone"
                : "Not this one? There’s always a next one"}
            </h2>
            <p className="mt-3 text-base text-ink-600">
              {isPast
                ? "The next one goes out by email first — one email a month, with what’s coming up around New Zealand."
                : "One email a month with the events we have coming up."}
            </p>
          </div>

          <div className={isPast ? "md:pt-2" : "w-full md:max-w-md"}>
            <NewsletterSignup
              placement="event-page"
              labels={isPast ? { cta: "Keep me posted" } : undefined}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default EventNewsletterCta;
