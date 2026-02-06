import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MentorshipBenefits() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 ">
        <div className="mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-display-sm text-foreground max-w-xl">
            What You Get Out of A Mentorship Program
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Research shows participating in a mentorship program provides valuable benefits for both
            mentees and mentors.
          </p>
        </div>

        <div className="flex gap-4 px-1 md:px-0 py-4 md:py-6 min-h-[260px] items-stretch">
          <Card className="@container/card flex-1 flex flex-col rounded-xl overflow-hidden border border-border/30 bg-gradient-to-t from-primary/5 to-card backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand tabular-nums @[250px]/card:text-5xl">
                85%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base mt-auto">
              <div className="text-muted-foreground leading-relaxed">
                Feel more empowered after joining a mentorship program
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card flex-1 flex flex-col rounded-xl overflow-hidden border border-border/30 bg-gradient-to-t from-primary/5 to-card backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand tabular-nums @[250px]/card:text-5xl">
                90%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base mt-auto">
              <div className="text-muted-foreground leading-relaxed">
                Experienced improvement of their interpersonal skills
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card flex-1 flex flex-col rounded-xl overflow-hidden border border-border/30 bg-gradient-to-t from-primary/5 to-card backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand tabular-nums @[250px]/card:text-5xl">
                6x more
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base mt-auto">
              <div className="text-muted-foreground leading-relaxed">
                Mentors are likely to be promoted
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card flex-1 flex flex-col rounded-xl overflow-hidden border border-border/30 bg-gradient-to-t from-primary/5 to-card backdrop-blur-md backdrop-saturate-150 shadow-lg shadow-black/5 hover:border-brand/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/10">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand tabular-nums @[250px]/card:text-5xl">
                5x more
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base mt-auto">
              <div className="text-muted-foreground leading-relaxed">
                Mentees with mentors are likely to be promoted
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
