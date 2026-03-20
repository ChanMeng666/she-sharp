'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function BecomeMenteeCTASection() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Mock deadline - replace with actual deadline
  const applicationDeadline = new Date('2026-03-31T23:59:59');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = applicationDeadline.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Section className="bg-linear-to-br from-purple-light via-purple-mid to-purple-dark relative overflow-hidden" noPadding>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

      <div className="relative z-10 py-16">
        <Container size="full">
          <div className="max-w-8xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center text-white">
              {/* Left: Title + Countdown */}
              <div className="flex flex-col gap-12">
                <div>
                  <h2 className="text-display-sm text-white mb-4 text-left">
                    Interested in Becoming A Mentee?
                  </h2>
                  <p className="text-base md:text-lg text-white/80 max-w-2xl text-left">
                    Take the first step towards transforming your career with personalized mentorship from industry leaders
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-lg opacity-80 text-left font-semibold">
                    Application Deadline
                  </p>
                  <div className="flex gap-4 flex-wrap max-w-xl">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                      <Card
                        key={unit}
                        className="bg-white/10 backdrop-blur-sm border-white/20 flex-1 min-w-[80px] sm:min-w-[100px] card-sm"
                      >
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="text-3xl font-bold text-white">{value}</div>
                          <div className="text-sm text-white/80 capitalize">{unit}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Apply button + contact */}
              <div className="flex flex-col items-center md:items-center gap-6">
                <Button
                  asChild
                  size="lg"
                  className="bg-white border-none text-brand hover:bg-white/90 text-lg font-bold px-12 py-4 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:text-foreground hover:shadow-md hover:shadow-black/30 hover:scale-[1.02]"
                >
                  <Link href="/mentorship/mentee/apply" className="inline-flex items-center gap-3">
                    Apply to Become a Mentee
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>

                <p className="text-base text-white/80 text-center">
                  Questions?{" "}
                  <Link href="/contact" className="hover:underline font-medium text-white">
                    Contact our support team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
