import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getGoogleEducatorEvent } from '@/lib/data/events/google-educator'
import { notFound } from 'next/navigation'

type PageProps = {
  params: { year: string }
}

export default function GoogleEducatorYearPage({ params }: PageProps) {
  const event = getGoogleEducatorEvent(params.year)
  if (!event) return notFound()

  return (
    <>
      {/* Back Navigation */}
      <Section bgColor="white" noPadding className="pt-24">
        <Container size="content">
          <Button asChild variant="ghost" className="mb-8 -ml-4">
            <Link href="/events/google-educator">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Conferences
            </Link>
          </Button>
        </Container>
      </Section>

      {/* Header */}
      <Section bgColor="white">
        <Container size="content">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-navy-dark mb-4">
              {event.year}
            </h1>
            <div className="flex flex-wrap justify-center gap-6 text-lg text-gray">
              <span className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                {event.date}
              </span>
              <span className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                {event.location}
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Visual */}
      {event.images[0] && (
        <Section className="pt-0">
          <Container size="content">
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
              <Image
                src={event.images[0]}
                alt={`Google Educator Conference ${event.year}`}
                fill
                className="object-cover"
                priority
              />
            </AspectRatio>
          </Container>
        </Section>
      )}

      {/* Highlights */}
      {event.highlights.length > 0 && (
        <Section>
          <Container size="narrow">
            <div>
              <h2 className="text-3xl font-bold text-navy-dark mb-6">Conference Highlights</h2>
              <ul className="space-y-3">
                {event.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-periwinkle-dark mr-3 mt-1">•</span>
                    <span className="text-lg text-gray">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section className="pb-24 md:pb-32 lg:pb-36">
        <Container size="narrow" className="text-center">
          <h2 className="text-3xl font-bold text-navy-dark mb-4">
            {event.status === 'upcoming' ? 'Join the Next Conference' : 'Explore More Events'}
          </h2>
          <p className="text-lg text-gray mb-8">
            {event.status === 'upcoming' ? 'Stay updated on registration and agenda.' : "Don't miss out on future events and opportunities"}
          </p>
          <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid">
            <Link href="/events">View Upcoming Events</Link>
          </Button>
        </Container>
      </Section>
    </>
  )
}


