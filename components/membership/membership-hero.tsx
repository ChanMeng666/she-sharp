import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MembershipHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f7e5f3] via-[#f3e8ff] to-[#fce7f3]">
      {/* Decorative background blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(155,46,131,0.12) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(137,130,255,0.15) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: Text content ── */}
          <div className="order-2 lg:order-1">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Become a{" "}
              <span className="relative inline-block text-brand">
                Member
                {/* Underline accent */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6 Q50 2 100 5 Q150 8 198 3"
                    stroke="#9b2e83"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              Join a thriving community of women in tech. Get access to
              mentorship, exclusive events, career resources, and meaningful
              connections that will accelerate your growth.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-wrap gap-4">
              <Link href="#membership-plans">
                <Button variant="brand" size="lg" className="rounded-full px-8">
                  Join Now
                </Button>
              </Link>
              <Link href="#benefits">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-brand/30 px-8 text-brand hover:bg-brand/5 hover:border-brand/60 hover:text-brand"
                >
                  See Benefits
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Right: Image grid ── */}
          <div className="order-1 lg:order-2">
            <div className="relative grid h-[420px] grid-cols-2 grid-rows-2 gap-3 sm:h-[500px]">
              {/* Large left image spanning 2 rows */}
              <div className="relative row-span-2 overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="/img/gallery/IMG_2418.jpg"
                  alt="She Sharp community members at an event"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 45vw, 25vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand/25 via-transparent to-transparent" />
              </div>

              {/* Top-right image */}
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/img/gallery/IMG_2475.jpg"
                  alt="She Sharp networking event"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 45vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand/20 via-transparent to-transparent" />
              </div>

              {/* Bottom-right image */}
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/img/gallery/Image_202606.jpg"
                  alt="She Sharp members connecting"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 45vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand/20 via-transparent to-transparent" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
