"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Container } from "@/components/layout/container";
import { DonateForm } from "@/components/donate/donate-form";
import { curatedImages } from "@/public/img/curated";

// One-shot staggered rise for the stacked headline lines on first paint.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

export function DonateHero() {
  const reduceMotion = useReducedMotion();
  const hero = curatedImages["hero-celebration-handsup"];

  return (
    <section className="relative isolate flex min-h-[80vh] sm:min-h-[88vh] lg:min-h-[92vh] items-center overflow-hidden">
      {/* Full-bleed celebration photography behind the appeal. */}
      <Image
        src={hero.src}
        alt={hero.alt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />

      {/* Navy scrim (≤40% base) with a soft floor so the type stays legible. */}
      <div className="absolute inset-0 -z-10 bg-foreground/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/70 via-foreground/25 to-transparent" />

      <Container size="full" className="relative w-full py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Appeal copy */}
          <div className="max-w-xl">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="eyebrow-script mb-4 text-3xl text-mint sm:text-4xl"
            >
              Every dollar counts
            </motion.p>

            <motion.h1
              variants={reduceMotion ? undefined : container}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              className="text-display-md text-white"
            >
              <motion.span variants={line} className="block">
                Fuel the next
              </motion.span>
              <motion.span variants={line} className="block text-outline text-white">
                generation
              </motion.span>
              <motion.span variants={line} className="block">
                of women in tech<span className="text-mint">.</span>
              </motion.span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 max-w-md text-lg text-white/80"
            >
              Your donation funds mentorship programmes, workshops, and events
              that open real doors for women across Aotearoa.
            </motion.p>
          </div>

          {/* Donate form card */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:justify-self-end"
          >
            <div className="mx-auto w-full max-w-md rounded-[32px] border border-border bg-background p-8 shadow-sm sm:p-10">
              <p className="text-label mb-6 text-center text-ink-500">
                Choose your contribution
              </p>
              <DonateForm />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
