'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Users,
  Clock,
  Building,
  CheckCircle
} from 'lucide-react'

export function ThriveHeroSection() {
  const eventDetails = {
    title: 'THRIVE: Your Career, Your Story',
    subtitle: 'Piki Ake: Rise up Auckland',
    date: 'Wednesday, July 30, 2025',
    time: '5:00 PM - 7:30 PM',
    venue: 'HPE',
    address: 'Level 19 PWC Tower, Commercial Bay, 15 Customs Street West, Auckland Central',
    capacity: 90,
    status: 'completed',
    theme: 'Industry Resilience'
  }

  return (
    <Section className="relative overflow-hidden bg-muted">
      <Container>
        <div className="py-12 md:py-16 lg:py-20">
          {/* Event Status Badge */}
          <div className="text-center mb-6">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Event Completed Successfully
            </Badge>
          </div>

          {/* Title Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3">
              {eventDetails.title}
            </h1>

            <p className="text-lg md:text-xl text-foreground font-semibold mb-4">
              {eventDetails.subtitle}
            </p>
            
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
              A collaborative event between She Sharp and TechBabesNZ focused on career development, 
              mentorship, and building professional resilience in the tech industry.
            </p>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border">
                <Calendar className="h-4 w-4 text-foreground mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Date</p>
                <p className="text-sm font-medium text-foreground">July 30, 2025</p>
              </div>

              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border">
                <Clock className="h-4 w-4 text-foreground mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                <p className="text-sm font-medium text-foreground">5:00 - 7:30 PM</p>
              </div>

              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border">
                <Building className="h-4 w-4 text-foreground mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Venue</p>
                <p className="text-sm font-medium text-foreground">HPE Tower</p>
              </div>

              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border">
                <Users className="h-4 w-4 text-foreground mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Attendees</p>
                <p className="text-sm font-medium text-foreground">90 Professionals</p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-muted/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-muted/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        </div>
      </Container>
    </Section>
  )
}