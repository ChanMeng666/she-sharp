"use client";

import Image from "next/image";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function FounderQuote() {
  return (
    <Section noPadding className="relative overflow-hidden bg-periwinkle py-16 md:py-24 lg:py-32">
      {/* Decorative circles */}
      <div className="hidden sm:block absolute top-12 right-[15%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#F5D5D5]/20" />
      <div className="absolute top-[35%] right-[8%] w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#E9A5A5]/50" />
      <div className="absolute bottom-[15%] right-[25%] w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#E9A5A5]/60" />
      <div className="hidden sm:block absolute bottom-0 right-[10%] w-64 h-64 md:w-80 md:h-80 rounded-full bg-[#F5D5D5]/20 translate-y-1/3" />
      <div className="hidden sm:block absolute bottom-[20%] left-[5%] w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#F5D5D5]/20 -translate-x-1/2" />

      <div className="relative z-10 max-w-8xl mx-auto px-6 md:px-12 lg:px-16">
        <AnimateOnScroll variant="fade-up">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Quote content - Left side */}
            <div className="flex-1 text-white order-2 lg:order-1">
              {/* Quote text with integrated quote mark */}
              <blockquote className="text-center lg:text-left text-base md:text-lg mb-8 space-y-4">
                <p>
                  <span className="text-white">"</span>As the Director of She Sharp, I am proud to lead an organisation dedicated to empowering women in tech. Despite women making up over half of the population, they represent only 20% of roles in STEM fields.
                </p>
                <p>
                  At She Sharp, we strive to connect women with female role models, host workshops, and dispel misconceptions about the industry. We aim to create an inclusive environment that empowers women to pursue their passions in tech. We provide a platform for women in STEM to network and develop skills, breaking down barriers and creating a more diverse industry.
                </p>
                <p>
                  Join us in changing the face of tech!"
                </p>
              </blockquote>

              {/* Author info */}
              <div className="text-center lg:text-left">
                <p className="font-bold text-lg md:text-xl">Dr. Mahsa McCauley</p>
                <p className="text-white/90 text-sm md:text-base">
                  She Sharp — Founder and Director
                </p>
              </div>
            </div>

            {/* Photo - Right side */}
            <div className="relative order-1 lg:order-2 shrink-0">
              {/* Light ring behind photo */}
              <div className="absolute inset-0 scale-110 rounded-full bg-[#F5D5D5]/50" />
              {/* Photo container */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-white/20">
                <Image
                  src="/img/MahsaMcCauley.png"
                  alt="Dr. Mahsa McCauley, Founder and Director of She Sharp"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </Section>
  );
}
