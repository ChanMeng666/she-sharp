import { cn } from "@/lib/utils";
import { getContainer } from "@/lib/design-system";
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
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="min-h-screen bg-white pt-20">
          {/* Quick Navigation */}
          <div className={cn("py-6", getContainer("content"))}>
            <LegalNav activeTitle={navTitle || title} />
          </div>

          {/* Title Section */}
          <div className={cn("py-10", getContainer("narrow"))}>
            <p className="text-label text-ink-500 mb-4">Policies</p>
            <h1 className="text-display-sm text-foreground mb-3">
              {title}
            </h1>
            <p className="text-sm text-ink-500">
              Last updated: {lastUpdated.toLocaleDateString('en-NZ', {
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
