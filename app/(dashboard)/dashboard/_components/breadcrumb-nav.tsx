"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Route label mappings
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  events: "Events",
  "my-registrations": "My Registrations",
  mentors: "Mentors",
  mentorship: "My Mentorship",
  meetings: "Meetings",
  "mentor-profile": "Mentor Profile",
  "mentee-profile": "Mentee Profile",
  resources: "Resources",
  downloads: "Downloads",
  account: "Account",
  notifications: "Notifications",
  activity: "Activity",
  admin: "Admin",
  users: "Users",
  analytics: "Analytics",
  upcoming: "Upcoming Events",
  archive: "Event Archive",
  new: "New Event",
  registrations: "Registrations",
  applications: "Applications",
  relationships: "Relationships",
  verified: "Verified Mentors",
  content: "Content",
  blog: "Blog",
  media: "Media",
  newsletters: "Newsletters",
  settings: "Settings",
  system: "System Settings",
  audit: "Audit Log",
  emails: "Email Settings",
  membership: "Membership",
  roles: "Roles",
  permissions: "Permissions",
  billing: "Billing",
  team: "Team",
  members: "Members",
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  // Skip breadcrumb on dashboard root
  if (pathname === "/dashboard") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  // Generate breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return {
      label,
      href: isLast ? undefined : href,
    };
  });

  // Add home link at the beginning
  items.unshift({
    label: "Dashboard",
    href: "/dashboard",
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {index === 0 && <Home className="h-4 w-4" />}
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  "flex items-center gap-1.5",
                  isLast && "text-foreground font-medium"
                )}>
                  {index === 0 && <Home className="h-4 w-4" />}
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 opacity-50" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
