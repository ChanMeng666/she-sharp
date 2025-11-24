import {
  Home,
  Calendar,
  FolderOpen,
  FileText,
  GraduationCap,
  Sparkles,
  UserPlus,
  User,
  Users,
  Settings,
  Bell,
  Activity,
  CreditCard,
  Heart,
  CheckCircle,
  LayoutDashboard,
  Shield,
  UserCheck,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  Archive,
  BookOpen,
  Image,
  Mail,
  FileEdit,
  Cog,
  MessageSquare,
  FileSearch,
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
    label: "Platform",
    items: [
      {
        title: "Events",
        icon: Calendar,
        subItems: [
          { title: "Browse Events", url: "/dashboard/events", icon: Calendar },
          { title: "My Registrations", url: "/dashboard/events/my-registrations", icon: CheckCircle },
        ],
      },
      {
        title: "Resources",
        icon: FolderOpen,
        subItems: [
          { title: "Resource Library", url: "/dashboard/resources", icon: FolderOpen },
          { title: "My Downloads", url: "/dashboard/resources/downloads", icon: FileText },
        ],
      },
      {
        title: "Mentorship",
        icon: GraduationCap,
        subItems: [
          { title: "Dashboard", url: "/dashboard/mentorship", icon: Heart },
          { title: "Browse Mentors", url: "/dashboard/mentors", icon: Sparkles },
          { title: "Mentor Profile", url: "/dashboard/mentor-profile", icon: UserPlus, roleRequired: "mentor" },
          { title: "Mentee Profile", url: "/dashboard/mentee-profile", icon: User, roleRequired: "mentee" },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Settings",
    items: [
      {
        title: "Team",
        icon: Users,
        subItems: [
          { title: "Members", url: "/dashboard/team/members", icon: Users },
          { title: "Settings", url: "/dashboard/team/settings", icon: Settings },
        ],
      },
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
      {
        title: "Account",
        url: "/dashboard/account",
        icon: User,
      },
      {
        title: "Activity",
        url: "/dashboard/activity",
        icon: Activity,
      },
      {
        title: "Billing",
        url: "/dashboard/billing",
        icon: CreditCard,
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
      {
        title: "Analytics",
        url: "/dashboard/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: 2,
    label: "Management",
    items: [
      {
        title: "User Management",
        icon: Users,
        subItems: [
          { title: "All Users", url: "/dashboard/admin/users", icon: Users },
          { title: "Role Management", url: "/dashboard/admin/users/roles", icon: Shield },
          { title: "Access Control", url: "/dashboard/admin/users/permissions", icon: UserCheck },
          { title: "Activity Logs", url: "/dashboard/admin/users/activity", icon: Activity },
        ],
      },
      {
        title: "Mentorship",
        icon: GraduationCap,
        subItems: [
          { title: "Mentor Applications", url: "/dashboard/admin/mentors/applications", icon: UserPlus },
          { title: "Verified Mentors", url: "/dashboard/admin/mentors/verified", icon: CheckCircle },
          { title: "Active Relationships", url: "/dashboard/admin/mentors/relationships", icon: Users },
          { title: "Meeting Analytics", url: "/dashboard/admin/mentors/meetings", icon: BarChart3 },
        ],
      },
      {
        title: "Events",
        icon: Calendar,
        subItems: [
          { title: "Upcoming Events", url: "/dashboard/admin/events/upcoming", icon: CalendarClock },
          { title: "Create Event", url: "/dashboard/admin/events/new", icon: CalendarPlus },
          { title: "Registrations", url: "/dashboard/admin/events/registrations", icon: UserCheck },
          { title: "Past Events", url: "/dashboard/admin/events/archive", icon: Archive },
        ],
      },
      {
        title: "Content",
        icon: FileText,
        subItems: [
          { title: "Resources Library", url: "/dashboard/admin/content/resources", icon: BookOpen },
          { title: "Media Gallery", url: "/dashboard/admin/content/media", icon: Image },
          { title: "Newsletters", url: "/dashboard/admin/content/newsletters", icon: Mail },
          { title: "Blog Posts", url: "/dashboard/admin/content/blog", icon: FileEdit },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Settings",
    items: [
      {
        title: "System Settings",
        icon: Settings,
        subItems: [
          { title: "System Configuration", url: "/dashboard/admin/settings/system", icon: Cog },
          { title: "Email Templates", url: "/dashboard/admin/settings/emails", icon: MessageSquare },
          { title: "Membership Tiers", url: "/dashboard/admin/settings/membership", icon: CreditCard },
          { title: "Audit Logs", url: "/dashboard/admin/settings/audit", icon: FileSearch },
        ],
      },
    ],
  },
];
