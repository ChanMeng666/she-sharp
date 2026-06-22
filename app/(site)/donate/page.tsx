import { Metadata } from "next";
import { GraduationCap, Sparkles, Heart } from "lucide-react";
import { DonateForm } from "@/components/donate/donate-form";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support She Sharp's mission to empower women in STEM. Your donation helps fund mentorship programmes, workshops, and events across New Zealand.",
  alternates: { canonical: "/donate" },
};

const marqueeWords = [
  "Mentorship",
  "Education",
  "Inclusion",
  "Empowerment",
  "Connection",
  "STEM",
  "Community",
  "Leadership",
  "Accessibility",
  "Inspiration",
];

const impactCards = [
  {
    icon: GraduationCap,
    title: "Raising Awareness & Accessibility",
    description:
      "Bringing events and workshops to low decile schools, training teachers and educators on digital curriculums, and making sure She Sharp events are accessible through subsidised tickets.",
    accent: "Education · Outreach",
    accentColor: "text-[#8982ff]",
    cardBg: "bg-gradient-to-br from-[#1f1e44] to-[#2d2868]",
    iconBg: "bg-[#8982ff]/20",
    iconColor: "text-[#8982ff]",
    textColor: "text-white",
    descColor: "text-white/60",
    tall: true,
  },
  {
    icon: Sparkles,
    title: "Creating Memorable Experiences",
    description:
      "Accessible venues, nourishing food and drinks, AV equipment and tools for workshops — making sure attendees and volunteers have an amazing time at every event.",
    accent: null,
    accentColor: null,
    cardBg: "bg-[#f7e5f3]",
    iconBg: "bg-[#9b2e83]/15 group-hover:bg-white/20",
    iconColor: "text-[#9b2e83] group-hover:text-white",
    textColor: "text-[#1f1e44] group-hover:text-white",
    descColor: "text-[#1f1e44]/60 group-hover:text-white/75",
    hoverBg: "hover:bg-[#9b2e83]",
    tall: false,
  },
  {
    icon: Heart,
    title: "Support Our Mission",
    description:
      "Every dollar counts toward making our events engaging, fun and safe spaces for women and underrepresented groups in STEM across Aotearoa New Zealand.",
    accent: null,
    accentColor: null,
    cardBg: "bg-[#f4f4fa]",
    iconBg: "bg-[#8982ff]/15 group-hover:bg-white/20",
    iconColor: "text-[#8982ff] group-hover:text-white",
    textColor: "text-[#1f1e44] group-hover:text-white",
    descColor: "text-[#1f1e44]/60 group-hover:text-white/75",
    hoverBg: "hover:bg-[#8982ff]",
    tall: false,
  },
];

const stats = [
  { value: "3000+", label: "Members Empowered", sub: "and growing every year" },
  { value: "50+", label: "Corporate Sponsors", sub: "backing our mission" },
  { value: "94+", label: "Events Since 2014", sub: "across New Zealand" },
];

export default function DonatePage() {
  const doubled = [...marqueeWords, ...marqueeWords];

  return (
    <main className="overflow-x-hidden w-full">
      <GeoHead instructions={GEO_INSTRUCTIONS.donate} />

      {/* ── ATTENTION: Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1f1e44] via-[#2d2868] to-[#9b2e83] flex items-center min-h-[90vh]">

        {/* Ambient light blobs */}
        <div className="pointer-events-none absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-[#8982ff]/25 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 -left-32 h-[400px] w-[400px] rounded-full bg-[#b1f6e9]/12 blur-[100px]" />

        {/* Top rainbow accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#9b2e83] via-[#8982ff] to-[#b1f6e9]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-36 pb-32">

          {/* Hero copy */}
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h1
              className="animate-hero-fade-up text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.06] mb-6"
              style={{ animationDelay: "80ms" }}
            >
              Power the Next Generation<br />
              of Women in STEM.
            </h1>
            <p
              className="animate-hero-fade-up text-white/65 text-lg md:text-xl max-w-2xl mx-auto"
              style={{ animationDelay: "160ms" }}
            >
              Your donation funds mentorship programmes, workshops, and events
              that open real doors for women across Aotearoa.
            </p>
          </div>

          {/* Donate form card */}
          <div
            className="animate-hero-fade-up max-w-md mx-auto"
            style={{ animationDelay: "240ms" }}
          >
            <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/30">
              <p className="text-center text-[#1f1e44]/50 text-xs font-semibold tracking-widest uppercase mb-6">
                Choose your contribution
              </p>
              <DonateForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee strip ── */}
      <div className="bg-[#9b2e83] py-3.5 overflow-hidden">
        <div className="animate-marquee flex gap-14">
          {doubled.map((word, i) => (
            <span
              key={i}
              className="flex-shrink-0 text-white/70 text-[11px] font-semibold tracking-[0.26em] uppercase"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* ── INTEREST: Impact Bento ── */}
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f1e44] leading-tight mb-4 max-w-3xl">
              Every dollar creates real, measurable impact.
            </h2>
            <p className="text-[#1f1e44]/55 text-lg max-w-xl">
              Your contribution goes directly to the programmes that change lives across New Zealand.
            </p>
          </div>

          {/* Bento: 12-col, grid-flow-dense, zero empty cells */}
          <div className="grid grid-cols-1 md:grid-cols-12 grid-flow-dense gap-5">

            {/* Card A — tall, dark, cols 1-5, rows 1-2 */}
            <div className="md:col-span-5 md:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f1e44] to-[#2d2868] p-8 lg:p-10 flex flex-col justify-between min-h-[320px] md:min-h-0 cursor-default">
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-[#8982ff]/20 blur-2xl" />
              <div className="relative z-10">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <GraduationCap className="h-6 w-6 text-[#8982ff]" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white leading-snug">
                  Raising Awareness &amp; Accessibility
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  Bringing events and workshops to low decile schools, training teachers and educators on digital curriculums, and making sure She Sharp events are accessible through subsidised tickets.
                </p>
              </div>
              <p className="relative z-10 mt-8 text-sm font-semibold tracking-wide text-[#8982ff]">
                Education · Outreach
              </p>
            </div>

            {/* Card B — top right, cols 6-12 */}
            <div className="md:col-span-7 group rounded-3xl bg-[#f7e5f3] p-8 transition-all duration-500 hover:bg-[#9b2e83] cursor-default flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-500 group-hover:bg-white/20">
                  <Sparkles className="h-6 w-6 text-[#9b2e83] transition-colors duration-500 group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#1f1e44] transition-colors duration-500 group-hover:text-white">
                  Creating Memorable Experiences
                </h3>
                <p className="text-sm leading-relaxed text-[#1f1e44]/60 transition-colors duration-500 group-hover:text-white/75">
                  Accessible venues, nourishing food and drinks, AV equipment and tools for workshops — making sure attendees and volunteers have an amazing time.
                </p>
              </div>
            </div>

            {/* Card C — bottom right, cols 6-12 */}
            <div className="md:col-span-7 group rounded-3xl bg-[#f4f4fa] p-8 transition-all duration-500 hover:bg-[#8982ff] cursor-default flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl  transition-colors duration-500 group-hover:bg-white/20">
                  <Heart className="h-6 w-6 text-[#8982ff] transition-colors duration-500 group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#1f1e44] transition-colors duration-500 group-hover:text-white">
                  Support Our Mission
                </h3>
                <p className="text-sm leading-relaxed text-[#1f1e44]/60 transition-colors duration-500 group-hover:text-white/75">
                  Every dollar counts toward making our events engaging, fun and safe spaces for women and underrepresented groups in STEM across Aotearoa New Zealand.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── DESIRE: Dark stats ── */}
      <section className="py-24 md:py-28 bg-[#1f1e44]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((s) => (
              <div key={s.label} className="py-8 md:py-0 md:px-8">
                <p className="text-5xl md:text-6xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-white/80 font-semibold">{s.label}</p>
                <p className="text-white/40 text-sm mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTION: Final CTA ── */}
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1f1e44] leading-tight mb-4">
            Ready to make<br />a difference?
          </h2>
          <p className="text-[#1f1e44]/55 text-lg mb-12">
            Join thousands of supporters helping bridge the gender gap in STEM.
          </p>
          <DonateForm />
        </div>
      </section>

    </main>
  );
}
