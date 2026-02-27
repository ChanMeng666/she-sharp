"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { EventV3 } from "@/types/event";

const FALLBACK_HERO_IMAGE = "/img/2026.jpg";

interface FeaturedEventHeroProps {
  event?: EventV3;
}

function HeroButtons({ slug, registrationUrl }: { slug: string; registrationUrl?: string }) {
  const [isHovered, setIsHovered] = useState<"details" | "register" | null>(
    null
  );

  const registerHref = registrationUrl || `/events/${slug}`;
  const isExternal = !!registrationUrl;

  return (
    <div className="flex gap-3">
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
        style={{
          backgroundColor: isHovered === "details" ? "#333333" : "#000000",
          color: "#ffffff",
        }}
        onMouseEnter={() => setIsHovered("details")}
        onMouseLeave={() => setIsHovered(null)}
      >
        View Details
        <ArrowRight className="w-5 h-5" />
      </Link>
      <Link
        href={registerHref}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border-2"
        style={{
          backgroundColor: isHovered === "register" ? "#000000" : "transparent",
          color: isHovered === "register" ? "#ffffff" : "#000000",
          borderColor: "#000000",
        }}
        onMouseEnter={() => setIsHovered("register")}
        onMouseLeave={() => setIsHovered(null)}
      >
        Register Now
      </Link>
    </div>
  );
}

export function FeaturedEventHero({ event }: FeaturedEventHeroProps) {
  const [isImageHovered, setIsImageHovered] = useState(false);

  return (
    <Section spacing="section">
      <Container size="full">
        <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden mt-12">
          {/* Image */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            <Image
              src={event ? event.coverImage.url : FALLBACK_HERO_IMAGE}
              alt={event ? (event.coverImage.alt || event.title) : "She Sharp events"}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-300"
              style={{
                transform: isImageHovered ? "scale(1.05)" : "scale(1)",
              }}
            />

            {!event && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center">
                <div className="text-center px-6 max-w-2xl">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    Events &amp; Workshops
                  </h2>
                  <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
                    We bring women in tech together through workshops, panels, and networking events. Stay tuned for upcoming opportunities.
                  </p>
                  <Link
                    href="#past-events"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    See Past Events
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {event && (
            <>
              {/* title in bottom left */}
              <div className="absolute bottom-0 left-0 w-1/2 md:w-2/5 p-6">
                <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl px-6 py-4 md:px-8 md:py-6 shadow-lg h-full flex items-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Buttons container with curved corner effect */}
              <div
                className="absolute bottom-0 right-0 pt-8 pl-8 rounded-tl-[3rem] bg-background"
              >
                <div
                  className="absolute bottom-0 -left-8 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: "2rem",
                    boxShadow: "0.5rem 0.5rem 0 0.5rem #eee",
                  }}
                />
                <div
                  className="absolute -top-8 right-0 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: "2rem",
                    boxShadow: "0.5rem 0.5rem 0 0.5rem #eee",
                  }}
                />

                {/* Buttons */}
                <div className="pb-6 pr-6">
                  <HeroButtons slug={event.slug} registrationUrl={event.detailPageData.registrationUrl} />
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}


