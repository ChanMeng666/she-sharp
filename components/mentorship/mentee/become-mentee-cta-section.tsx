'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Users, Zap, ArrowRight } from "lucide-react";
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

  const quickInfo = [
    { icon: Clock, label: "Duration", value: "6 Months" },
    { icon: Calendar, label: "Time Commitment", value: "2-4 hrs/month" },
    { icon: Users, label: "Cohort Size", value: "50 Mentees" },
    { icon: Zap, label: "Application Fee", value: "Free" }
  ];

  return (
    <Section className="bg-linear-to-br from-purple-light via-purple-mid to-purple-dark relative overflow-hidden" noPadding>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

      {/* Quick Info panel - full height right side */}
      <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-[35%] lg:w-[30%] bg-white/10 backdrop-blur-sm z-10 items-center justify-center px-10 lg:px-14">
        <div className="flex flex-col gap-10">
          {quickInfo.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-6">
                <Icon className="w-6 h-6 text-white shrink-0" />
                <div>
                  <p className="text-sm text-white/80">{item.label}</p>
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Left content */}
      <div className="relative z-10 py-16">
        <Container size="full">
          <div className="max-w-8xl mx-auto">
            <div className="text-white md:w-[60%] lg:w-[65%] flex flex-col gap-6">
              <div>
                <h2 className="text-display-sm text-foreground mb-4 text-left">
                  Interested in Becoming A Mentee?
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-left">
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
                      className="bg-white/10 backdrop-blur-sm border-white/20 flex-1 min-w-[100px]"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-white">{value}</div>
                        <div className="text-sm text-white/80 capitalize">{unit}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  asChild
                  size="lg"
                  className="bg-white text-purple-dark hover:bg-white/90 w-fit mt-4 text-base font-bold px-8 py-6 h-auto shadow-lg shadow-black/20 group transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02]"
                >
                  <Link href="/mentorship/mentee/apply" className="inline-flex items-center gap-3">
                    Apply to Become a Mentee
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>

                <p className="text-base text-white/80">
                  Questions?{" "}
                  <Link href="/contact" className="hover:underline">
                    Contact our support team
                  </Link>
                  .
                </p>
              </div>

              {/* Mobile-only quick info */}
              <div className="flex flex-col gap-6 mt-4 md:hidden bg-white/10 backdrop-blur-sm rounded-lg p-8">
                {quickInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-6">
                      <Icon className="w-6 h-6 text-white shrink-0" />
                      <div>
                        <p className="text-sm text-white/80">{item.label}</p>
                        <p className="text-lg font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
