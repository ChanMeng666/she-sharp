import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export const metadata: Metadata = {
  title: { absolute: "Apply as Mentee | She Sharp" },
  description:
    "Complete your application to join She Sharp's mentorship programme as a mentee. Get matched with experienced mentors in STEM.",
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
