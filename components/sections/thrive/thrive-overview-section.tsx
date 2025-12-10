'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { CheckCircle, Handshake, Target, Sparkles } from 'lucide-react'
import Image from 'next/image'

export function ThriveOverviewSection() {
  const highlights = [
    'Keynote presentation by industry leader',
    'Panel discussion with diverse professionals',
    'Speed mentoring sessions',
    'CV review and feedback',
    'Interview preparation tips',
    'Networking opportunities'
  ]

  return (
    <Section bgColor="white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <Badge className="mb-4 bg-muted text-foreground border-border">
              <Sparkles className="h-3 w-3 mr-1" />
              About the Event
            </Badge>
            
            <h2 className="text-display-sm text-foreground mb-6">
              Empowering Professionals at Every Stage
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              THRIVE: Your Career, Your Story was a transformative evening designed to empower 
              professionals at all stages of their careers. Whether attendees were graduating soon, 
              changing careers, or seeking clarity in their next steps, this event provided practical 
              advice, real conversations, and personalized guidance.
            </p>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This collaborative event between She Sharp and TechBabesNZ brought together industry 
              leaders, experienced mentors, and aspiring professionals for an evening of learning, 
              networking, and growth.
            </p>
            
            <div className="space-y-3 mb-8">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-foreground mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 flex-wrap">
              <Badge className="px-4 py-2 bg-muted text-foreground border-border">
                <Handshake className="h-4 w-4 mr-2" />
                Partnership Event
              </Badge>
              <Badge className="px-4 py-2 bg-muted text-foreground border-border">
                <Target className="h-4 w-4 mr-2" />
                Industry Resilience
              </Badge>
            </div>
          </div>

          {/* Image Card */}
          <Card className="overflow-hidden">
            <AspectRatio ratio={16/9}>
              <div className="relative w-full h-full bg-foreground">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-background/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-10 w-10 text-background" />
                    </div>
                    <p className="text-2xl font-bold text-background mb-2">Sold Out Event</p>
                    <p className="text-background/90">90 professionals attended this transformative evening</p>
                  </div>
                </div>
              </div>
            </AspectRatio>
          </Card>
        </div>
      </Container>
    </Section>
  )
}