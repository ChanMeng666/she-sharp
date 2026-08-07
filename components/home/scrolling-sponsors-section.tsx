"use client";

import { Container } from "@/components/layout/container";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { scrollingSponsorLogoRows } from "@/lib/data/sponsors";

/**
 * The cumulative wall of organisations that have supported a She Sharp event.
 *
 * Two counter-scrolling rows rather than one long band. That is partly because
 * the wall now carries every logo in the archive and a single strip would take
 * minutes to loop — but mainly because Deloitte's sponsorship agreement forbids
 * its logo sitting immediately beside certain other organisations, and rows are
 * the only way to guarantee that when the band wraps. See the comment on
 * `scrollingSponsorLogoRows` and `lib/data/sponsors.test.ts`; do not collapse
 * this back into one row.
 */
export function ScrollingSponsorsSection() {
  return (
    <section className="overflow-hidden border-y border-border bg-white py-12 md:py-16">
      <Container size="full">
        <h2 className="text-label mb-10 text-center text-ink-500">
          Sponsors who have supported our events
        </h2>
      </Container>

      <div className="space-y-8 md:space-y-10">
        {scrollingSponsorLogoRows.map((row, index) => (
          <LogoCloud
            key={index}
            logos={row.map((sponsor) => ({
              src: sponsor.logo,
              alt: sponsor.name,
            }))}
            reverse={index % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
}
