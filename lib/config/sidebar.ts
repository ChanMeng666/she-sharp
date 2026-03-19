import {
  Home,
  GraduationCap,
  UserPlus,
  User,
  Users,
  Heart,
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  FolderKanban,
  FileCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  roleRequired?: "mentor" | "mentee" | "admin";
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  roleRequired?: "mentor" | "mentee" | "admin";
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// User navigation items (default for regular users)
export const userSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Main",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: Home,
      },
    ],
  },
  {
    id: 2,
    label: "Mentorship",
    items: [
      {
        title: "My Mentorship",
        url: "/dashboard/mentorship",
        icon: Heart,
      },
      {
        title: "Mentor Profile",
        url: "/dashboard/mentor-profile",
        icon: UserPlus,
        roleRequired: "mentor",
      },
      {
        title: "Mentee Profile",
        url: "/dashboard/mentee-profile",
        icon: User,
        roleRequired: "mentee",
      },
    ],
  },
];

// Admin navigation items
export const adminSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Admin",
    items: [
      {
        title: "Overview",
        url: "/dashboard/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Management",
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Recruitment",
        url: "/dashboard/admin/recruitment",
        icon: ClipboardList,
      },
      {
        title: "Mentorship",
        icon: GraduationCap,
        subItems: [
          { title: "Programmes", url: "/dashboard/admin/programmes", icon: FolderKanban },
          { title: "Mentee Applications", url: "/dashboard/admin/mentees", icon: FileCheck },
          { title: "AI Matching", url: "/dashboard/admin/matching", icon: BrainCircuit },
          { title: "Active Relationships", url: "/dashboard/admin/mentors/relationships", icon: Users },
          { title: "Meeting Analytics", url: "/dashboard/admin/mentors/meetings", icon: BarChart3 },
        ],
      },
    ],
  },
];
