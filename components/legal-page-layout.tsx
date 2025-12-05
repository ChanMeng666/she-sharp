import { cn } from "@/lib/utils";
import { getContainer } from "@/lib/layout-system";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LegalNav } from "@/components/ui/legal-nav";

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  navTitle?: string;
  lastUpdated?: Date;
  icon?: React.ReactNode;
}

export function LegalPageLayout({
  children,
  title,
  navTitle,
  lastUpdated = new Date(),
  icon
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="min-h-screen bg-white pt-20">
          {/* Quick Navigation */}
          <div className={cn("py-6", getContainer("content"))}>
            <LegalNav activeTitle={navTitle || title} />
          </div>

          {/* Title Section */}
          <div className={cn("py-10", getContainer("narrow"))}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#1f1e44" }}>
              {title}
            </h1>
            <p style={{ color: "#9b2e83" }}>
              Last Updated: {lastUpdated.toLocaleDateString('en-NZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Main Content */}
          <div className={cn("pb-24", getContainer("narrow"))}>
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
