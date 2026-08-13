import Image from "next/image";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

export function FounderQuote() {
  return (
    <Section bgColor="accent" className="overflow-hidden">
      <div className="mx-auto max-w-[75rem] px-4 sm:px-6 lg:px-8">
        <Reveal variant="fade-up">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            {/* Quote — left */}
            <figure className="order-2 lg:order-1">
              {/* Giant purple quote mark */}
              <span
                aria-hidden="true"
                className="text-display-lg block font-heading leading-[0.6] text-brand"
              >
                &ldquo;
              </span>

              <blockquote className="mt-2 space-y-5 text-xl leading-relaxed text-foreground md:text-2xl">
                <p>
                  As the Founder of She Sharp, I am proud to lead an organisation
                  dedicated to empowering women in tech. Despite women making up
                  over half of the population, they represent only 20% of roles
                  in STEM fields.
                </p>
                <p className="text-lg text-ink-700 md:text-xl">
                  At She Sharp, we connect women with female role models, host
                  workshops, and dispel misconceptions about the industry. We
                  create an inclusive environment that empowers women to pursue
                  their passions in tech &mdash; a platform to network, develop
                  skills, and break down the barriers to a more diverse industry.
                </p>
                <p className="text-foreground">Join us in changing the face of tech.</p>
              </blockquote>

              <figcaption className="mt-8">
                <p className="text-lg font-semibold text-foreground">
                  Dr. Mahsa McCauley
                </p>
                <p className="text-ink-600">She Sharp &mdash; Founder and Director</p>
              </figcaption>
            </figure>

            {/* Portrait — right, hairline circle */}
            <div className="order-1 shrink-0 lg:order-2 lg:pt-6">
              <div className="relative h-40 w-40 overflow-hidden rounded-full border border-border sm:h-48 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64">
                <Image
                  src="/img/MahsaMcCauley.png"
                  alt="Dr. Mahsa McCauley, Founder and Director of She Sharp"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 12rem, 16rem"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
