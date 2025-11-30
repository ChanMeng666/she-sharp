"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  newsletterTopics,
  recentIssues,
} from "@/lib/data/newsletters";

export function NewsletterPreviewSection() {
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
            Monthly Insights
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What's Inside Our Newsletter
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Each month, we deliver carefully curated content to help you grow your career, 
            expand your network, and stay inspired in your STEM journey.
          </p>
        </motion.div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {newsletterTopics.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                    <topic.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-gray">
                    {topic.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            Recent Newsletter Issues
          </h3>
          <div className="grid lg:grid-cols-3 gap-6">
            {recentIssues.map((issue, index) => (
              <Card key={issue.edition} className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">
                      {issue.edition}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {issue.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{issue.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {issue.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{highlight}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group"
                  >
                    Read This Issue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <p className="text-lg text-gray italic mb-4">
            "The She Sharp newsletter is my monthly dose of inspiration and practical advice. 
            It's helped me stay connected to the community and discover opportunities I wouldn't 
            have found otherwise."
          </p>
          <div>
            <p className="font-semibold text-foreground">Rachel Kim</p>
            <p className="text-sm text-gray">Software Engineer at Xero</p>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}