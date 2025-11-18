import { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";
import { BreadcrumbNav } from "./_components/breadcrumb-nav";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar variant="inset" collapsible="icon" />
      <SidebarInset
        className={cn(
          "peer-data-[variant=inset]:!mr-2 peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div className="h-full p-4 md:p-6">
          <BreadcrumbNav />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
