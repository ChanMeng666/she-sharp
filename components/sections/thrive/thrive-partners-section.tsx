'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ThrivePartnersSection() {
  const partners = [
    {
      name: 'She Sharp',
      description: 'Empowering women in STEM through mentorship and community',
      role: 'Co-organizer'
    },
    {
      name: 'TechBabesNZ',
      description: 'Building a supportive network for women in technology',
      role: 'Co-organizer'
    },
    {
      name: 'HPE',
      description: 'Providing world-class venue and facilities',
      role: 'Venue Sponsor'
    }
  ]

  return (
    <Section bgColor="accent">
      <Container size="content">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Event Partners
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This event was made possible through collaboration
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl">{partner.name}</CardTitle>
                <p className="text-sm text-foreground font-medium">
                  {partner.role}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {partner.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}