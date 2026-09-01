import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { NewslettersGrid } from "@/components/resources";
import { getAllNewsletters } from "@/lib/data/newsletters-manual";

export const metadata: Metadata = {
  title: "Newsletters",
  alternates: { canonical: "/resources/newsletters" },
  description:
    "Read past issues of the She Sharp newsletter or subscribe to receive updates on events, mentorship, and community news.",
};

export default function NewslettersPage() {
  // Only the display fields. NewslettersGrid is a client component, so its
  // props are serialised into the RSC payload — and `source` would ship all
  // 51 Mailchimp URLs to the browser on the one page whose point is that it
  // no longer links to them.
  const issues = getAllNewsletters().map(({ id, month, year, url, theme }) => ({
    id,
    month,
    year,
    url,
    theme,
  }));

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        {/* Header */}
        <div className="mb-8 max-w-3xl sm:mb-10 md:mb-12">
          <p className="text-label mb-4 text-brand">Newsletters</p>
          <h1 className="text-display-sm text-foreground">The newsletter archive</h1>
          <p className="mt-4 text-base text-ink-600 md:text-lg">
            Stay in the loop on She Sharp events, mentorship milestones, and
            community wins. Browse past issues below or subscribe to receive the
            next one.
          </p>
        </div>

        {/*
          The field, not a button to it. This is the archive of the thing
          itself: a reader here has just been shown every issue of exactly what
          they would be subscribing to, which is the strongest evidence any
          placement on this site can offer, and making them load another page to
          type an address spends it. The form carries its own link to
          `/newsletter/subscribe` for anyone who wants the explainer first.

          There used to be a second button here, "Open full archive", pointing
          at `MAILCHIMP_CONFIG.archiveUrl`. It was wrong twice over: on a paid
          plan that URL returns the 20 most recent campaigns rather than the
          back catalogue, and it dies with the subscription the founder is
          cancelling. The full archive is the grid below — every issue is served
          from this site now — so the button would have linked this page to
          itself.
        */}
        {/*
          The field, not a button to it. This is the archive of the thing
          itself: a reader here has just been shown fifty issues of exactly what
          they would be subscribing to, which is the strongest evidence any
          placement on this site can offer. Making them load another page to
          type an address spends that.
        */}
        <div className="mb-10 md:mb-14 max-w-xl">
          <NewsletterSignup placement="newsletter-archive" />
        </div>

        {/* Issue grid */}
        <NewslettersGrid issues={issues} />
      </Container>
    </Section>
  );
}
