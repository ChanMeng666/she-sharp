import { Metadata } from "next";
import { MembershipBenefits, MembershipHero, MembershipTiers } from "@/components/membership";

export const metadata: Metadata = {
  title: "Membership | She Sharp",
  description:
    "Join She Sharp and unlock mentorship, exclusive events, premium resources, and a supportive community of women in tech.",
};

export default function MembershipPage() {
  return (
    <>
      <MembershipHero />

      <div id="benefits">
        <MembershipBenefits />
      </div>

      <div id="membership-plans">
        <MembershipTiers />
      </div>
    </>
  );
}
