"use client";

import { EventV3 } from "@/types/event";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Heart, Users, Sparkles } from "lucide-react";

interface EventSponsorshipProps {
  event: EventV3;
  className?: string;
}

const HIGHLIGHTS = [
  { icon: Users, text: "2,200+ community members reached" },
  { icon: Heart, text: "84+ events since 2014" },
  { icon: Sparkles, text: "50+ corporate sponsors" },
];

export function EventSponsorship({ event, className }: EventSponsorshipProps) {
  return (
    <section id="event-sponsorship" className="relative overflow-hidden">
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div
          className="relative py-16 md:py-24"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--purple-mid)) 50%, hsl(var(--periwinkle)) 100%)",
          }}
        >
          {/* Decorative blurred shapes */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

          <div className="relative max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: Text content */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-4">
                  Corporate Partnerships
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                  Partner with Purpose
                </h2>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Join leading organisations in empowering women in STEM.
                  Connect with our team to learn how your sponsorship can create
                  meaningful, lasting impact.
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 mb-10">
                  {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 text-white/90"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  size="lg"
                  variant="brand"
                  className="bg-white text-brand hover:bg-white/90 font-semibold group shadow-lg"
                >
                  <Link href="/sponsors/corporate-sponsorship">
                    Become a Sponsor
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {/* Right: Decorative visual */}
              <div className="hidden lg:flex items-center justify-center shrink-0">
                <div className="relative w-72 h-72 xl:w-80 xl:h-80">
                  {/* Animated rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/15 animate-pulse" />
                  <div
                    className="absolute inset-5 rounded-full border-2 border-white/20"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <div className="absolute inset-10 rounded-full border-2 border-white/25" />
                  <div className="absolute inset-15 rounded-full bg-white/10 backdrop-blur-sm" />

                  {/* Center */}
                  <div className="absolute inset-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="text-3xl xl:text-4xl font-bold text-white leading-none">
                        She
                      </div>
                      <div className="text-3xl xl:text-4xl font-bold text-white leading-none">
                        Sharp
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
