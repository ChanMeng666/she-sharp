"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Calendar, Award, BookOpen, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const communityFeatures = [
  {
    icon: MessageSquare,
    title: "Private Slack Community",
    description: "Connect with 120+ mentors across industries, share experiences, and get advice",
    features: ["Industry channels", "Mentorship tips", "Resource sharing"],
    color: "purple"
  },
  {
    icon: Calendar,
    title: "Monthly Mentor Meetups",
    description: "Virtual and in-person gatherings to network and learn from each other",
    features: ["Guest speakers", "Best practices", "Social events"],
    color: "mint"
  },
  {
    icon: BookOpen,
    title: "Mentor Training Resources",
    description: "Access to exclusive training materials and workshops",
    features: ["Coaching techniques", "Communication skills", "Leadership development"],
    color: "periwinkle"
  },
  {
    icon: Award,
    title: "Recognition Program",
    description: "Annual awards celebrating exceptional mentors and their impact",
    features: ["Mentor of the Year", "Impact stories", "Public recognition"],
    color: "navy"
  }
];

export function MentorCommunitySection() {
  return (
    <Section className="py-16 lg:py-24 bg-background">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-muted text-foreground border-border">
            Exclusive Access
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join Our Thriving Mentor Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            As a She Sharp mentor, you're not just guiding one mentee – you're joining a vibrant
            community of leaders committed to empowering women in STEM.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {communityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <feature.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.features.map((item) => (
                          <Badge key={item} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-foreground rounded-2xl p-8 lg:p-12 text-background text-center"
        >
          <div className="flex justify-center mb-6">
            <Globe className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold mb-4">
            Connect with Mentors Worldwide
          </h3>
          <p className="text-background/90 mb-8 max-w-2xl mx-auto">
            Our mentors come from diverse backgrounds and locations, creating a rich tapestry
            of experiences and perspectives. Join us in building a global network of support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="bg-background text-foreground hover:bg-muted"
            >
              <Users className="mr-2 h-5 w-5" />
              Meet Current Mentors
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background text-background hover:bg-background/10"
            >
              <Link href="/contact">
                Learn More
              </Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}