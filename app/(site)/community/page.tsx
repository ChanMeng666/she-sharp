import { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getCommunityAppearances } from "@/lib/data/community-appearances";

export const metadata: Metadata = {
  title: "Where We've Been",
  alternates: { canonical: "/community" },
  description:
    "Expos, school visits and competitions She Sharp has turned up to since 2021 — as a guest, an exhibitor or a competitor rather than the host.",
};

export default function CommunityPage() {
  const appearances = getCommunityAppearances();

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-10 max-w-3xl md:mb-14">
          <p className="text-label mb-4 text-brand">Community</p>
          <h1 className="text-display-sm text-foreground">Where we&apos;ve been</h1>
          <p className="mt-4 text-base text-ink-600 md:text-lg">
            Alongside the events we run, She Sharp turns up to other people&apos;s
            — school expos, careers evenings, museum open days and the odd
            startup competition. Usually with a table, a box of robots and
            someone happy to explain what a career in tech actually looks like.
          </p>
          {/*
            Said plainly rather than left as a suspicious column of blanks. The
            organisation has never counted heads at a booth, so these
            appearances carry no attendance figures and never will — which is
            exactly why they are not filed with the events.
          */}
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            We have never counted heads at a stall, so you will not find
            attendance numbers here. Where something concrete came out of a day
            — people who signed up, students we met — it is noted.
          </p>
        </div>

        <ol className="space-y-10 md:space-y-12">
          {appearances.map((appearance) => (
            <li
              key={`${appearance.date}-${appearance.name}`}
              className="border-t border-border pt-6"
            >
              <div className="flex flex-col gap-x-10 gap-y-3 md:flex-row">
                <div className="md:w-48 md:shrink-0">
                  <p className="text-label text-brand">
                    <time dateTime={appearance.date}>
                      {appearance.dateLabel}
                    </time>
                  </p>
                </div>

                <div className="max-w-3xl">
                  <h2 className="text-xl font-bold text-foreground md:text-2xl">
                    {appearance.name}
                  </h2>

                  <p className="mt-2 flex items-start gap-2 text-sm text-ink-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {appearance.venue}
                  </p>

                  <p className="mt-3 text-base leading-relaxed text-ink-600">
                    {appearance.what}
                  </p>

                  {appearance.audience && (
                    <p className="mt-2 text-sm text-ink-600">
                      <span className="font-medium text-foreground">
                        Who it was for:{" "}
                      </span>
                      {appearance.audience}
                    </p>
                  )}

                  {appearance.outcome && (
                    <p className="mt-2 text-sm text-ink-600">
                      <span className="font-medium text-foreground">
                        What came of it:{" "}
                      </span>
                      {appearance.outcome}
                    </p>
                  )}

                  {appearance.galleryUrl && (
                    <a
                      href={appearance.galleryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      See the photos
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col items-start gap-4">
          <p className="max-w-2xl text-base text-ink-600">
            Running an expo, a careers evening or a school event and want She
            Sharp there? We would like to hear about it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href="/contact">Get in touch</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/events">See our own events</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
