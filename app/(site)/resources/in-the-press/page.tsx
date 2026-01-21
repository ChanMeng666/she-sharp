import { Metadata } from "next";
import { PressGrid } from "@/components/sections/resources/press";

export const metadata: Metadata = {
  title: "In the Press | She Sharp",
  description:
    "News and press coverage featuring She Sharp's community, awards, and impact.",
};

export default function InThePressPage() {
  return <PressGrid />;
}

