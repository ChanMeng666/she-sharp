"use client";

import { Event } from "@/types/event";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface EventSponsorshipProps {
  event: Event;
  className?: string;
}

export function EventSponsorship({ event, className }: EventSponsorshipProps) {
  // Only show if event has sponsorship info or we want to show it for all events
  // For now, we'll show it for all events, but you can add conditional logic
  
  return (
    <section id="event-sponsorship" className={cn("relative overflow-hidden py-16", className)}>
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-linear-to-br from-brand/5 via-background to-brand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Decorative Circle/Graphic */}
            <div className="relative flex items-center justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                {/* Concentric circles */}
                <div className="absolute inset-0 rounded-full border-4 border-brand/20"></div>
                <div className="absolute inset-4 rounded-full border-4 border-brand/30"></div>
                <div className="absolute inset-8 rounded-full border-4 border-brand/40"></div>
                <div className="absolute inset-12 rounded-full border-4 border-brand/50"></div>
                
                {/* Center content */}
                <div className="absolute inset-16 rounded-full bg-linear-to-br from-brand/10 to-brand/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-4xl md:text-5xl font-bold text-brand mb-2">She</div>
                    <div className="text-4xl md:text-5xl font-bold text-brand">Sharp</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Partner with Purpose
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Join leading organizations in empowering women in STEM through strategic corporate partnerships. 
                Connect with our team to learn how your sponsorship can make a meaningful impact.
              </p>
              <div className="pt-4">
                <Button
                  asChild
                  size="lg"
                  variant="brand"
                  className="group"
                >
                  <Link href="/sponsors/corporate-sponsorship">
                    Become a Sponsor
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

