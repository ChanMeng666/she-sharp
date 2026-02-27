'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function BecomeMenteeCTASection() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <Section className="py-16 bg-linear-to-br from-purple-light via-purple-mid to-purple-dark relative overflow-hidden ">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

      <Container size="full" className="relative z-10">
        <div className="max-w-8xl mx-auto">
          <div className="text-white">
            {/* <Badge className="bg-mint-dark text-navy-dark mb-6 px-4 py-2 text-sm font-semibold">
            Applications Now Open
          </Badge> */}

            <h2 className="text-display-sm text-foreground mb-4 text-left">
              Interested in Becoming A Mentee?
            </h2>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-12 text-left">
              Take the first step towards transforming your career with personalized mentorship from industry leaders
            </p>

            {/* Countdown Timer and Quick Info */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              {/* Countdown Timer - Left Side */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <p className="text-lg mb-4 opacity-80 text-left font-semibold">Application Deadline</p>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(timeLeft).map(([unit, value]) => (
                    <Card key={unit} className="bg-white/10 backdrop-blur-sm border-white/20 flex-1 min-w-[120px]">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-white">{value}</div>
                        <div className="text-sm text-white/80 capitalize">{unit}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* CTA Buttons */}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-fit mt-8 bg-brand"
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSeiNe0btTXNLsJeIsMape05630fK1SLdldO9Ty3x8QbLd6B6w/viewform?usp=sf_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Apply to Become a Mentee
                  </a>
                </Button>

                <p className="text-base text-white/80 mt-6">
                  Questions? <Link href="/contact" className="hover:underline">Contact our support team</Link>.
                </p>
              </div>

              {/* Quick Info - Right Side, Stacked */}
              <div className="w-full md:w-1/2 flex items-top justify-end">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-12 flex flex-col gap-8">
                  {quickInfo.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-8">
                        <Icon className="w-6 h-6 text-white shrink-0" />
                        <div>
                          <p className="text-base text-white/80">{item.label}</p>
                          <p className=" text-lg font-semibold text-white">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}