import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import Image from "next/image";

export function DonateInfoSection() {
  return (
    <Section className="py-16 bg-muted">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              She Sharp is an independent nonprofit making a difference in the STEM industry
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Your donation means that we can bring more events, networking and 
                career opportunities to young women who are the next generation of 
                scientists, technologists, engineers and mathematicians. Every dollar 
                counts toward making sure our events are engaging, fun and safe spaces 
                for women and underrepresented groups.
              </p>
              <p>
                Every dollar counts toward making sure our events are engaging, fun 
                and safe spaces for women and underrepresented groups.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6493c3be364df2c49f2786f1_Donate_2.webp"
              alt="She Sharp group photo of members at an event"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}