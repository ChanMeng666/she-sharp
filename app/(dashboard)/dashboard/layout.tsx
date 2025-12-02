import { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
          <div className="flex w-full items-center px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
