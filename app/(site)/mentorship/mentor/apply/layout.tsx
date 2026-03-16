import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as Mentor | She Sharp",
  description:
    "Complete your application to become a mentor with She Sharp. Share your expertise and guide the next generation of women in STEM.",
};

export default function MentorApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
