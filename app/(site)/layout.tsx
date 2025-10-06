import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
// import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="pt-16">
        {/* <BreadcrumbNav /> */}
        <main className="flex-1">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}