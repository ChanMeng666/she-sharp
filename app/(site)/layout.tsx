import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider";
import { NavDebugPanel } from "@/components/layout/nav-debug-panel";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
      <ChatbotProvider />
      <Suspense fallback={null}>
        <NavDebugPanel />
      </Suspense>
    </div>
  );
}