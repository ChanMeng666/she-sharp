'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, MessageSquare, Users, Trophy } from 'lucide-react'

export function ThriveFeaturesSection() {
  const features = [
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: 'CV Reviews',
      description: 'Get personalized feedback on your CV from industry professionals',
      color: 'bg-muted text-foreground'
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Mock Interviews',
      description: 'Practice interview skills with experienced mentors',
      color: 'bg-muted text-foreground'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Speed Mentoring',
      description: 'Connect with multiple mentors in quick, focused sessions',
      color: 'bg-muted text-foreground'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Career Insights',
      description: 'Learn from successful professionals across various industries',
      color: 'bg-muted text-foreground'
    }
  ]

  return (
    <Section bgColor="white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Attendees Experienced
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            THRIVE offered unique opportunities for professional growth and networking
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="text-center hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}