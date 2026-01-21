import { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MembershipBenefits, MembershipTiers } from "@/components/sections/membership";

export const metadata: Metadata = {
  title: "Membership | She Sharp",
  description:
    "Join She Sharp and unlock mentorship, exclusive events, premium resources, and a supportive community of women in tech.",
};

export default function MembershipPage() {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="section" className=" bg-[#f7e5f3]">
        <Container size="full">
          <div className="max-w-3xl mx-auto text-center py-16 md:py-24 lg:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Become a Member
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Join a thriving community of women in tech. Get access to
              mentorship, exclusive events, career resources, and meaningful
              connections that will accelerate your growth.
            </p>
            <Link href="/sign-up">
              <Button variant="brand" size="lg">
                Join Now
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Benefits Section */}
      <MembershipBenefits />

      {/* Tiers Section */}
      <MembershipTiers />
    </>
  );
}

