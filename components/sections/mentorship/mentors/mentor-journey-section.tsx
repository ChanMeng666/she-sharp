"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const journeySteps = [
  {
    number: "01",
    title: "Apply & Get Matched",
    description: "Submit your application and get matched with a mentee based on expertise and goals",
    duration: "1-2 weeks",
    checklist: [
      "Complete mentor application",
      "Define your expertise areas",
      "Set availability preferences"
    ]
  },
  {
    number: "02",
    title: "Onboarding & Training",
    description: "Attend orientation and access our comprehensive mentor training resources",
    duration: "1 week",
    checklist: [
      "Attend mentor orientation",
      "Complete online training modules",
      "Connect with mentor community"
    ]
  },
  {
    number: "03",
    title: "First Meeting",
    description: "Meet your mentee and establish goals, expectations, and communication rhythm",
    duration: "Week 1",
    checklist: [
      "Schedule initial meeting",
      "Set mentorship goals together",
      "Establish meeting cadence"
    ]
  },
  {
    number: "04",
    title: "Ongoing Mentorship",
    description: "Regular meetings, goal tracking, and supporting your mentee's growth",
    duration: "6 months",
    checklist: [
      "Bi-weekly check-ins",
      "Progress reviews",
      "Skill development support"
    ]
  },
  {
    number: "05",
    title: "Celebrate & Continue",
    description: "Celebrate achievements and decide on continuing the mentorship relationship",
    duration: "Ongoing",
    checklist: [
      "Review accomplishments",
      "Provide final feedback",
      "Plan next steps together"
    ]
  }
];

export function MentorJourneySection() {
  return (
    <Section className="py-16 lg:py-24 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-muted text-foreground border-border">
            Your Journey
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Mentor Journey at She Sharp
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From application to impact – here's what your mentorship journey looks like
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line - hidden on mobile */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-muted" />

          <div className="space-y-8 lg:space-y-12">
            {journeySteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-6 ${
                  index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content Card */}
                <div className="w-full lg:w-5/12">
                  <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-foreground font-bold text-lg">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {step.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {step.duration}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <div className="space-y-2">
                      {step.checklist.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Timeline dot */}
                <div className="hidden lg:flex items-center justify-center w-2/12">
                  <div className="w-4 h-4 rounded-full bg-foreground ring-4 ring-muted" />
                </div>

                {/* Empty space for alternating layout */}
                <div className="hidden lg:block w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}