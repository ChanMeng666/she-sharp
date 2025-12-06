import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

// Hero images removed for minimalist design approach

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/video/home-page-hero.mp4" type="video/mp4" />
        </video>

      </div>

      <Container className="relative z-10 w-full max-w-7xl">
        <div className="relative mx-auto flex items-center justify-start">
          {/* Left: Content area with heading and CTA - using drop-shadow for text visibility */}
          <div className="max-w-xl p-6 sm:p-8 md:p-10 text-center lg:text-left drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold leading-tight tracking-tight uppercase text-white">
              CONNECTING WOMEN IN
              <br />
              TECHNOLOGY
            </h1>
            <div className="mt-12 flex justify-center lg:justify-start">
              <Button variant="brand" size="lg" asChild className="px-6">
                <Link href="#upcoming-event">Attend next event</Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          {/* <Image
            src="/img/hero-image.png"
            alt="Hero Image"
            width={1200}
            height={800}
            priority
            className="w-full max-w-[520px] sm:max-w-[640px] md:max-w-[820px] lg:max-w-[1000px] xl:max-w-[1200px]"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 50vw"
          /> */}
        </div>
      </Container>
    </section>
  );
}
