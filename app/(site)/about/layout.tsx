import { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { personSchema } from "@/lib/seo/schema";
import { teamMembers } from "@/lib/data/team";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about She Sharp's mission to empower women in STEM. Discover our history, meet our team, and see how we're changing the ratio in technology.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Person structured data for the team shown on this page. */}
      <JsonLd data={teamMembers.map((member) => personSchema(member))} />
      {children}
    </>
  );
}

