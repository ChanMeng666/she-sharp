"use client";

import React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
//import { Badge } from "@/components/ui/badge";
import { Users, Building2, Calendar, TrendingUp } from "lucide-react";
//import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// 统一的核心数据 - 解决数据不一致问题
const coreStats = [
  {
    value: "2200+",
    label: "Active Members",

    color: "purple",
  },
  {
    value: "84+",
    label: "Events Since 2014",

    color: "periwinkle",
  },
  {
    value: "50+",
    label: "Partner Companies",

    color: "mint",
  },
  {
    value: "500+",
    label: "Career Success Stories",
    color: "navy",
  },
];

export function CoreImpactSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();

  const parseTargetValue = (
    value: string
  ): { target: number; suffix: string } => {
    const digitMatch = value.match(/\d+/g);
    const target = digitMatch ? Number(digitMatch.join("")) : 0;
    const suffix = value.replace(/\d/g, "");
    return { target, suffix };
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const AnimatedNumber = ({
    target,
    animate,
  }: {
    target: number;
    animate: boolean;
  }) => {
    const [current, setCurrent] = React.useState(animate ? 0 : target);
    React.useEffect(() => {
      if (!animate) {
        setCurrent(target);
        return;
      }
      let raf = 0;
      const durationMs = 3000;
      const startTs = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTs;
        const t = Math.min(1, elapsed / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const next = Math.round(target * eased);
        setCurrent(next);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [animate, target]);
    return <>{formatNumber(current)}</>;
  };
  return (
    <Section>
      <div ref={ref} className="relative">
        {/* {inView && !reduceMotion && (
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <Iridescence
              color={brandColors.testimonialsSky}
              mouseReact={false}
              amplitude={0.04}
              speed={0.2}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/60" />
          </div>
        )} */}
        <Container size="full">
          {/* Header */}
          <div className="text-center mb-8 md:mb-20">
            {/* <Badge className="mb-3 bg-purple-light text-purple-dark border-purple-mid">
            Proven Results
          </Badge> */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
              A Decade of Measurable Impact
            </h2>
          </div>

          {/* Core Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreStats.map((stat) => {
              return (
                <Card
                  key={stat.label}
                  className="relative overflow-hidden group border border-[#454180]/50"
                >
                  <CardContent className="py-16 px-6 hover:bg-periwinkle-soft/50 transition-all duration-300" >
                    <div className="text-3xl md:text-4xl font-bold text-navy-dark mb-10 font-heading">
                      {(() => {
                        const { target, suffix } = parseTargetValue(stat.value);
                        const shouldAnimate = inView && !reduceMotion;
                        return (
                          <>
                            <AnimatedNumber
                              target={target}
                              animate={shouldAnimate}
                            />
                            {suffix}
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-lg font-semibold text-navy-dark">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Values and long summary removed to keep section focused on metrics */}
        </Container>
      </div>
    </Section>
  );
}
