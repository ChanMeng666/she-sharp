"use client";

import { useRef, useEffect, useState } from "react";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { getAllSponsorLogos } from "@/lib/data/events";

interface LogoItem {
  name: string;
  logo: string;
}

/**
 * A single infinitely-scrolling row of logos.
 *
 * Renders a hidden "measure" element to get the exact pixel width of one
 * complete set, then duplicates it enough times to fill 2x+ the viewport
 * for a seamless CSS-animation loop.
 */
function LogoRow({
  logos,
  heightClass,
  opacity,
  gapPx,
  duration,
  reverse = false,
}: {
  logos: LogoItem[];
  heightClass: string;
  opacity: number;
  gapPx: number;
  duration: number;
  reverse?: boolean;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      if (measureRef.current) {
        setSetWidth(measureRef.current.offsetWidth);
      }
    };

    measure();

    const images = el.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;

    const onLoad = () => {
      loaded++;
      if (loaded >= total) measure();
    };

    images.forEach((img) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener("load", onLoad);
      }
    });
    if (loaded >= total) measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      images.forEach((img) => img.removeEventListener("load", onLoad));
      ro.disconnect();
    };
  }, [logos]);

  const MIN_COPIES = 4;
  const copies =
    setWidth > 0 ? Math.max(Math.ceil(3000 / setWidth) + 2, MIN_COPIES) : 6;

  const setStyle = { gap: `${gapPx}px`, paddingRight: `${gapPx}px` };

  const logoSet = (key: string) => (
    <div key={key} className="flex items-center shrink-0" style={setStyle}>
      {logos.map((logo, i) => (
        <div key={`${key}-${i}`} className="shrink-0">
          <img
            src={logo.logo}
            className={`${heightClass} w-auto`}
            style={{ opacity }}
            alt={logo.name}
            loading="eager"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden">
      {/* Hidden measure element */}
      <div
        ref={measureRef}
        aria-hidden
        className="flex items-center shrink-0 absolute invisible pointer-events-none"
        style={setStyle}
      >
        {logos.map((logo, i) => (
          <div key={`m-${i}`} className="shrink-0">
            <img
              src={logo.logo}
              className={`${heightClass} w-auto`}
              alt=""
              loading="eager"
            />
          </div>
        ))}
      </div>

      {/* Scrolling track */}
      <div
        className="flex"
        style={{
          animation:
            setWidth > 0
              ? `logoScroll ${duration}s linear infinite ${reverse ? "reverse" : ""}`
              : "none",
          willChange: "transform",
          backfaceVisibility: "hidden",
          ["--logo-set-width" as string]: `${setWidth}px`,
        }}
      >
        {Array.from({ length: copies }, (_, i) => logoSet(`s${i}`))}
      </div>
    </div>
  );
}

export function ScrollingSponsorsSection() {
  const allLogos = getAllSponsorLogos();

  if (allLogos.length === 0) return null;

  const midpoint = Math.ceil(allLogos.length / 2);
  const row1 = allLogos.slice(0, midpoint);
  const row2 = allLogos.slice(midpoint);

  return (
    <Section className="bg-white overflow-hidden pt-4 md:pt-8">
      <Container size="full">
        <h2 className="text-xl md:text-2xl text-gray-400 text-center mb-10 md:mb-14">
          Sponsors who have supported our events
        </h2>
      </Container>

      <div className="relative space-y-6 md:space-y-8">
        {/* Gradient fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 md:w-40 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, white, transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 md:w-40 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, white, transparent)",
          }}
        />

        {/* Row 1 */}
        <LogoRow
          logos={row1}
          heightClass="h-6 sm:h-8 md:h-10"
          opacity={0.9}
          gapPx={80}
          duration={40}
        />

        {/* Row 2 - reversed direction */}
        {row2.length > 0 && (
          <LogoRow
            logos={row2}
            heightClass="h-6 sm:h-8 md:h-10"
            opacity={0.9}
            gapPx={80}
            duration={32}
            reverse
          />
        )}
      </div>
    </Section>
  );
}
