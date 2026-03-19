"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

const TIMELINE_LINE_OFFSET = 150;

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const effectiveHeight = Math.max(0, height - TIMELINE_LINE_OFFSET);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 15%", "end 65%"],
  });

  const heightTransform = useTransform(
    scrollYProgress,
    [0, 1],
    [0, effectiveHeight]
  );

  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full font-sans" ref={containerRef}>
      <div ref={ref} className="relative md:py-16">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:gap-8"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="md:h-10 absolute left-3 h-6 w-6 md:w-10 rounded-full bg-background border border-brand/30 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-brand/20 border border-brand/30 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-4xl font-bold text-brand">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-14 md:pl-0">
              <h3 className="md:hidden block mb-4 text-left text-2xl font-bold text-brand">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{ height: `${effectiveHeight}px` }}
          className="absolute md:left-8 left-[23px] top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-border to-transparent to-99% mask-[linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-linear-to-t from-brand via-[#c846ab] to-transparent from-0% via-10% rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
