"use client";

import React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { Reveal } from "@/components/ui/reveal";
// Type-only: a value import of lib/data/stats would drag its
// getEventsHeldCount() call — and therefore the whole event archive — into this
// client component's bundle. The homepage passes `items` in already.
import type { ImpactItem } from "@/lib/data/stats";

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
    const durationMs = 2400;
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

/**
 * Renders the homepage impact band. `items` is supplied by the server so the
 * date-derived event count is identical on both sides of hydration.
 */
export function CoreImpactSection({ items }: { items: ImpactItem[] }) {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();
  const animate = inView && !reduceMotion;

  return (
    <Section bgColor="dark" aria-labelledby="impact-heading">
      <Container size="full">
        <div ref={ref}>
          <Reveal className="mb-14 md:mb-20">
            <span className="text-label mb-3 block text-mint">(02)</span>
            <h2 id="impact-heading" className="text-display-sm text-white">
              A decade of impact
            </h2>
          </Reveal>

          {/* Editorial stat band: hairline top rule + vertical dividers. */}
          <dl className="grid grid-cols-2 border-t border-white/20 lg:grid-cols-4">
            {items.map((item, i) => {
              const { target, suffix } = parseTargetValue(item.value);
              return (
                <Reveal
                  key={item.title}
                  variant="fade-up"
                  delay={i * 100}
                  className="border-white/20 px-2 py-8 [&:not(:nth-child(2n))]:border-r md:px-4 md:py-12 lg:border-r lg:last:border-r-0"
                >
                  <dd
                    className="text-5xl font-extrabold tabular-nums tracking-tight text-white md:text-6xl lg:text-7xl"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <AnimatedNumber target={target} animate={animate} />
                    <span aria-hidden="true" className="text-mint">
                      {suffix}
                    </span>
                  </dd>
                  <dt className="text-label mt-4 text-white/60">{item.title}</dt>
                </Reveal>
              );
            })}
          </dl>
        </div>
      </Container>
    </Section>
  );
}
