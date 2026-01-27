import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Donate to She Sharp",
  description:
    "Complete your donation to She Sharp. Your support helps empower women in STEM through mentorship and educational programmes.",
};

export default function DonateCheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

