"use client";

import React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type ImpactItem = {
  title: string;
  value: string;
  desc: string;
  icon: string;
};

const impactData: ImpactItem[] = [
  {
    title: "Active Members",
    value: "2200+",
    desc: "Women in tech building connections and advancing careers.",
    icon: "/icons/members.svg",
  },
  {
    title: "Events Since 2014",
    value: "84+",
    desc: "Workshops and conferences empowering women in tech.",
    icon: "/icons/events.svg",
  },
  {
    title: "Partner Companies",
    value: "50+",
    desc: "Leading tech companies supporting our mission.",
    icon: "/icons/parnership.svg",
  },
  {
    title: "Career Success Stories",
    value: "500+",
    desc: "Women advancing careers through mentorship and networking.",
    icon: "/icons/success.svg",
  },
];

const parseTargetValue = (
  value: string
): { target: number; suffix: string } => {
  const digits = value.match(/\d+/g);
  const target = digits ? Number(digits.join("")) : 0;
  const suffix = value.replace(/\d/g, "");
  return { target, suffix };
};

const formatNumber = (num: number) =>
  new Intl.NumberFormat(undefined).format(num);

const AnimatedNumber: React.FC<{
  target: number;
  shouldStart: boolean;
  skipAnimation?: boolean;
}> = ({ target, shouldStart, skipAnimation }) => {
  const [current, setCurrent] = React.useState(skipAnimation ? target : 0);
  const hasStarted = React.useRef(false);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    // If animation should be skipped, show final value immediately
    if (skipAnimation) {
      setCurrent(target);
      return;
    }

    // Start animation only once when shouldStart becomes true
    if (shouldStart && !hasStarted.current) {
      hasStarted.current = true;
      const durationMs = 2400;
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setCurrent(Math.round(target * eased));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }
  }, [shouldStart, skipAnimation, target]);

  // Cleanup on unmount only
  React.useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return <>{formatNumber(current)}</>;
};

function StatItem({
  item,
  shouldStart,
  skipAnimation,
}: {
  item: ImpactItem;
  shouldStart: boolean;
  skipAnimation?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="relative w-10 h-10 mb-4">
        <Image
          src={item.icon}
          alt={`${item.title} icon`}
          fill
          className="object-contain"
        />
      </div>

      <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight mb-2 text-foreground">
        {(() => {
          const { target, suffix } = parseTargetValue(item.value);
          return (
            <>
              <AnimatedNumber
                target={target}
                shouldStart={shouldStart}
                skipAnimation={skipAnimation}
              />
              {suffix}
            </>
          );
        })()}
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {item.desc}
      </p>
    </div>
  );
}

export function CoreImpactSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();
  const hasTriggered = React.useRef(false);
  const [shouldStart, setShouldStart] = React.useState(false);

  // Trigger animation only once when section comes into view
  React.useEffect(() => {
    if (inView && !hasTriggered.current && !reduceMotion) {
      hasTriggered.current = true;
      setShouldStart(true);
    }
  }, [inView, reduceMotion]);

  return (
    <Section className="bg-white">
      <div ref={ref} className="relative ">
        <Container size="full">
          {/* Header */}
          <AnimateOnScroll variant="fade-up" className=" mb-8 md:mb-20 ">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              A Decade of Measurable Impact
            </h2>
          </AnimateOnScroll>

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-16 max-w-7xl mx-auto">
            {impactData.map((item, i) => (
              <AnimateOnScroll
                key={i}
                variant="fade-up"
                delay={i * 100}
              >
                <StatItem
                  item={item}
                  shouldStart={shouldStart}
                  skipAnimation={reduceMotion}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </Container>
      </div>
    </Section>
  );
}
