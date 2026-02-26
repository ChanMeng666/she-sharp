"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function HeroSection() {
  return (
    <section className="relative py-16 md:min-h-[95vh] md:flex md:items-center overflow-hidden">
      {/* Full background image */}
      <div className="absolute inset-0">
        <Image
          src="/img/mind.jpg"
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Frosted glass overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-slate-500/30" />

      {/* Secondary sun glow - creates depth */}
      <div
        className="absolute -top-10 -right-10 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(255,255,220,0.9) 0%, rgba(255,200,100,0.5) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Tertiary warm glow - extra warmth */}
      <div
        className="absolute -top-32 -right-40 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full opacity-30 animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(255,200,100,0.6) 0%, rgba(255,150,50,0.3) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Light rays */}
      <div
        className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-30"
        style={{
          background: `
            linear-gradient(135deg, rgba(255,220,150,0.4) 0%, transparent 40%),
            linear-gradient(125deg, rgba(255,200,100,0.3) 0%, transparent 35%),
            linear-gradient(145deg, rgba(255,180,80,0.2) 0%, transparent 45%)
          `,
        }}
      />


      {/* Lens flare effect */}
      <div
        className="absolute top-12 right-24 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-40 animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,240,200,0.4) 30%, transparent 70%)",
          filter: "blur(15px)",
        }}
      />

      {/* Secondary lens flare */}
      <div
        className="absolute top-40 right-[45%] w-16 h-16 md:w-24 md:h-24 rounded-full opacity-50 animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(255,200,100,0.6) 0%, transparent 70%)",
          filter: "blur(10px)",
          animationDelay: "1s",
        }}
      />

      {/* Golden dust particles */}
      <div
        className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none"
        style={{
          background: `
            radial-gradient(2px 2px at 20% 30%, rgba(255,220,150,0.8) 0%, transparent 100%),
            radial-gradient(2px 2px at 40% 70%, rgba(255,200,100,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,200,0.9) 0%, transparent 100%),
            radial-gradient(2px 2px at 80% 50%, rgba(255,220,150,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 60%, rgba(255,240,180,0.8) 0%, transparent 100%),
            radial-gradient(2px 2px at 70% 80%, rgba(255,200,100,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 30%, rgba(255,255,220,0.8) 0%, transparent 100%),
            radial-gradient(2px 2px at 35% 90%, rgba(255,220,150,0.6) 0%, transparent 100%)
          `,
        }}
      />

      {/* Warm light wash overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(135deg, rgba(255,200,100,0.4) 0%, transparent 50%, rgba(255,150,50,0.2) 100%)",
        }}
      />

      {/* Sparkle particles - enhanced */}
      <div className="absolute top-20 right-40 w-2 h-2 bg-white/80 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
      <div className="absolute top-32 right-60 w-1.5 h-1.5 bg-yellow-200/70 rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
      <div className="absolute top-48 right-32 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDuration: "2.5s", animationDelay: "1s" }} />
      <div className="absolute top-16 right-80 w-1.5 h-1.5 bg-yellow-100/80 rounded-full animate-ping" style={{ animationDuration: "3.5s", animationDelay: "0.3s" }} />
      <div className="absolute top-40 right-96 w-1 h-1 bg-white/70 rounded-full animate-ping" style={{ animationDuration: "2.8s", animationDelay: "0.8s" }} />

      {/* Additional sparkles for more depth */}
      <div className="absolute top-24 right-20 w-1 h-1 bg-yellow-300/90 rounded-full animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.2s" }} />
      <div className="absolute top-56 right-48 w-2 h-2 bg-white/60 rounded-full animate-ping" style={{ animationDuration: "3.2s", animationDelay: "1.5s" }} />
      <div className="absolute top-12 right-56 w-1.5 h-1.5 bg-yellow-200/80 rounded-full animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.7s" }} />


      <Container className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 max-w-none xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
        <div className="relative flex flex-col xl:flex-row items-start xl:items-center gap-8 md:gap-10 xl:gap-8 mt-16 sm:mt-20 md:mt-24 xl:mt-0">
          {/* Left: Content area with heading and CTA */}
          <div className="w-full xl:w-auto xl:max-w-lg 2xl:max-w-xl text-left xl:shrink-0">
            <p className="font-brand-script text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 md:mb-4">
              Empowering futures
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase leading-[1.1] tracking-tight">
              <span
                className="bg-linear-to-r from-white via-[#e8c8f0] to-[#c4c1ff] bg-clip-text text-transparent drop-shadow-lg"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
                }}
              >
                Connecting women in
                <br />
                Technology
              </span>
            </h1>
            <div className="mt-6 sm:mt-8 md:mt-10 flex justify-start">
              <Button variant="ghost" size="lg" asChild className="px-6 bg-white/10 backdrop-blur-sm text-white border border-white/60 hover:bg-purple-dark transition-all rounded-full">
                <Link href="/events" target="_blank">Explore Our Events</Link>
              </Button>
            </div>
          </div>

          {/* Right: Video Player */}
          <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[75%] xl:flex-1 xl:max-w-2xl 2xl:max-w-4xl mx-auto xl:mx-0">
            {/* Video Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/video/home-page-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
