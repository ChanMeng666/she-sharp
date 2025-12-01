import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const impactAreas = [
  {
    title: "Raising awareness of STEM & accessibility of She Sharp events",
    description: "Donations help us bring events and workshops to low decile and EQI schools; train teachers and educators on the importance of digital curriculums and tools; and make sure She Sharp events are accessible through subsidised tickets.",
    image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6493c3be26b391b4bf193fa0_Donate_3%20Use%20Case_1.webp"
  },
  {
    title: "All the fixings that make engaging and memorable events",
    description: "This includes accessible venues, nourishing food and drinks, AV equipment hire and tools for workshops—we want to make sure attendees and volunteers have a great time at our events!",
    image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6493cf8ab86225ac6c25de36_donate-eating.webp"
  }
];

export function DonationImpactSection() {
  return (
    <Section className="py-16">
      <Container>
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Some of the ways your donations support She Sharp
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {impactAreas.map((area) => (
            <Card key={area.title} className="overflow-hidden">
              <div className="relative aspect-[16/9]">
                <Image
                  src={area.image}
                  alt={area.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{area.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{area.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}