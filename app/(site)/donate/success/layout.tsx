import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You | She Sharp",
  description:
    "Thank you for your generous donation to She Sharp. Your support makes a real difference for women in STEM.",
};

export default function DonateSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

