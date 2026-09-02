import { EventV3 } from "@/types/event";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

interface EventInfoSectionsProps {
  event: EventV3;
}

/**
 * Renders the trailing info blocks from the legacy conference pages —
 * Session resources, Getting to the event, About the venue, Key Contact —
 * as titled sections with paragraphs and outbound link buttons.
 */
export function EventInfoSections({ event }: EventInfoSectionsProps) {
  const sections = event.detailPageData.infoSections;
  if (!sections || sections.length === 0) return null;

  return (
    <Section spacing="section" className="bg-muted">
      <Container size="content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {sections.map((section, i) => (
            <div key={i} className="rounded-[16px] border border-border bg-white p-6 md:p-8">
              <h3 className="text-xl font-semibold text-foreground">
                {section.title}
              </h3>
              {section.paragraphs?.map((p, j) => (
                <p
                  key={j}
                  className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed"
                >
                  {p}
                </p>
              ))}
              {section.images && section.images.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-4">
                  {section.images.map((image, k) => (
                    /* Fixed 128px row height; `w-auto` keeps each image's own
                       aspect ratio, so the hint dimensions never distort it. */
                    <Image
                      key={k}
                      src={image.url}
                      alt={image.alt}
                      width={480}
                      height={320}
                      sizes="480px"
                      className="h-32 w-auto rounded-[12px] object-cover"
                    />
                  ))}
                </div>
              )}
              {section.links && section.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {section.links.map((link, k) => {
                    const external = /^https?:|^mailto:/.test(link.url);
                    return (
                      <Button
                        key={k}
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          href={link.url}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
