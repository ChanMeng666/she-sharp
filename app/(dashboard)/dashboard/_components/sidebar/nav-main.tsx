"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { type NavGroup, type NavMainItem, type NavSubItem } from "@/lib/config/sidebar";

interface NavMainProps {
  readonly items: readonly NavGroup[];
  readonly userRoles?: string[];
}

// Filter items based on user roles
function filterItemsByRole<T extends { roleRequired?: string }>(
  items: readonly T[],
  userRoles: string[]
): T[] {
  return items.filter((item) => {
    if (!item.roleRequired) return true;
    return userRoles.includes(item.roleRequired);
  });
}

const NavItemExpanded = ({
  item,
  isActive,
  isSubmenuOpen,
}: {
  item: NavMainItem;
  isActive: (url?: string, subItems?: NavMainItem["subItems"]) => boolean;
  isSubmenuOpen: (subItems?: NavMainItem["subItems"]) => boolean;
}) => {
  return (
    <Collapsible key={item.title} asChild defaultOpen={isSubmenuOpen(item.subItems)} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {item.subItems ? (
            <SidebarMenuButton
              isActive={isActive(item.url, item.subItems)}
              tooltip={item.title}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              isActive={isActive(item.url)}
              tooltip={item.title}
            >
              <Link href={item.url!}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          )}
        </CollapsibleTrigger>
        {item.subItems && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton isActive={isActive(subItem.url)} asChild>
                    <Link href={subItem.url}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
};

const NavItemCollapsed = ({
  item,
  isActive,
}: {
  item: NavMainItem;
  isActive: (url?: string, subItems?: NavMainItem["subItems"]) => boolean;
}) => {
  return (
    <SidebarMenuItem key={item.title}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive(item.url, item.subItems)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-50 space-y-1" side="right" align="start">
          {item.subItems?.map((subItem) => (
            <DropdownMenuItem key={subItem.title} asChild>
              <SidebarMenuSubButton
                key={subItem.title}
                asChild
                className="focus-visible:ring-0"
                isActive={isActive(subItem.url)}
              >
                <Link href={subItem.url}>
                  {subItem.icon && <subItem.icon className="[&>svg]:text-sidebar-foreground" />}
                  <span>{subItem.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export function NavMain({ items, userRoles = [] }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();

  const isItemActive = (url?: string, subItems?: NavMainItem["subItems"]) => {
    if (!url && subItems?.length) {
      return subItems.some((sub) => path.startsWith(sub.url));
    }
    return url ? path === url : false;
  };

  const isSubmenuOpen = (subItems?: NavMainItem["subItems"]) => {
    return subItems?.some((sub) => path.startsWith(sub.url)) ?? false;
  };

  return (
    <>
      {items.map((group) => {
        // Filter group items by role
        const filteredItems = filterItemsByRole(group.items, userRoles);

        // Skip empty groups
        if (filteredItems.length === 0) return null;

        return (
          <SidebarGroup key={group.id}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {filteredItems.map((item) => {
                  // Also filter subItems by role
                  const filteredSubItems = item.subItems
                    ? filterItemsByRole(item.subItems, userRoles)
                    : undefined;
                  const itemWithFilteredSubs = { ...item, subItems: filteredSubItems };

                  if (state === "collapsed" && !isMobile) {
                    // If no subItems (or all filtered out), just render the button as a link
                    if (!itemWithFilteredSubs.subItems?.length) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={isItemActive(item.url)}
                          >
                            <Link href={item.url!}>
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }
                    // Otherwise, render the dropdown with filtered subItems
                    return <NavItemCollapsed key={item.title} item={itemWithFilteredSubs} isActive={isItemActive} />;
                  }
                  // Expanded view with filtered subItems
                  return (
                    <NavItemExpanded key={item.title} item={itemWithFilteredSubs} isActive={isItemActive} isSubmenuOpen={isSubmenuOpen} />
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
