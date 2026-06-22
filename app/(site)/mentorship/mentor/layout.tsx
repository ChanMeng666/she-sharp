import { Metadata } from "next";

export const metadata: Metadata = {
  // Plain string title: root template suffixes this route once. The nested
  // apply page sets its own absolute title and doesn't rely on cascade.
  title: "Become a Mentor",
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

