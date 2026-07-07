import { Reveal } from "@/components/ui/reveal";

const BENEFITS = [
  {
    number: "85",
    suffix: "%",
    description: "Feel more empowered after joining a mentorship programme",
  },
  {
    number: "90",
    suffix: "%",
    description: "Experienced improvement of their interpersonal skills",
  },
  {
    number: "6",
    suffix: "x",
    description: "Mentors are more likely to be promoted",
  },
  {
    number: "5",
    suffix: "x",
    description: "Mentees with mentors are more likely to be promoted",
  },
] as const;

export function MentorshipBenefits() {
  return (
    <section className="bg-white py-24 lg:py-28 border-b border-border">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-16 max-w-3xl">
          <span className="text-label text-brand mb-4 block">By the numbers</span>
          <h2 className="text-display-sm text-foreground mb-4">
            What you get out of a mentorship programme
          </h2>
          <p className="text-base md:text-lg text-ink-600">
            Research shows participating in a mentorship programme provides
            valuable benefits for both mentees and mentors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-border">
          {BENEFITS.map((benefit, index) => (
            <Reveal
              key={index}
              delay={index * 80}
              className="flex flex-col gap-3 py-8 border-b border-border lg:border-b-0 lg:border-l lg:first:border-l-0 lg:px-8 lg:first:pl-0"
            >
              <div className="font-heading text-6xl md:text-7xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
                {benefit.number}
                <span className="text-brand">{benefit.suffix}</span>
              </div>
              <p className="text-base text-ink-600 leading-relaxed max-w-[16rem]">
                {benefit.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
