import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider";
// import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div>
        {/* <BreadcrumbNav /> */}
        <main className="flex-1">{children}</main>
      </div>
      <SiteFooter />
      <ChatbotProvider />
    </div>
  );
}