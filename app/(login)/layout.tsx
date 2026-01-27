import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | She Sharp",
  description:
    "Sign in to your She Sharp account to access the dashboard, mentorship programme, and member resources.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
