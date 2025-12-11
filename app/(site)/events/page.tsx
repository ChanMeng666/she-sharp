'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { EventInflectedCard } from '@/components/events/event-inflected-card';
import { getAllEvents, getFeaturedEvent } from '@/lib/data/events';

// Sample hero image
const HERO_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80';

function HeroButtons({ slug }: { slug: string }) {
  const [isHovered, setIsHovered] = useState<'details' | 'register' | null>(null);

  return (
    <div className="flex gap-3">
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
        style={{
          backgroundColor: isHovered === 'details' ? '#333333' : '#000000',
          color: '#ffffff',
        }}
        onMouseEnter={() => setIsHovered('details')}
        onMouseLeave={() => setIsHovered(null)}
      >
        View Details
        <ArrowRight className="w-5 h-5" />
      </Link>
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border-2"
        style={{
          backgroundColor: isHovered === 'register' ? '#000000' : 'transparent',
          color: isHovered === 'register' ? '#ffffff' : '#000000',
          borderColor: '#000000',
        }}
        onMouseEnter={() => setIsHovered('register')}
        onMouseLeave={() => setIsHovered(null)}
      >
        Register Now
      </Link>
    </div>
  );
}

export default function EventsPage() {
  const featuredEvent = getFeaturedEvent();
  const allEvents = getAllEvents();
  const [isImageHovered, setIsImageHovered] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Full width image with InflectedCard style */}
      {featuredEvent && (
        <Section className="bg-surface-periwinkle" spacing="section">
          <Container size="full">
            <div
              className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#f4f4fa' }}
            >
              {/* Image */}
              <div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                onMouseEnter={() => setIsImageHovered(true)}
                onMouseLeave={() => setIsImageHovered(false)}
              >
                <Image
                  src={HERO_IMAGE}
                  alt={featuredEvent.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-transform duration-300"
                  style={{
                    transform: isImageHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              </div>

              {/* Buttons container with curved corner effect */}
              <div
                className="absolute bottom-0 right-0 pt-8 pl-8 rounded-tl-[3rem]"
                style={{ backgroundColor: '#f4f4fa' }}
              >
                {/* Curved corner pseudo-elements */}
                <div
                  className="absolute bottom-0 -left-8 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: '2rem',
                    boxShadow: '0.5rem 0.5rem 0 0.5rem #f4f4fa',
                  }}
                />
                <div
                  className="absolute -top-8 right-0 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: '2rem',
                    boxShadow: '0.5rem 0.5rem 0 0.5rem #f4f4fa',
                  }}
                />

                {/* Buttons */}
                <div className="pb-6 pr-6">
                  <HeroButtons slug={featuredEvent.slug} />
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* All Events Section */}
      <Section className="bg-surface-periwinkle" spacing="section">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                All Events
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover our workshops, networking events, conferences and more
              </p>
            </div>
          </div>

          {/* Events Grid with Inflected Cards */}
          {allEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event, index) => (
                <EventInflectedCard key={event.slug} event={event} index={index} />
              ))}
            </div>
          )}
        </Container>
      </Section>

    </div>
  );
}
