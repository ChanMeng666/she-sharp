"use client";

import { EventV3 } from "@/types/event";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";
import { curatedImages } from "@/public/img/curated";
import { globalStats } from "@/lib/data/stats";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Users, Sparkles } from "lucide-react";

interface EventSponsorshipProps {
  event: EventV3;
  className?: string;
}

// The event count is READ, not typed. It is derived from the event register by
// `getEventsHeldCount()`, so a literal here goes wrong the next time an event
// happens — which is how three pages came to say "95+" while the register said
// 96. Members and sponsors stay literal: `globalStats` records both as
// UNSOURCED round numbers, and reading them from there would dress a rounded
// figure up as a derived one.
const HIGHLIGHTS = [
  { icon: Users, text: "3,500+ community members reached" },
  { icon: Heart, text: `${globalStats.events.total}+ events since 2014` },
  { icon: Sparkles, text: "50+ corporate sponsors" },
];

const SPONSOR_PHOTO = curatedImages["connection-google-aut"];

export function EventSponsorship({ event }: EventSponsorshipProps) {
  return (
    <section id="event-sponsorship" className="relative">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="bg-foreground text-background py-16 md:py-24">
          <div className="relative max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: text content */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-label text-mint mb-4">
                  Corporate partnerships
                </p>
                <h2 className="text-display-sm text-white mb-6">
                  Partner with purpose<span className="text-mint">.</span>
                </h2>
                <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Join leading organisations in empowering women in STEM.
                  Connect with our team to learn how your sponsorship can create
                  meaningful, lasting impact.
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 mb-10">
                  {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 text-white/85"
                    >
                      <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-mint" />
                      </div>
                      <span className="text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <Button asChild size="lg" variant="brand" className="group">
                    <Link href="/sponsors/corporate-sponsorship">
                      Become a sponsor
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  {event.detailPageData.sponsorshipPackageUrl && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10"
                    >
                      <Link
                        href={event.detailPageData.sponsorshipPackageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View sponsorship package
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: real community photo in a hairline frame */}
              <div className="hidden lg:block shrink-0 w-[360px] xl:w-[420px]">
                <CurtainReveal className="overflow-hidden rounded-[32px] border border-white/15">
                  <Image
                    src={SPONSOR_PHOTO.src}
                    width={SPONSOR_PHOTO.width}
                    height={SPONSOR_PHOTO.height}
                    sizes="420px"
                    alt={SPONSOR_PHOTO.alt}
                    className="w-full h-full object-cover aspect-4/3"
                  />
                </CurtainReveal>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
