import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ConfirmForm } from "./confirm-form";

/**
 * `noindex`, and it still carries its own canonical.
 *
 * The URL only ever arrives from an email and carries a single-use token, so
 * there is nothing here worth crawling and every reason not to put tokens in a
 * search index. The self-canonical is not redundant: a `noindex` child under a
 * parent that declares a canonical can have its noindex applied to the *parent*
 * instead, so the page has to point at itself. This route is deliberately
 * absent from `app/sitemap.ts` — listing a noindex URL there is the
 * contradiction Search Console reports as "Submitted URL marked 'noindex'".
 */
export const metadata: Metadata = {
  title: { absolute: "Confirm your newsletter subscription | She Sharp" },
  robots: { index: false, follow: false },
  alternates: { canonical: "/newsletter/confirm" },
};

/**
 * The second half of the double opt-in: the page the confirmation email links
 * to. It renders a button and confirms nothing until that button is pressed —
 * the reasoning is in `confirm-form.tsx`.
 */
export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="narrow">
        <div className="mx-auto max-w-xl">
          <p className="text-label mb-4 text-brand">Newsletter</p>
          <h1 className="text-display-sm text-foreground">
            Confirm your subscription
          </h1>

          {t ? (
            <>
              <p className="mt-5 text-base text-ink-600 md:text-lg">
                One more step. Press the button below and you will be on the
                list for the monthly She Sharp newsletter.
              </p>
              <ConfirmForm token={t} />
            </>
          ) : (
            <p className="mt-5 text-base text-ink-600 md:text-lg">
              This link is missing its confirmation code. Please open the
              confirmation email we sent you and use the link in it, or{" "}
              <Link className="underline" href="/newsletter/subscribe">
                sign up again
              </Link>{" "}
              to get a fresh one.
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
