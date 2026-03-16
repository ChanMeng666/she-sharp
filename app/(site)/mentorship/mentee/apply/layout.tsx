import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as Mentee | She Sharp",
  description:
    "Complete your application to join She Sharp's mentorship programme as a mentee. Get matched with experienced mentors in STEM.",
};

export default function MenteeApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
