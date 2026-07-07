import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";

export function MembershipHero() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: Text content ── */}
          <div className="order-2 lg:order-1">
            <p className="text-label text-ink-500 mb-5">Membership</p>
            <h1 className="text-display-md text-foreground">Become a member</h1>

            <p className="mt-6 mb-8 max-w-lg text-lg leading-relaxed text-ink-700 md:text-xl">
              Join a thriving community of women in tech. Get access to
              mentorship, exclusive events, career resources, and meaningful
              connections that will accelerate your growth.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-wrap gap-4">
              <Button asChild variant="brand" size="lg" className="rounded-full px-8">
                <Link href="#membership-plans">Join now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="#benefits">See benefits</Link>
              </Button>
            </div>
          </div>

          {/* ── Right: Image grid (hairline frames) ── */}
          <div className="order-1 lg:order-2">
            <div className="relative grid h-[420px] grid-cols-2 grid-rows-2 gap-3 sm:h-[500px]">
              {/* Large left image spanning 2 rows */}
              <CurtainReveal className="relative row-span-2 border border-border p-1.5 bg-background">
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src="/img/gallery/IMG_2418.jpg"
                    alt="She Sharp community members at an event"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 25vw"
                    priority
                  />
                </div>
              </CurtainReveal>

              {/* Top-right image */}
              <CurtainReveal delay={90} className="relative border border-border p-1.5 bg-background">
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src="/img/gallery/IMG_2475.jpg"
                    alt="She Sharp networking event"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 20vw"
                  />
                </div>
              </CurtainReveal>

              {/* Bottom-right image */}
              <CurtainReveal delay={180} className="relative border border-border p-1.5 bg-background">
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src="/img/gallery/Image_202606.jpg"
                    alt="She Sharp members connecting"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 20vw"
                  />
                </div>
              </CurtainReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
