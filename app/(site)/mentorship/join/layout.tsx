import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Mentee | She Sharp",
  description:
    "Apply to join She Sharp's mentorship programme as a mentee. Get matched with experienced mentors in STEM and accelerate your career growth.",
};

export default function MenteeJoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

