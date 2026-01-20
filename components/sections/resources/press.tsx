 "use client";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ExternalLink } from "lucide-react";
import { newsPressItems } from "@/lib/data/news-press";

export function PressGrid() {
  return (
    <Section spacing="section" className="py-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            In the Press
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
            News and press coverage featuring She Sharp&apos;s community, awards,
            and impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-[minmax(200px,auto)]">
          {newsPressItems.map((item, index) => {
            // Make specific cards span 2 rows for visual interest
            const isTall = index === 1 || index === 4;

            const content = (
              <Card className={`relative h-full w-full overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-[32px] bg-black ${isTall ? "" : "aspect-[4/3]"}`}>
                {/* Background image */}
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* External link badge */}
                {item.externalLink && (
                  <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-gray-900">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Read article</span>
                  </div>
                )}

                {/* Content */}
                <div className="absolute inset-x-5 bottom-5 z-10">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                    {new Date(item.isoDate).toLocaleDateString("en-NZ", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h2 className={`mt-2 font-semibold text-white leading-snug ${isTall ? "text-xl md:text-2xl line-clamp-4" : "text-lg md:text-xl line-clamp-3"}`}>
                    {item.title}
                  </h2>
                </div>
              </Card>
            );

            const wrapperClass = isTall
              ? "group block h-full md:row-span-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground rounded-[32px]"
              : "group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground rounded-[32px]";

            return item.externalLink ? (
              <a
                key={item.id}
                href={item.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className={wrapperClass}
                aria-label={item.title}
              >
                {content}
              </a>
            ) : (
              <div key={item.id} className={wrapperClass}>
                {content}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
