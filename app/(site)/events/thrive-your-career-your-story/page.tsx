'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';

export default function ThriveYourCareerYourStoryPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <section className="py-16 md:py-24">
        <Container size="content">
          <div className="grid gap-10 md:gap-12 md:grid-cols-2">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-periwinkle-light dark:border-periwinkle-dark/30">
              <Image
                src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg"
                alt="THRIVE: Your Career, Your Story"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <Badge className="absolute top-4 left-4 bg-mint-dark text-navy-dark border-0">In Person</Badge>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-navy-dark dark:text-white mb-2">
                  THRIVE: Your Career, Your Story
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  An evening of inspiring stories and career insights from women leaders in tech.
                </p>
              </div>

              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-periwinkle-dark" />
                  <span>March 15, 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-periwinkle-dark" />
                  <span>6:00 PM - 8:30 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-periwinkle-dark" />
                  <span>Auckland CBD</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="#registration">Register</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="https://calendar.google.com/calendar/u/0?cid=YmUwYTEzZGM2YTI4NjdmN2RhMTE0NGQ0MzcwZWYyMjJjZTZhYWYzYjE1YjA2MmZhMzVlNzlmNjBjOGVkMjJiYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t" target="_blank" rel="noopener noreferrer">View in Official Calendar</Link>
                </Button>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p>
                  Join us for an inspiring evening of career stories and networking. Hear from women
                  leaders in tech about their journeys, challenges, and practical advice to accelerate your career.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="registration" className="py-12 scroll-mt-24 md:scroll-mt-28">
        <Container size="content">
          <div className="rounded-xl border border-periwinkle-light dark:border-periwinkle-dark/30 p-6">
            <h2 className="text-xl font-semibold text-navy-dark dark:text-white mb-2">Register</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Registration details will be announced soon. Check back later or subscribe to the calendar.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="https://calendar.google.com/calendar/u/0?cid=YmUwYTEzZGM2YTI4NjdmN2RhMTE0NGQ0MzcwZWYyMjJjZTZhYWYzYjE1YjA2MmZhMzVlNzlmNjBjOGVkMjJiYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open in Google Calendar
              </Link>
            </Button>
          </div>
        </Container>人      
      </section>
    </div>
  );
}