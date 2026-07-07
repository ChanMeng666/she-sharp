import { Metadata } from "next";
import { PressGrid } from "@/components/resources";

export const metadata: Metadata = {
  title: "In the Press",
  alternates: { canonical: "/resources/in-the-press" },
  description:
    "News and press coverage featuring She Sharp's community, awards, and impact.",
};

export default function InThePressPage() {
  return <PressGrid />;
}

