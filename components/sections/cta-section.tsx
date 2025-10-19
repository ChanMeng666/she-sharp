"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Heart, DollarSign, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <Section className="bg-[#F4F4FA]">
      <Container size="full">
        <div className="max-w-7xl mx-auto bg-navy-dark rounded-3xl p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 p-8">
            {/* Left side - Main heading */}
            <div className="w-full lg:w-2/5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-mint-dark leading-tight">
                BRIDGE THE<br />
                GENDER GAP<br />
                IN STEM<br />
                WITH US
              </h2>
            </div>

            {/* Right side - CTA blocks */}
            <div className="w-full lg:w-3/5 flex flex-col lg:flex-row gap-6">
              {/* Donate CTA */}
              <div className="flex-1 max-w-lg mx-auto text-left flex flex-col items-start">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-10 h-10 text-navy-dark" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Donate to She Sharp
                </h3>
                <p className="text-white/80 text-lg leading-relaxed mb-6">
                  Help us empower more young women to pursue careers in STEM through events and networking opportunities.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild 
                  className="border border-white text-white bg-transparent hover:bg-white/10"
                >
                  <Link href="/donate">
                    Make a donation
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* Event CTA */}
              <div className="flex-1 max-w-lg mx-auto text-left flex flex-col items-start">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10 text-navy-dark" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Come to an event
                </h3>
                <p className="text-white/80 text-lg leading-relaxed mb-6">
                  Meet new people, network with companies, engage in workshops and learn more about working in STEM!
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild 
                  className="border border-white text-white bg-transparent hover:bg-white/10"
                >
                  <Link href="/events">
                    Explore Events
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default CTASection;