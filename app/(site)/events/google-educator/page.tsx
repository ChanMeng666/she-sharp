'use client'

import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  Lightbulb, 
  Code,
  GraduationCap,
  Calendar,
  MapPin,
  Quote,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { layoutSystem, layoutClasses } from '@/lib/layout-system'
import { getGoogleEducatorYears, getGoogleEducatorEvent, getLatestYear } from '@/lib/data/events/google-educator'

export default function GoogleEducatorPage() {
  const years = getGoogleEducatorYears()
  const defaultYear = getLatestYear(true) || years[0]

  return (
    <>
      {/* Hero */}
      <Section bgColor="accent" className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/bauhaus-1755865025052.svg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-periwinkle-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-mint-light/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 z-10" />

        {/* Global frosted glass overlay */}
        <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-md" />
        
        <Container size="wide" className="relative z-30">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-periwinkle-dark/10 text-periwinkle-dark border-periwinkle-dark/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Annual Conference
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-dark mb-4">
              Google Educator Conference
            </h1>
            <p className="text-lg md:text-xl text-gray max-w-2xl mx-auto mb-6">
              Empowering educators through technology and practical pedagogy
            </p>
            <Link 
              href="https://www.cs4hs.nz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-periwinkle-dark hover:text-periwinkle-dark/80 font-medium"
            >
              Formerly known as CS4HS
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* Conference Years */}
      <Section bgColor="white" spacing="section" className="pb-24 md:pb-32 lg:pb-36">
        <Container size="wide">
          <Tabs defaultValue={defaultYear} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              {years.map((y) => (
                <TabsTrigger key={y} value={y} className="text-lg">{y}</TabsTrigger>
              ))}
            </TabsList>

            {years.map((year) => {
              const data = getGoogleEducatorEvent(year)!
              return (
              <TabsContent key={year} value={year} className="mt-0">
                <div className={layoutClasses(
                  "grid items-center",
                  layoutSystem.patterns.splitLayout.gap,
                  "lg:grid-cols-2"
                )}>
                  {/* Image Section */}
                  <div className="order-2 lg:order-1">
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl shadow-xl">
                      <Image
                        src={data.images[0]}
                        alt={`Google Educator Conference ${year}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    </AspectRatio>
                  </div>

                  {/* Content Section */}
                  <div className="order-1 lg:order-2 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-navy-dark">
                          {year} Conference
                        </h2>
                        <Badge 
                          variant={data.status === 'upcoming' ? 'default' : 'secondary'}
                          className={data.status === 'upcoming' ? 'bg-mint-dark text-white' : ''}
                        >
                          {data.status === 'upcoming' ? 'Upcoming' : 'Past Event'}
                        </Badge>
                      </div>
                      <p className="text-xl text-purple-dark font-semibold mb-4">
                        Theme: {data.theme}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 text-gray">
                        <span className="flex items-center">
                          <Calendar className="mr-2 h-5 w-5 text-periwinkle-dark" />
                          {data.date}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-periwinkle-dark" />
                          {data.location}
                        </span>
                      </div>
                    </div>

                    <Button asChild size="lg" className="bg-periwinkle-dark hover:bg-periwinkle-dark/90">
                      <Link href={`/events/google-educator/${year}`}>
                        View Full Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              )
            })}
          </Tabs>
        </Container>
      </Section>

      {null}
    </>
  )
}