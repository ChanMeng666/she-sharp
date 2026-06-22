import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isMentorshipOpen } from "@/lib/config/mentorship";

export const metadata: Metadata = {
  title: { absolute: "Apply as Mentor | She Sharp" },
  description:
    "Complete your application to become a mentor with She Sharp. Share your expertise and guide the next generation of women in STEM.",
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
