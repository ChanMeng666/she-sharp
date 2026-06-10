import { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin, Calendar } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getEventBySlug } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Google Educator Conference | She Sharp",
  description:
    "The Google Educator Conference (formerly CS4HS), brought to you by Google and She Sharp, upskills New Zealand's digital technology educators. Explore highlights from past editions.",
};

const EDITIONS = [
  "google-educator-conference-2024",
  "google-educator-conference-2023",
];

export default function GoogleEducatorConferenceHub() {
  const editions = EDITIONS.map((slug) => getEventBySlug(slug)).filter(
    (e): e is NonNullable<typeof e> => Boolean(e)
  );

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        {/* Header */}
        <div className="mb-10 md:mb-14 max-w-3xl">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-brand">
            Formerly CS4HS
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Google Educator Conference
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Brought to you by Google and She Sharp, the Google Educator
            Conference trains digital technology teachers in STEM subjects and
            creative ways to present them in New Zealand classrooms — upskilling
            educators to engage students with the technologies shaping
            twenty-first century learning. Explore highlights from past editions
            below.
          </p>
        </div>

        {/* Edition cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {editions.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="group block card-responsive-sm overflow-hidden bg-background shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.coverImage.url}
                  alt={event.coverImage.alt || event.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold">
                  Google Educator Conference{" "}
                  {new Date(event.date).getFullYear()}
                </h2>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand" />
                    {event.date}
                  </p>
                  {event.detailPageData.location?.venueName && (
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand" />
                      {event.detailPageData.location.venueName}
                    </p>
                  )}
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  View highlights
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
