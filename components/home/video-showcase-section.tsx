import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

export function VideoShowcaseSection() {
  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal className="mb-12 md:mb-16">
          <span className="text-label mb-3 block text-brand">(04)</span>
          <h2 className="text-display-sm text-foreground">Our story</h2>
        </Reveal>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal variant="fade-right" className="lg:col-span-7">
            <div className="relative aspect-video overflow-hidden rounded-[32px] border border-border">
              <iframe
                src="https://www.youtube.com/embed/9HT-O-MHhTs"
                title="She Sharp anniversary event"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </Reveal>

          <Reveal variant="fade-left" className="lg:col-span-5">
            <figure>
              <span
                aria-hidden
                className="block font-brand-script text-6xl leading-none text-brand md:text-7xl"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 text-2xl font-medium leading-snug text-foreground md:text-3xl">
                Despite women making up over half of the population, they hold
                only a fifth of roles in STEM. We are here to change the face of
                tech.
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-bold text-foreground">Dr. Mahsa McCauley</p>
                <p className="text-sm text-ink-600">
                  Founder and Director, She Sharp
                </p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
