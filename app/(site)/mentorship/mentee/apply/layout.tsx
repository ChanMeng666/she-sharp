import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export const metadata: Metadata = {
  title: { absolute: "Apply as Mentee | She Sharp" },
  description:
    "Complete your application to join She Sharp's mentorship programme as a mentee. Get matched with experienced mentors in STEM.",
  // A gated form page, not a search landing page: outside the registration
  // window it redirects to /mentorship/mentee. The self-canonical is required,
  // not cosmetic — without it this page inherits the parent layout's
  // `/mentorship/mentee` canonical, and noindex + a cross-canonical is a
  // contradictory signal that Google can resolve by noindexing the target.
  alternates: { canonical: "/mentorship/mentee/apply" },
  robots: { index: false, follow: true },
};

export default function MenteeApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isMentorshipOpen()) {
    redirect("/mentorship/mentee");
  }

  return <>{children}</>;
}
