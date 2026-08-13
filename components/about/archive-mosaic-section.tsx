"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import {
  curatedImages,
  type CuratedImageKey,
} from "@/public/img/curated";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

// Three columns of curated frames (card/divider role; excludes the five
// About-carousel heroes). Each column drifts at its own rate.
const COLUMNS: CuratedImageKey[][] = [
  [
    "connection-google-aut",
    "workshop-design-thinking",
    "panel-fireside-chat",
    "celebration-group-smiles",
    "speaker-own-your-energy",
    "workshop-girls-night-build",
  ],
  [
    "audience-centrality-laughter",
    "panel-her-waka",
    "workshop-team-build",
    "celebration-imagine-zone",
    "connection-ai-hackathon",
    "detail-sketch-hands",
  ],
  [
    "speaker-audience",
    "mentoring-huddle",
    "divider-aws-community",
    "workshop-rpa-laughter",
    "celebration-awards",
    "panel-mic-moment",
  ],
];

// Mixed aspect ratios and radii give the mosaic an editorial, hand-set rhythm.
const ASPECTS = ["aspect-[4/3]", "aspect-square", "aspect-[3/4]"];
const RADII = ["rounded-xl", "rounded-2xl"];

function MosaicTile({ imgKey, index }: { imgKey: CuratedImageKey; index: number }) {
  const img = curatedImages[imgKey];
  return (
    <div
      className={`relative w-full overflow-hidden border border-border ${ASPECTS[index % ASPECTS.length]} ${RADII[index % RADII.length]}`}
    >
      <Image
        src={img.src}
        fill
        sizes="(max-width: 768px) 45vw, 300px"
        alt={img.alt}
        className="object-cover"
      />
    </div>
  );
}

// "The archive" — a drifting three-column mosaic framed by the Sharp Grid
// crop-mark signature. Columns scroll at different rates on desktop; drift is
// reduced on mobile and disabled under reduced motion.
export function ArchiveMosaicSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Per-column drift; halved on mobile so short columns stay calm.
  const f = isDesktop ? 1 : 0.4;
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", `${-6 * f}%`]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", `${4 * f}%`]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", `${-10 * f}%`]);
  const ys = [y1, y2, y3];

  return (
    <Section bgColor="white">
      <Container>
        <div className="max-w-2xl">
          <p className="text-label text-brand">The archive</p>
          <h2 className="text-display-sm mt-3 text-foreground">
            Ten years, one community
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-600 md:text-base">
            Every photo across this site is from our own events — a decade of
            women in tech showing up for each other.
          </p>
        </div>

        {/* Sharp Grid crop-mark frame — hairline marks extending past the
            mosaic's corners. */}
        <div ref={ref} className="relative mt-12 md:mt-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-3 -right-3 -top-3 h-px bg-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-3 -right-3 -bottom-3 h-px bg-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-3 -bottom-3 -left-3 w-px bg-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-3 -bottom-3 -right-3 w-px bg-ink-300"
          />

          <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 md:gap-4">
            {COLUMNS.map((column, colIndex) => (
              <motion.div
                key={colIndex}
                className={`flex flex-col gap-3 md:gap-4 ${colIndex === 2 ? "hidden md:flex" : ""}`}
                style={reduceMotion ? undefined : { y: ys[colIndex] }}
              >
                {column.map((key, i) => (
                  <MosaicTile key={key} imgKey={key} index={i + colIndex} />
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center md:mt-16">
          <Button asChild variant="outline" size="lg">
            <Link href="/resources/photo-gallery">Browse the photo gallery</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
