

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MentorshipBenefits() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-display-sm text-foreground max-w-xl">
            What You Get Out of A Mentorship Program
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Research shows participating in a mentorship program provides valuable benefits for both
            mentees and mentors.
          </p>
        </div>

        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card flex gap-4 px-1 md:px-0 py-4 md:py-6 min-h-[260px] overflow-x-auto *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
          <Card className="@container/card min-w-[260px] shrink-0">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-extrabold tabular-nums @[250px]/card:text-5xl">
                85%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base">
              <div className="text-muted-foreground leading-relaxed">
                Feel more empowered after joining a mentorship program
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card min-w-[260px] shrink-0">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-extrabold tabular-nums @[250px]/card:text-5xl">
                90%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base">
              <div className="text-muted-foreground leading-relaxed">
                Experienced improvement of their interpersonal skills
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card min-w-[260px] shrink-0">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-extrabold tabular-nums @[250px]/card:text-5xl">
                6x more
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base">
              <div className="text-muted-foreground leading-relaxed">
                Mentors are likely to be promoted
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card min-w-[260px] shrink-0">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-extrabold tabular-nums @[250px]/card:text-5xl">
                5x more
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-2 text-base">
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
