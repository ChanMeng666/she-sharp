import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { Reveal } from "@/components/ui/reveal";

/**
 * The home page's newsletter ask.
 *
 * A server component wrapping a client leaf, deliberately: the sign-up form
 * needs state, the page around it does not, and keeping the section itself
 * server-rendered means the home page stays prerendered.
 *
 * It sits after the testimonials and before the sponsor wall. That is the point
 * on the page where somebody has just read what the community is like and has
 * nothing to do about it — everything below is logos most people scroll past.
 * It is deliberately not next to `CTASection`, whose Donate / Come-to-an-event
 * pair is the page's one uncontested decision and should stay that way.
 */
export function NewsletterCTASection() {
  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal className="border-t border-border pt-12 md:pt-16">
          <div className="grid gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-label mb-4 text-brand">Newsletter</p>
              <h2 className="text-display-sm text-foreground">
                One email a month
              </h2>
              <p className="mt-4 max-w-md text-base text-ink-600 md:text-lg">
                Upcoming events, the mentorship programme, and what the
                New&nbsp;Zealand women-in-tech community is up to. That is the
                whole newsletter.
              </p>
            </div>

            <div className="md:pt-2">
              <NewsletterSignup placement="home" />
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export default NewsletterCTASection;
