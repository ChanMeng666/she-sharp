import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export const metadata: Metadata = {
  title: { absolute: "Apply as Mentor | She Sharp" },
  description:
    "Complete your application to become a mentor with She Sharp. Share your expertise and guide the next generation of women in STEM.",
  // A gated form page, not a search landing page: outside the registration
  // window it redirects to /mentorship/mentor. The self-canonical is required,
  // not cosmetic — without it this page inherits the parent layout's
  // `/mentorship/mentor` canonical, and noindex + a cross-canonical is a
  // contradictory signal that Google can resolve by noindexing the target.
  alternates: { canonical: "/mentorship/mentor/apply" },
  robots: { index: false, follow: true },
};

export default function MentorApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isMentorshipOpen()) {
    redirect("/mentorship/mentor");
  }

  return <>{children}</>;
}
