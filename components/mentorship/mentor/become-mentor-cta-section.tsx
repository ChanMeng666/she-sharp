"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function BecomeMentorCTASection() {
  const stats = [
    { icon: Users, value: "100+", label: "Active Mentees" },
    { icon: Clock, value: "6 hrs", label: "Min. Commitment" },
    { icon: Sparkles, value: "4.8/5", label: "Satisfaction" },
  ];

  return (
    <Section className="py-16 lg:py-24 bg-gradient-to-r from-purple-dark to-periwinkle-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      <Container className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            READY TO MAKE A DIFFERENCE?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join our community of mentors and help shape the next generation of women in STEM
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <stat.icon className="h-8 w-8 mb-2 text-mint-light" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-purple-dark hover:bg-gray-100 font-semibold px-8"
            >
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSd00tgJNa8BQM8wVtLHz7We_AQ1zRT0yVYcFP_hZlpwEVAHlQ/viewform?usp=sf_link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Apply to be a Mentor
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              Learn More About Mentorship
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}