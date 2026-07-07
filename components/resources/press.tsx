"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ArrowUpRight } from "lucide-react";
import { newsPressItems } from "@/lib/data/news-press";

export function PressGrid() {
  return (
    <Section spacing="section" className="py-24 lg:py-36">
      <Container size="full">
        <div className="mb-10 md:mb-14">
          <p className="text-label mb-4 text-brand">In the Press</p>
          <h1 className="text-display-sm text-foreground">
            News &amp; press coverage
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-600 md:text-lg">
            News and press coverage featuring She Sharp&apos;s community, awards,
            and impact.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {newsPressItems.map((item) => {
            const dateLabel = new Date(item.isoDate).toLocaleDateString("en-NZ", {
              month: "long",
              year: "numeric",
            });

            const body = (
              <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-background transition-colors duration-300 group-hover:border-foreground/30">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-label text-ink-500">{dateLabel}</p>
                  <h2 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                    {item.title}
                  </h2>
                  {item.externalLink && (
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
                      Read article
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  )}
                </div>
              </article>
            );

            const wrapperClass =
              "group block h-full rounded-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

            return item.externalLink ? (
              <a
                key={item.id}
                href={item.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className={wrapperClass}
                aria-label={item.title}
              >
                {body}
              </a>
            ) : (
              <div key={item.id} className={wrapperClass}>
                {body}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
