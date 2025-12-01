'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { User, Users, Calendar, Clock } from 'lucide-react'

export function ThriveDetailsSection() {
  const keynoteSpeaker = {
    name: 'Kathryn Sandford',
    role: 'M2M Recruitment',
    bio: 'Industry leader in talent acquisition and career development, bringing years of experience in helping professionals navigate their career journeys.',
    topic: 'Building Your Professional Brand'
  }

  const panelists = [
    { name: 'Irene Naidu', role: 'Facilitator', company: 'TechBabesNZ' },
    { name: 'Mahsa McCauley', role: 'Executive', company: 'She Sharp' },
    { name: 'Maria Clamor', role: 'Tech Professional', company: 'Industry Expert' },
    { name: 'Natasha Fernandez', role: 'Professional', company: 'Industry Expert' },
    { name: 'Shireen Chetty', role: 'Professional', company: 'Industry Expert' }
  ]

  const mentors = [
    { name: 'Dalia Raphael', expertise: 'Career Strategy' },
    { name: 'Kathryn Sandford', expertise: 'Recruitment & Talent' },
    { name: 'Irene Naidu', expertise: 'Tech Leadership' },
    { name: 'Mahsa McCauley', expertise: 'Executive Leadership' },
    { name: 'Maria Clamor', expertise: 'Technology' },
    { name: 'Natasha Fernandez', expertise: 'Professional Development' },
    { name: 'Matthew Hall-White', expertise: 'Industry Insights' },
    { name: 'Justine Hinton', expertise: 'Career Growth' },
    { name: 'Shireen Chetty', expertise: 'Professional Skills' },
    { name: 'Vivien Tu', expertise: 'Career Planning' },
    { name: 'Kai Ping (KP) Lew', expertise: 'Tech Industry' },
    { name: 'Libby Lavrova', expertise: 'Professional Development' },
    { name: 'Jamini Patel', expertise: 'Career Guidance' },
    { name: 'Isuru Fernando', expertise: 'Technical Skills' },
    { name: 'Prasanth Pavithran', expertise: 'Technology' },
    { name: 'Tuhi Cooper', expertise: 'Professional Growth' },
    { name: 'Caro Gao', expertise: 'Customer Success' },
    { name: 'Bahareh Jalili-Moghaddam', expertise: 'Management' }
  ]

  const agenda = [
    { time: '5:00 PM', activity: 'Registration & Welcome', icon: <Users className="w-4 h-4" /> },
    { time: '5:15 PM', activity: 'Karakia & Opening Remarks', icon: <User className="w-4 h-4" /> },
    { time: '5:25 PM', activity: 'Keynote: Kathryn Sandford', icon: <User className="w-4 h-4" /> },
    { time: '5:45 PM', activity: 'Panel Discussion: Industry Insights', icon: <Users className="w-4 h-4" /> },
    { time: '6:15 PM', activity: 'Speed Mentoring Round 1', icon: <Users className="w-4 h-4" /> },
    { time: '6:35 PM', activity: 'Speed Mentoring Round 2', icon: <Users className="w-4 h-4" /> },
    { time: '6:55 PM', activity: 'Speed Mentoring Round 3', icon: <Users className="w-4 h-4" /> },
    { time: '7:15 PM', activity: 'Closing Remarks & Networking', icon: <Users className="w-4 h-4" /> },
    { time: '7:30 PM', activity: 'Event Concludes', icon: <Clock className="w-4 h-4" /> }
  ]

  return (
    <Section bgColor="accent">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Event Program Details
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore the comprehensive program that made THRIVE a transformative experience
          </p>
        </div>

        <Tabs defaultValue="keynote" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="keynote">Keynote</TabsTrigger>
            <TabsTrigger value="panel">Panel</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>

          {/* Keynote Tab */}
          <TabsContent value="keynote">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Keynote Speaker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {keynoteSpeaker.name}
                    </h3>
                    <p className="text-foreground font-medium mb-4">{keynoteSpeaker.role}</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{keynoteSpeaker.bio}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="font-medium text-foreground mb-2">Keynote Topic:</p>
                    <p className="text-foreground font-semibold">
                      {keynoteSpeaker.topic}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel Tab */}
          <TabsContent value="panel">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Panel Discussion</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Industry leaders sharing insights on career resilience
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {panelists.map((panelist, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-foreground">
                        {panelist.name}
                      </h4>
                      <p className="text-sm text-foreground">
                        {panelist.role}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {panelist.company}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentors Tab */}
          <TabsContent value="mentors">
            <Card className="max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Speed Mentoring Sessions</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect with industry professionals for personalized guidance
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {mentors.map((mentor, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <p className="font-medium text-foreground text-sm">
                        {mentor.name}
                      </p>
                      <p className="text-xs text-foreground">
                        {mentor.expertise}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong className="text-foreground">Mentoring Format:</strong> Three 20-minute rounds 
                    where attendees rotated between mentors for focused discussions on career development, 
                    CV reviews, and interview preparation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agenda Tab */}
          <TabsContent value="agenda">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Event Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agenda.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div className="text-foreground">
                        {item.icon}
                      </div>
                      <span className="text-foreground font-medium min-w-[100px]">
                        {item.time}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.activity}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </Section>
  )
}