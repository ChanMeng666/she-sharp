"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import {
  curatedImages,
  type CuratedImageKey,
} from "@/public/img/curated";
import { Container } from "@/components/layout/container";
import { globalStats } from "@/lib/data/stats";

// Known event years for a subset of curated frames — drives the small year
// chips. Only frames whose source event year is certain appear here.
const YEAR_BY_KEY: Partial<Record<CuratedImageKey, string>> = {
  "divider-city-backdrop": "2015",
  "workshop-tower-focus": "2015",
  "connection-smiles": "2015",
  "celebration-swag-bags": "2015",
  "divider-standing-group": "2023",
  "hero-thrive-speaker": "2023",
  "divider-group-warm": "2024",
  "hero-anniversary-crowd": "2024",
  "speaker-her-waka": "2026",
  "panel-women-in-ai": "2024",
  "workshop-fp-hackathon": "2023",
  "celebration-anniversary-booth": "2024",
};

// Two rows of distinct archive thumbnails (excludes the five About-carousel
// heroes). Small tiles, so overlap with heroes used elsewhere is acceptable.
const ROW_A: CuratedImageKey[] = [
  "divider-crowd-wide",
  "workshop-tower-focus",
  "panel-discussion",
  "divider-city-backdrop",
  "speaker-stage-spotlight",
  "divider-standing-group",
  "workshop-collaboration",
  "celebration-swag-bags",
  "panel-women-in-ai",
  "mentoring-huddle",
  "hero-thrive-speaker",
  "connection-smiles",
];

const ROW_B: CuratedImageKey[] = [
  "divider-community-room",
  "speaker-her-waka",
  "workshop-hands-on",
  "divider-group-warm",
  "panel-mic-moment",
  "workshop-fp-hackathon",
  "celebration-awards",
  "celebration-anniversary-booth",
  "workshop-rpa-laughter",
  "divider-trademe-group",
  "fireside-centrality",
  "connection-ai-hackathon",
];

// Cycling widths give the strip an editorial, irregular rhythm.
const WIDTHS = [
  "w-40 sm:w-56 md:w-72",
  "w-44 sm:w-64 md:w-80",
  "w-36 sm:w-52 md:w-64",
  "w-40 sm:w-60 md:w-[22rem]",
  "w-44 sm:w-64 md:w-72",
];

function Tile({ imgKey, index }: { imgKey: CuratedImageKey; index: number }) {
  const img = curatedImages[imgKey];
  const year = YEAR_BY_KEY[imgKey];
  return (
    <div
      className={`relative h-40 shrink-0 overflow-hidden rounded-xl border border-border md:h-56 ${WIDTHS[index % WIDTHS.length]}`}
    >
      <Image
        src={img.src}
        fill
        sizes="(max-width: 768px) 40vw, 320px"
        alt=""
        className="object-cover"
      />
      {year && (
        <span className="text-label absolute left-2 top-2 rounded-xl bg-white/90 px-2 py-0.5 text-[11px] tracking-normal text-foreground">
          {year}
        </span>
      )}
    </div>
  );
}

// Scroll-driven double filmstrip that celebrates the community photo archive.
// Row A drifts left, row B counter-drifts right as the section crosses the
// viewport. Decorative — hidden from assistive tech; static under reduced
// motion.
export function ArchiveFilmstripSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const xA = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const xB = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  return (
    <section ref={ref} className="overflow-hidden bg-muted py-16 md:py-24">
      <Container>
        <p className="text-label text-brand">From the archive</p>
        <p className="mt-2 max-w-xl text-sm text-ink-600 md:text-base">
          {globalStats.events.total}+ events since 2014 — every photo here is from our own community.
        </p>
      </Container>

      <div className="mt-10 space-y-4 md:mt-14 md:space-y-5" aria-hidden>
        <motion.div
          className="flex w-max gap-4 px-4 md:gap-5"
          style={reduceMotion ? undefined : { x: xA }}
        >
          {ROW_A.map((key, i) => (
            <Tile key={key} imgKey={key} index={i} />
          ))}
        </motion.div>
        <motion.div
          className="-ml-[8%] flex w-max gap-4 px-4 md:gap-5"
          style={reduceMotion ? undefined : { x: xB }}
        >
          {ROW_B.map((key, i) => (
            <Tile key={key} imgKey={key} index={i + 2} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
