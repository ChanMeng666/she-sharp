import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { UnsubscribeForm } from "./unsubscribe-form";

/**
 * `noindex` because the URL only ever arrives from an email and carries a
 * signed token. There is nothing here for a crawler, and indexing it would put
 * tokens in a search index.
 */
export const metadata: Metadata = {
  title: { absolute: "Unsubscribe | She Sharp" },
  robots: { index: false, follow: false },
};

/**
 * The human-facing half of the one-click unsubscribe flow.
 *
 * Providers POST straight to `/api/email/unsubscribe`; this page exists for the
 * people who click the link in the email body instead. It deliberately does not
 * unsubscribe on load — link scanners prefetch GET URLs, so the opt-out has to
 * wait for a real button press.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  return (
    <Section bgColor="white">
      <Container size="narrow">
        <div className="mx-auto max-w-xl py-12">
          <h1 className="text-3xl font-bold tracking-tight">
            Unsubscribe from reminder emails
          </h1>

          {t ? (
            <>
              <p className="mt-4 text-muted-foreground">
                This stops the recurring reminders and updates we send about
                mentorship applications and programme news.
              </p>
              <p className="mt-2 text-muted-foreground">
                You will still receive the emails you ask us for — sign-in
                verification, password resets and donation receipts.
              </p>
              <UnsubscribeForm token={t} />
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">
              This link is missing its unsubscribe code. Please use the
              unsubscribe link in the email you received, or write to{" "}
              <a
                className="underline"
                href="mailto:hello@shesharp.org.nz"
              >
                hello@shesharp.org.nz
              </a>{" "}
              and we will take you off the list.
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
