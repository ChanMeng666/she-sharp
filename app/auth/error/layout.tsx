import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Error | She Sharp",
  description:
    "An error occurred during authentication. Please try again or contact support.",
};

export default function AuthErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

