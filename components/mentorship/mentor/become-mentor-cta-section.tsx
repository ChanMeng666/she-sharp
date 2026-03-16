"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Users, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function BecomeMentorCTASection() {
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
    { icon: Clock, label: "Time Commitment", value: "2-4 hrs/month" },
    { icon: Calendar, label: "Duration", value: "6 Months" },
    { icon: Users, label: "Active Mentees", value: "100+" },
    { icon: Sparkles, label: "Satisfaction", value: "4.8/5" }
  ];

  return (
    <Section className="bg-linear-to-br from-periwinkle-light via-periwinkle-mid to-periwinkle-dark relative overflow-hidden" noPadding>
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
                  Interested in Becoming A Mentor?
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-left">
                  Join our community of mentors and help shape the next generation of women in STEM
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
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-fit mt-4 bg-periwinkle-dark"
                >
                  <Link href="/mentorship/mentor/apply">
                    Apply to be a Mentor
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