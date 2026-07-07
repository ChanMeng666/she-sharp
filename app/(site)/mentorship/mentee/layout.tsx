import { Metadata } from "next";

export const metadata: Metadata = {
  // Plain string title: root template suffixes this route once. Nested apply/
  // payment/success pages set their own titles and don't rely on cascade.
  title: "Become a Mentee",
  alternates: { canonical: "/mentorship/mentee" },
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

