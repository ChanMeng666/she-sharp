import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Mentor | She Sharp",
  description:
    "Share your expertise and guide the next generation of women in STEM. Apply to become a mentor with She Sharp's mentorship programme.",
};

export default function BecomeMentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

