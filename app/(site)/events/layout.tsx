import { Metadata } from "next";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";

export const metadata: Metadata = {
  // Plain string title: the root template appends " | She Sharp" once for this
  // route. Child event pages set their own absolute titles, so they don't
  // depend on this layout cascading a template.
  title: "Events",
  description:
    "Discover She Sharp events including workshops, networking sessions, conferences, and community gatherings for women in STEM across New Zealand.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GeoHead instructions={GEO_INSTRUCTIONS.events} />
      {children}
    </>
  );
}

