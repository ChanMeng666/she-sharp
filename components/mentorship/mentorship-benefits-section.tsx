import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const BENEFITS = [
  {
    value: "85%",
    description: "Feel more empowered after joining a mentorship program",
  },
  {
    value: "90%",
    description: "Experienced improvement of their interpersonal skills",
  },
  {
    value: "6x more",
    description: "Mentors are likely to be promoted",
  },
  {
    value: "5x more",
    description: "Mentees with mentors are likely to be promoted",
  },
] as const

const CARD_CLASSES =
  "@container/card flex flex-col rounded-xl overflow-hidden border border-border/30 bg-linear-to-t from-primary/5 to-card backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10"

export function MentorshipBenefits() {
  return (
    <section className="bg-white py-16 md:py-24 xl:py-32 border-y border-border/70">
      <div className="max-w-8xl mx-auto px-4 lg:px-6">
        <div className="mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-display-sm text-foreground max-w-xl mb-4">
            What You Get Out of A Mentorship Program
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
            Research shows participating in a mentorship program provides valuable benefits for both
            mentees and mentors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-1 md:px-0 py-4 md:py-6 min-h-[260px]">
          {BENEFITS.map((benefit, index) => (
            <Card key={index} className={CARD_CLASSES}>
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl font-bold text-brand tabular-nums @[250px]/card:text-5xl">
                  {benefit.value}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-2 text-base mt-auto">
                <div className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
