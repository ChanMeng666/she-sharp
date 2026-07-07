"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { curatedImages } from "@/public/img/curated";

// One-shot staggered rise for the stacked headline lines on first paint.
const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const line: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

// Connect / Inspire / Empower — the three core commitments, folded in as a
// quiet strip beneath the call to action.
const COMMITMENTS = ["Connect", "Inspire", "Empower"] as const;

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const poster = curatedImages["hero-community-cheer"].src;

  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden">
      {/* Full-bleed muted event footage with a curated poster frame. */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      >
        <source src="/video/home-page-hero.mp4" type="video/mp4" />
      </video>

      {/* Flat navy scrim keeps the white type legible over the footage. */}
      <div className="absolute inset-0 -z-10 bg-foreground/40" />

      <Container size="full" className="relative w-full py-24">
        <div className="max-w-4xl">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="eyebrow-script mb-4 text-3xl text-mint sm:text-4xl md:text-5xl"
          >
            Empowering futures
          </motion.p>

          <motion.h1
            variants={reduceMotion ? undefined : container}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="text-display-lg text-white"
          >
            <motion.span variants={line} className="block">
              Connecting
            </motion.span>
            <motion.span variants={line} className="block text-outline text-white">
              women in
            </motion.span>
            <motion.span variants={line} className="block">
              technology<span className="text-mint">.</span>
            </motion.span>
          </motion.h1>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <Button asChild variant="brand" size="pill">
              <Link href="/events">See upcoming events</Link>
            </Button>
          </motion.div>

          <motion.ul
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            {COMMITMENTS.map((word, i) => (
              <li key={word} className="flex items-center gap-6">
                {i > 0 && (
                  <span aria-hidden className="text-mint">
                    /
                  </span>
                )}
                <span className="text-label text-white/80">{word}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
