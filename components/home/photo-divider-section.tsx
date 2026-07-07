import { ParallaxImage } from "@/components/ui/parallax";
import { curatedImages } from "@/public/img/curated";

// Full-bleed editorial breather between the impact band and the programmes.
// A curated venue photo drifts a few percent as it scrolls past. Text-free and
// decorative — hidden from assistive tech.
export function PhotoDividerSection() {
  const img = curatedImages["divider-venue-glasshouse"];

  return (
    <section aria-hidden>
      <ParallaxImage image={{ ...img, alt: "" }} amount={0.12} />
    </section>
  );
}
