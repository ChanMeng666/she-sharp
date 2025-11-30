"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Heart, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const benefits = [
  {
    icon: Heart,
    title: "Personal Fulfillment",
    description: "Find satisfaction in witnessing the growth and success of your mentee. Knowing you've played a part in their journey is genuinely rewarding.",
    color: "text-foreground",
    bgColor: "bg-muted"
  },
  {
    icon: Target,
    title: "Leave a positive mark",
    description: "Leave behind a positive impact that lasts long after your interactions. It's about making a difference, one mentee at a time!",
    color: "text-foreground",
    bgColor: "bg-muted"
  },
  {
    icon: TrendingUp,
    title: "Grow as you guide",
    description: "Develop strong leadership and communication abilities as you support your mentee. It's a win-win: they flourish, and you thrive right alongside them.",
    color: "text-foreground",
    bgColor: "bg-muted"
  }
];

export function MentorBenefitsSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Section bgColor="accent">
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            BENEFITS OF BECOMING A MENTOR
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our mentorship program and make a lasting impact while growing your own skills
          </p>
        </motion.div>
        
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={layoutClasses(
            "grid max-w-6xl mx-auto",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols3,
            layoutSystem.grids.content.gap
          )}
        >
          {benefits.map((benefit, index) => (
            <motion.div key={benefit.title} variants={item}>
              <Card className="h-full p-8 text-center hover:shadow-xl transition-all duration-150 group cursor-pointer border-border">
                <div className={`inline-flex p-4 rounded-full ${benefit.bgColor} mb-6 group-hover:scale-110 transition-transform duration-150`}>
                  <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}