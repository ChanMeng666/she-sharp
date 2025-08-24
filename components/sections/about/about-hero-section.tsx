"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";
 
import Iridescence, { brandColors } from "@/components/effects/iridescence";

export function AboutHeroSection() {
  return (
    <Section noPadding className="relative overflow-hidden bg-white">
      <div className="relative min-h-[70vh] flex items-center">
        {/* Iridescence dynamic background (About variant) */}
        <div className="absolute inset-0 z-0">
          <Iridescence
            color={brandColors.navAbout}
            mouseReact={false}
            amplitude={0.10}
            speed={0.25}
            className="w-full h-full"
          />
          {/* Subtle overlay to improve text legibility */}
          <div className="absolute inset-0 bg-white/10" />
        </div>

        <Container>
          <div className="relative z-10 mx-auto max-w-3xl text-center text-white px-6 sm:px-0 py-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Changing the ratio in STEM
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/90">
              We open doors to STEM careers through mentorship, hands‑on programs, and people who care.
            </p>

            {/* Founder’s Note (always visible) */}
            <div className="mt-6 sm:mt-8 text-left bg-white/10 backdrop-blur-sm rounded-md p-4 sm:p-5">
              <div className="space-y-3 text-white/90">
                <p>
                  In 2014, we set out to make career paths into tech visible and reachable.
                </p>
                <p>
                  We’ve grown by doing the simple things well: practical support, peer learning, and consistent action.
                </p>
                <p className="italic text-white/80">
                  — Dr. Mahsa McCauley, Founder and Director
                </p>
              </div>
            </div>

            {/* Video Dialog Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="gradient"
                  size="lg"
                  className="mt-8 w-full gap-2 sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5" />
                  Watch Our Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0">
                <div className="aspect-video">
                  <video
                    className="h-full w-full"
                    src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/6494eca97a143f705f5a5436_Home%20Vid%201-1%20Placeholder-transcode.mp4"
                    controls
                    autoPlay
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Container>
      </div>
    </Section>
  );
}