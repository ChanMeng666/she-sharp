import { notFound } from "next/navigation";

// TODO: Re-enable the membership page once the membership logic is finalized.
// The original implementation is preserved below for when it's ready to ship.
//
// import { Metadata } from "next";
// import { MembershipBenefits, MembershipHero, MembershipTiers } from "@/components/membership";
//
// export const metadata: Metadata = {
//   title: "Membership",
//   description:
//     "Join She Sharp and unlock mentorship, exclusive events, premium resources, and a supportive community of women in tech.",
// };
//
// export default function MembershipPage() {
//   return (
//     <>
//       <MembershipHero />
//
//       <div id="benefits">
//         <MembershipBenefits />
//       </div>
//
//       <div id="membership-plans">
//         <MembershipTiers />
//       </div>
//     </>
//   );
// }

export default function MembershipPage() {
  notFound();
}
