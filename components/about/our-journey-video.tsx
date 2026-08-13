import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

const YOUTUBE_VIDEO_ID = "s9oxO8nH8po";

export function OurJourneyVideo() {
  return (
    <Section id="our-journey" bgColor="white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal variant="fade-up">
          <div className="mb-8 text-center md:mb-12">
            <p className="text-label mb-4 text-brand">Our journey</p>
            <h2 className="text-display-sm text-foreground">
              Watch how it began
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-600 md:text-lg">
              A short film on how She Sharp is bridging the gender gap in STEM.
            </p>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-[32px] border border-border">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?start=2`}
              title="She Sharp — Our Journey"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
