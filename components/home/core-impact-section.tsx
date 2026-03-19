"use client";

import React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { homeImpactData, type ImpactItem } from "@/lib/data/stats";

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

const AnimatedNumber: React.FC<{ target: number; animate: boolean }> = ({
  target,
  animate,
}) => {
  const [current, setCurrent] = React.useState(animate ? 0 : target);

  React.useEffect(() => {
    if (!animate) {
      setCurrent(target);
      return;
    }
    let raf = 0;
    const durationMs = 2400; // a touch snappier
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setCurrent(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, target]);

  return <>{formatNumber(current)}</>;
};

function StatCard({
  item,
  animate,
  className,
}: {
  item: ImpactItem;
  animate: boolean;
  className?: string;
}) {
  const { target, suffix } = parseTargetValue(item.value);

  return (
    <article
      role="listitem"
      className={`card-md card-glass card-interactive focus-within:-translate-y-0.5 focus-within:shadow-xl focus-within:shadow-brand/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand/20 ${className ?? ""}`}
      tabIndex={0}
      aria-labelledby={`stat-${item.title.toLowerCase().replace(/\s+/g, "-")}-title`}
    >
      <div className="p-5 w-full h-auto min-h-[260px] sm:min-h-[280px] md:min-h-[300px] lg:min-h-[320px] flex flex-col justify-between">
        <div className="relative w-10 h-10 shrink-0" aria-hidden="true">
          <Image
            src={item.icon}
            alt={item.title}
            fill
            className="object-contain"
          />
        </div>

        <div>
          <div
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tabular-nums tracking-tight mb-4 text-brand"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatedNumber target={target} animate={animate} />
            <span aria-hidden="true">{suffix}</span>
          </div>
          <h3
            id={`stat-${item.title.toLowerCase().replace(/\s+/g, "-")}-title`}
            className="text-lg font-bold text-foreground mb-4"
          >
            {item.title}
          </h3>
          <div
            className="h-px w-full mb-4 bg-linear-to-r from-transparent via-border/50 to-transparent"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.desc}
          </p>
        </div>
      </div>
    </article>
  );
}

export function CoreImpactSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Section className="bg-white/20" aria-labelledby="impact-heading">
      <div ref={ref} className="relative">
        <Container size="full">
          {/* Header */}
          <AnimateOnScroll variant="fade-up" className="my-12 md:my-16 lg:my-20">
            <h2
              id="impact-heading"
              className="text-display-sm text-foreground"
            >
              A Decade of Measurable Impact
            </h2>
          </AnimateOnScroll>

          {/* Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-8xl mx-auto my-12 md:my-16 lg:my-20"
            role="list"
          >
            {homeImpactData.map((item, i) => (
              <AnimateOnScroll key={i} variant="fade-up" delay={i * 100}>
                <StatCard
                  item={item}
                  animate={inView && !reduceMotion}
                  className="hover:scale-105"
                />
              </AnimateOnScroll>
            ))}
          </div>
        </Container>
      </div>
    </Section>
  );
}
