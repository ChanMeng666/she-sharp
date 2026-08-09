import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your She Sharp account to access the dashboard, mentorship programme, and member resources.",
  // Crawlable but never indexed. These pages carry no public content, and the
  // noindex is what actually removes them from search — `app/robots.ts` no
  // longer disallows them, because a Disallow would stop crawlers reading this.
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
