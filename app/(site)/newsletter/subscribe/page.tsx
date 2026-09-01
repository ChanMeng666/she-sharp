import type { Metadata } from "next";
import { CalendarDays, Heart, Users } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";

/**
 * Indexable, so it needs its own canonical.
 *
 * There is no root-level `alternates.canonical` in this app on purpose — one
 * would cascade and point every page at the homepage — so every indexable page
 * declares its own. This route is also listed in `app/sitemap.ts`.
 */
export const metadata: Metadata = {
  title: { absolute: "Subscribe to the She Sharp Newsletter | She Sharp" },
  description:
    "Get the She Sharp newsletter: one email a month about upcoming events, the mentorship programme, and the New Zealand women-in-tech community. Unsubscribe in one click.",
  alternates: { canonical: "/newsletter/subscribe" },
};

/** What the reader is actually signing up for. No numbers, no claims. */
const WHAT_YOU_GET = [
  {
    icon: CalendarDays,
    title: "Upcoming events",
    body: "Meetups, panels and workshops around New Zealand, with enough notice to get a ticket.",
  },
  {
    icon: Users,
    title: "The mentorship programme",
    body: "When applications open, who we are matching, and what the programme is up to.",
  },
  {
    icon: Heart,
    title: "The community",
    body: "News from the women-in-tech community here — what people are building, and where to find them.",
  },
] as const;

/**
 * The public landing page for the She Sharp newsletter.
 *
 * Subscribing is deliberately two steps: this form asks the server to send a
 * confirmation email, and nobody joins the list until they click the link in
 * it. That is why the page never promises delivery — see the note on the
 * success copy in `components/newsletter/newsletter-signup.tsx`.
 */
export default function NewsletterSubscribePage() {
  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="content">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: what this is */}
          <div className="max-w-xl">
            <p className="text-label mb-4 text-brand">Newsletter</p>
            <h1 className="text-display-sm text-foreground">
              One email a month from She Sharp
            </h1>
            <p className="mt-5 text-base text-ink-600 md:text-lg">
              We write once a month about upcoming events, the mentorship
              programme, and the New Zealand women-in-tech community. That is
              the whole newsletter — no weekly digest, no drip campaign.
            </p>

            <ul className="mt-10 space-y-6">
              {WHAT_YOU_GET.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <item.icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-sm text-ink-600">
              Every issue carries a one-click unsubscribe link, and we do not
              share your address with anyone.
            </p>
          </div>

          {/* Right: the form */}
          <div className="lg:pt-4">
            <div className="rounded-[24px] border border-ink-300 bg-background p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-foreground">
                Sign up
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Enter your email and we will send you a confirmation link to
                click. The link is good for 7 days.
              </p>
              <NewsletterSignup
                placement="newsletter-page"
                layout="stacked"
                askFirstName
                className="mt-6"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
