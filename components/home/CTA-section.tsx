"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Heart, DollarSign, ArrowRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const CTA_ITEMS = [
  {
    icon: DollarSign,
    title: "Donate to She Sharp",
    description:
      "Help us empower more young women to pursue careers in STEM through events and networking opportunities.",
    href: "/donate",
    label: "Make a donation",
    delay: 100,
  },
  {
    icon: Heart,
    title: "Come to an event",
    description:
      "Meet new people, network with companies, engage in workshops and learn more about working in STEM!",
    href: "/events",
    label: "Explore Events",
    delay: 200,
  },
] as const;

const BUTTON_CLASSES =
  "border border-ghost-white text-ghost-white bg-transparent hover:bg-ghost-white/10";
const ICON_CONTAINER_CLASSES =
  "w-18 h-18 bg-ghost-white rounded-full flex items-center justify-center mb-4";
const ICON_CLASSES = "w-8 h-8 text-periwinkle-dark";

export function CTASection() {
  return (
    <Section className="bg-navy-light py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll
          variant="scale"
          className="max-w-7xl mx-auto bg-periwinkle rounded-4xl p-16 mb-10"
        >
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
            {/* Left side - Main heading */}
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-2/5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                BRIDGE THE<br />
                GENDER GAP<br />
                IN STEM<br />
                WITH US
              </h2>
            </AnimateOnScroll>

            {/* Right side - CTA blocks */}
            <div className="w-full lg:w-2/3 flex flex-col lg:flex-row gap-6">
              {CTA_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <AnimateOnScroll
                    key={item.href}
                    variant="fade-up"
                    delay={item.delay}
                    className="flex-1 max-w-lg mx-auto text-left flex flex-col items-start"
                  >
                    <div className={ICON_CONTAINER_CLASSES}>
                      <Icon className={ICON_CLASSES} />
                    </div>
                    <h3 className="text-2xl font-semibold text-ghost-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-ghost-white/80 leading-relaxed mb-6">
                      {item.description}
                    </p>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className={BUTTON_CLASSES}
                    >
                      <Link href={item.href}>
                        {item.label}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}

export default CTASection;