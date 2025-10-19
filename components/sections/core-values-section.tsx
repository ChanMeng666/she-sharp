"use client";

import { Heart, Rocket, Target } from "lucide-react";
import Image from "next/image";

type CoreValue = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const coreValues: CoreValue[] = [
  {
    icon: Target,
    title: "Connect",
    description:
      "Building a strong network of women in tech through meaningful relationships.",
  },
  {
    icon: Heart,
    title: "Inspire",
    description:
      "Showcasing role models and success stories to motivate the next generation.",
  },
  {
    icon: Rocket,
    title: "Empower",
    description:
      "Providing tools, mentorship, and opportunities for career advancement.",
  },
];

export function CoreValuesSection() {
  return (
    <section className="relative py-14 sm:py-16 md:py-20 bg-periwinkle-soft/50">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-navy-dark">
            Our Core Values
          </h2>
          {/* <p className="mt-3 text-base sm:text-lg text-gray">
            What drives our community forward every day.
          </p> */}
        </div>

        <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
          <div className="relative">
            {/* Background div with slight tilt */}
            <div 
              className="absolute bg-purple-dark rounded-4xl transform rotate-4 translate-x-[-10px] translate-y-[-10px]"
              style={{ width: '700px', height: '480px' }}
            ></div>
            {/* Image positioned on top */}
            <Image
              src="/img/yourcareer.png"
              alt="Core Values"
              width={1000}
              height={1000}
              className="rounded-4xl relative z-10"
            />
          </div>
          <div>
            <ul className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              {coreValues.map((value) => (
                <li
                  key={value.title}
                  className="rounded-2xl border border-border/50 backdrop-blur-sm p-5 sm:p-6 md:p-7 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-periwinkle-dark/25"
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex w-30 aspect-square items-center justify-center rounded-xl bg-white/70">
                      <value.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-navy-dark font-heading">
                        {value.title}
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-navy-dark/70">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoreValuesSection;
