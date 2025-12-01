import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const volunteerRole = {
  title: "What it means to be an events Volunteer",
  description: "You'll be part of the team making sure our events run smoothly and that our attendees are having a fun, engaging time. This includes:",
  responsibilities: [
    "Being at the event for set up and pack down",
    "Welcoming, engaging, and chatting with attendees as they arrive and throughout the event",
    "Knowing your way around the venue",
    "Supporting our speakers and panellists",
    "Being a great representative for She Sharp with your friendly, passionate, and helpful attitude"
  ],
  image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e73a325a05fbc0e6e13_Join%20Our%20Team_3.png"
};

const ambassadorRole = {
  title: "What it means to be an ambassador",
  description: "Our Ambassadors make up She Sharp's core team and are responsible for:",
  responsibilities: [
    "Volunteering weekly and attending fortnightly team meetings",
    "Organising She Sharp events from ideation to execution",
    "Collaborating with our corporate sponsors",
    "Contributing to She Sharp's digital marketing with ideas for our newsletter, podcast and social media posts",
    "Attending events and engaging with She Sharp members throughout the year",
    "Being a great brand Ambassador for She Sharp and making an impact to bridge the gender gap in STEM"
  ],
  image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bba5904c40f11a7ff832e7_Mask%20group%20(1).png"
};

export function VolunteerRolesSection() {
  return (
    <Section className="py-16">
      <Container>
        <div className="space-y-16">
          {/* Events Volunteer */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {volunteerRole.title}
              </h3>
              <p className="text-gray-700 mb-6">{volunteerRole.description}</p>
              <ul className="space-y-3 mb-8">
                {volunteerRole.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-foreground mt-1 mr-3">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/contact">Become a volunteer</Link>
              </Button>
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image
                src={volunteerRole.image}
                alt="She Sharp event volunteers"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Ambassador */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden md:order-1">
              <Image
                src={ambassadorRole.image}
                alt="She Sharp ambassadors"
                fill
                className="object-cover"
              />
            </div>
            <div className="md:order-2">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {ambassadorRole.title}
              </h3>
              <p className="text-gray-700 mb-6">{ambassadorRole.description}</p>
              <ul className="space-y-3 mb-8">
                {ambassadorRole.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-foreground mt-1 mr-3">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/contact">Register your interest</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}