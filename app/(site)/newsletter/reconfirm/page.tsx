import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ReconfirmForm } from "./reconfirm-form";

/**
 * `noindex`, and it still carries its own canonical.
 *
 * The URL only ever arrives from a newsletter and carries a signed per-recipient
 * token, so there is nothing here worth crawling and every reason not to put
 * tokens in a search index. The self-canonical is not redundant: a `noindex`
 * child under a parent that declares a canonical can have its noindex applied to
 * the *parent* instead, so the page has to point at itself. This route is
 * deliberately absent from `app/sitemap.ts` — listing a noindex URL there is the
 * contradiction Search Console reports as "Submitted URL marked 'noindex'".
 */
export const metadata: Metadata = {
  title: { absolute: "Confirm you still want the newsletter | She Sharp" },
  robots: { index: false, follow: false },
  alternates: { canonical: "/newsletter/reconfirm" },
};

/**
 * The page a re-confirmation link opens: an explanation and a button.
 *
 * Nothing is recorded until the button is pressed — the reasoning is in
 * `reconfirm-form.tsx` and in the route handler it POSTs to.
 */
export default async function NewsletterReconfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; i?: string }>;
}) {
  const { t, i } = await searchParams;

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="narrow">
        <div className="mx-auto max-w-xl">
          <p className="text-label mb-4 text-brand">Newsletter</p>
          <h1 className="text-display-sm text-foreground">
            Still want the She Sharp newsletter?
          </h1>

          {t ? (
            <>
              <p className="mt-5 text-base text-ink-600 md:text-lg">
                Some people on our mailing list joined years ago, through a
                ticket purchase or an import, and our records do not show clearly
                that they chose to be here. We would rather ask than assume.
              </p>
              <p className="mt-4 text-base text-ink-600 md:text-lg">
                Press the button and we will note that you said yes. Nothing else
                changes, and you do not need to do anything if you are happy as
                you are — this is a one-press upgrade to our record, not a
                renewal you have to complete.
              </p>
              <ReconfirmForm token={t} issue={i} />
            </>
          ) : (
            <p className="mt-5 text-base text-ink-600 md:text-lg">
              This link is missing its code. Please open the newsletter we sent
              you and use the link in it, or{" "}
              <Link className="underline" href="/newsletter/subscribe">
                sign up here
              </Link>{" "}
              if you are not on the list yet.
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
