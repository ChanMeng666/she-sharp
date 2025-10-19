"use client";

import React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type ImpactItem = {
  title: string;
  value: string;  
  desc: string;
};


const impactData: ImpactItem[] = [
  {
    title: "Active Members",
    value: "2200+",
    desc: "Women in tech building connections and advancing careers.",
  },
  {
    title: "Events Since 2014",
    value: "84+",
    desc: "Workshops and conferences empowering women in tech.",
  },
  {
    title: "Partner Companies",
    value: "50+",
    desc: "Leading tech companies supporting our mission.",
  },
  {
    title: "Career Success Stories",
    value: "500+",
    desc: "Women advancing careers through mentorship and networking.",
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
}: {
  item: ImpactItem;
  animate: boolean;
}) {
  return (
    <div
      role="group"
      tabIndex={0}
      className="rounded-2xl overflow-hidden bg-white border-1 border-navy-dark hover:bg-periwinkle-soft/50 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:-translate-y-0.5 focus-within:shadow-lg"
    >
       <div className="p-5 w-full h-80 flex flex-col justify-between text-navy-dark">
        <h3 className="text-lg font-bold">{item.title}</h3>

        <div className="text-right">
          <div className="text-6xl font-extrabold tabular-nums tracking-tight mb-4 text-navy-dark">
            {(() => {
              const { target, suffix } = parseTargetValue(item.value);
              return (
                <>
                  <AnimatedNumber target={target} animate={animate} />
                  {" "}{suffix}
                </>
              );
            })()}
          </div>
          <div className="h-px w-full mb-4 bg-navy-dark/90" />
          <p className="text-navy-dark/80 text-sm leading-relaxed">
            {item.desc}
          </p>
        </div>
      </div>
    </div>
  );
}



export function CoreImpactSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Section>
      <div ref={ref} className="relative">
        <Container size="full">
          {/* Header */}
          <div className="text-center mb-8 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
              A Decade of Measurable Impact
            </h2>
          </div>

           {/* Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {impactData.map((item, i) => (
              <StatCard
                key={i}
                item={item}
                animate={inView && !reduceMotion}
              />
            ))}
          </div>
        </Container>
      </div>
    </Section>
  );
}
