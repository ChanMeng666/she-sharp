"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
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
import { userSidebarItems, adminSidebarItems } from "@/navigation/sidebar/sidebar-items";

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
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href={isAdmin ? "/dashboard/admin" : "/dashboard"}>
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-purple-dark text-purple-dark" />
                </div>
                <span className="text-base font-semibold">She Sharp</span>
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
