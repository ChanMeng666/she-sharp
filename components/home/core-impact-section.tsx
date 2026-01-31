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
      className={`rounded-xl overflow-hidden border border-border/30 bg-background/40 backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 hover:bg-background/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10 focus-within:-translate-y-0.5 focus-within:shadow-xl focus-within:shadow-brand/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand/20 ${className ?? ""}`}
      tabIndex={0}
      aria-labelledby={`stat-${item.title.toLowerCase().replace(/\s+/g, "-")}-title`}
    >
      <div className="p-5 w-full h-80 flex flex-col justify-between">
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
            className="text-6xl font-extrabold tabular-nums tracking-tight mb-4 text-brand"
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
            className="h-px w-full mb-4 bg-gradient-to-r from-transparent via-border/50 to-transparent"
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
    <Section className="bg-muted/50" aria-labelledby="impact-heading">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto my-12 md:my-16 lg:my-20"
            role="list"
          >
            {impactData.map((item, i) => (
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
