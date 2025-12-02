"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  BookOpen,
  Bell,
  Settings,
  UserCircle,
  Heart,
  FileText,
  BarChart3,
  Shield,
  Search,
  Award,
  CheckCircle,
  Download,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const searchItems = [
  // Overview
  { group: "Overview", icon: Home, label: "Dashboard", url: "/dashboard" },

  // Events
  { group: "Events", icon: Calendar, label: "Browse Events", url: "/dashboard/events" },
  { group: "Events", icon: CheckCircle, label: "My Registrations", url: "/dashboard/events/my-registrations" },

  // Mentorship
  { group: "Mentorship", icon: Users, label: "Find Mentors", url: "/dashboard/mentors" },
  { group: "Mentorship", icon: Heart, label: "My Mentorship", url: "/dashboard/mentorship" },
  { group: "Mentorship", icon: Calendar, label: "Meetings", url: "/dashboard/meetings" },
  { group: "Mentorship", icon: UserCircle, label: "Mentor Profile", url: "/dashboard/mentor-profile" },
  { group: "Mentorship", icon: UserCircle, label: "Mentee Profile", url: "/dashboard/mentee-profile" },

  // Resources
  { group: "Resources", icon: BookOpen, label: "Browse Resources", url: "/dashboard/resources" },
  { group: "Resources", icon: Download, label: "My Downloads", url: "/dashboard/resources/downloads" },

  // Account
  { group: "Account", icon: UserCircle, label: "Account Settings", url: "/dashboard/account" },
  { group: "Account", icon: Bell, label: "Notifications", url: "/dashboard/notifications" },
  { group: "Account", icon: FileText, label: "Activity Log", url: "/dashboard/activity" },

  // Admin
  { group: "Admin", icon: BarChart3, label: "Admin Dashboard", url: "/dashboard/admin", adminOnly: true },
  { group: "Admin", icon: Users, label: "User Management", url: "/dashboard/admin/users", adminOnly: true },
  { group: "Admin", icon: Heart, label: "Mentor Applications", url: "/dashboard/admin/mentors/applications", adminOnly: true },
  { group: "Admin", icon: Award, label: "AI Matching", url: "/dashboard/admin/matching", adminOnly: true },
];

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    // Check if user is admin
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.roles?.includes("admin") || false);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const filteredItems = searchItems.filter(item =>
    !item.adminOnly || isAdmin
  );

  const groups = [...new Set(filteredItems.map((item) => item.group))];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search</span>
        <kbd className="bg-muted pointer-events-none hidden h-5 select-none items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-100 lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, events, mentors..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {filteredItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <CommandItem
                      key={item.url}
                      onSelect={() => handleSelect(item.url)}
                      className="gap-2"
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
