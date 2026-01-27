import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | She Sharp",
  description:
    "Discover She Sharp events including workshops, networking sessions, conferences, and community gatherings for women in STEM across New Zealand.",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

