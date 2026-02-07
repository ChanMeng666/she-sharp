"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const responsibilities = [
  {
    category: "Commitment",
    items: [
      "Stay dedicated to mentoring and initiate contact with your mentee regularly.",
      "Follow through on the plans and actions you've mutually agreed upon with your mentee."
    ]
  },
  {
    category: "Guidance",
    items: [
      "Help mentee in figuring out and setting their goals.",
      "Encourage mentee to nurture their independent thinking skills.",
      "Foster growth and celebrate achievements."
    ]
  },
  {
    category: "Communication",
    items: [
      "Listen to what your mentee needs, rather than just pushing your own thoughts.",
      "Don't hesitate to give constructive feedback."
    ]
  }
];

export function MentorResponsibilitiesSection() {
  return (
    <Section className="py-16 lg:py-24 bg-linear-to-br from-navy-light/20 via-white to-purple-light/20">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="mb-8">
              <Badge className="mb-4 bg-purple-light text-purple-dark border-purple-dark/20">
                Mentor Guidelines
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-dark mb-4">
                What it means to be A MENTOR
              </h2>
              <p className="text-lg text-gray">
                As a mentor, you play a crucial role in shaping the future of women in STEM. 
                Here's what we expect from our mentors:
              </p>
            </div>
            
            <div className="space-y-6 mb-8">
              {responsibilities.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6 border-gray/20 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-purple-dark mb-3">
                      {category.category}
                    </h3>
                    <ul className="space-y-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-mint-dark mt-0.5 shrink-0" />
                          <span className="text-gray leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-purple-dark hover:bg-purple-mid transition-colors"
              >
                <a 
                  href="https://forms.gle/msvCzw3qevVnPRvv7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Become a mentor
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-purple-dark text-purple-dark hover:bg-purple-light"
              >
                Download Mentor Guide
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d6d1507e385502912e7f_IMG_9898.jpg"
                alt="Mentorship meeting"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-dark/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-periwinkle-dark/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}