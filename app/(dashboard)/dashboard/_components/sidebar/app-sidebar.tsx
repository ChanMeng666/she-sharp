"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { userSidebarItems, adminSidebarItems } from "@/lib/config/sidebar";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.roles?.includes("admin") || false);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user role:", err);
        setIsLoading(false);
      });
  }, []);

  const sidebarItems = isAdmin ? adminSidebarItems : userSidebarItems;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[collapsible=icon]:!p-1">
              <Link href="/">
                <div className="relative flex items-center justify-center shrink-0 w-8 h-8 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 transition-all">
                  <Image
                    src="/logos/she-sharp-logo-purple-dark-130x130.svg"
                    alt="She Sharp"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">She Sharp</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-sidebar-accent/50 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <NavMain items={sidebarItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
