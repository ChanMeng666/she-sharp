'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent } from '@/components/ui/card'
import { Quote, Star } from 'lucide-react'

export function ThriveTestimonialsSection() {
  const testimonials = [
    {
      quote: "The speed mentoring sessions were incredibly valuable. I got insights from multiple industry professionals in one evening!",
      author: "Sarah Chen",
      role: "Graduate Student"
    },
    {
      quote: "THRIVE provided practical advice and real connections. The CV feedback alone was worth attending.",
      author: "Michael Johnson",
      role: "Career Changer"
    },
    {
      quote: "As a mentor, I was impressed by the quality of questions and the enthusiasm of the participants. It was truly rewarding.",
      author: "Emma Williams",
      role: "Senior Developer"
    }
  ]

  return (
    <Section bgColor="white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What People Are Saying
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hear from attendees and mentors about their THRIVE experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-8">
                <Quote className="h-8 w-8 text-muted-foreground absolute top-4 left-4" />
                <blockquote className="text-gray-700 dark:text-gray-300 mb-4 pt-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <cite className="text-foreground font-medium not-italic">
                    {testimonial.author}
                  </cite>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}