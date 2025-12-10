import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function FeaturedEventSection() {
  return (
    <Section className="py-16">
      <Container>
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src="https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685d16184e0d23702c5f2066_THRIVE%20Your%20Career%2C%20%20Your%20Story.jpg"
                alt="THRIVE: Your Career, Your Story"
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="p-8 md:p-12">
              <h2 className="text-display-sm text-foreground mb-4">
                THRIVE: Your Career, Your Story
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <CalendarDays className="h-5 w-5" />
                <span>July 30, 2025</span>
              </div>
              <div className="space-y-4 text-gray-700 mb-8">
                <p>
                  Are you a soon-to-be graduate, a recent graduate, or a professional 
                  ready for a career move? This event is designed just for you.
                </p>
                <p>
                  Join us for an empowering session focused on helping you take the 
                  next step in your career journey. Whether you&apos;re searching for 
                  your first job or exploring a career transition, this event will 
                  equip you with the tools, insights, and confidence you need.
                </p>
                <p className="font-semibold">We&apos;ll cover key topics including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Personal Branding</strong>: Learn how to present yourself 
                    confidently and authentically in the job market.
                  </li>
                  <li>
                    <strong>Assessing CVs</strong>: Get expert feedback on how to 
                    strengthen your CV to stand out from the crowd.
                  </li>
                  <li>
                    <strong>Interview Strategies</strong>: Discover practical tips to 
                    prepare for and succeed in interviews.
                  </li>
                  <li>
                    <strong>Mentorship Guidance</strong>: Hear from experienced 
                    professionals and gain valuable career advice tailored to your goals.
                  </li>
                </ul>
                <p>
                  This is more than a talk — it&apos;s a hands-on, interactive experience 
                  designed to help you build clarity, confidence, and connections. Open 
                  to all, but especially geared towards <strong>university students</strong>, 
                  <strong>recent graduates</strong>, and <strong>professionals seeking 
                  new opportunities</strong>.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/events">Learn more</Link>
              </Button>
            </CardContent>
          </div>
        </Card>
      </Container>
    </Section>
  );
}