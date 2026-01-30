import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | She Sharp",
  description:
    "Learn about She Sharp's mission to empower women in STEM. Discover our history, meet our team, and see how we're changing the ratio in technology.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

