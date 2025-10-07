'use client';

import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Menu, X, Settings, Users, Activity, CreditCard, Shield, Layers, DollarSign, FileText, LockKeyhole, User as UserIcon, CheckCircle, GraduationCap, UserPlus, Sparkles, Heart, Calendar, FolderOpen, Bell, LayoutDashboard, BarChart3, ChevronDown, ChevronRight, UserCheck, CalendarPlus, CalendarClock, Archive, BookOpen, Image as ImageIcon, Mail, FileEdit, Cog, MessageSquare, FileSearch } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Sidebar navigation items - will be dynamically filtered based on user roles
const sidebarNavItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Events',
    icon: Calendar,
    children: [
      { title: 'Browse Events', href: '/dashboard/events', icon: Calendar },
      { title: 'My Registrations', href: '/dashboard/events/my-registrations', icon: CheckCircle },
    ],
  },
  {
    title: 'Resources',
    icon: FolderOpen,
    children: [
      { title: 'Resource Library', href: '/dashboard/resources', icon: FolderOpen },
      { title: 'My Downloads', href: '/dashboard/resources/downloads', icon: FileText },
    ],
  },
  {
    title: 'Mentorship',
    icon: GraduationCap,
    children: [
      { title: 'Dashboard', href: '/dashboard/mentorship', icon: Heart },
      { title: 'Browse Mentors', href: '/dashboard/mentors', icon: Sparkles },
      { title: 'Mentor Profile', href: '/dashboard/mentor-profile', icon: UserPlus, roleRequired: 'mentor' },
      { title: 'Mentee Profile', href: '/dashboard/mentee-profile', icon: UserIcon, roleRequired: 'mentee' },
    ],
  },
  {
    title: 'Team',
    icon: Users,
    children: [
      { title: 'Members', href: '/dashboard/team/members', icon: Users },
      { title: 'Settings', href: '/dashboard/team/settings', icon: Settings },
    ],
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Account',
    href: '/dashboard/account',
    icon: UserIcon,
  },
  {
    title: 'Activity',
    href: '/dashboard/activity',
    icon: Activity,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
];

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      // Call NextAuth signOut first
      await nextAuthSignOut({ 
        redirect: false,
        callbackUrl: '/' 
      });
      
      // Clear custom session
      await fetch('/api/auth/signout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      // Use the complete signout endpoint that clears everything and redirects
      window.location.href = '/api/auth/signout-complete';
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force complete signout even on error
      window.location.href = '/api/auth/signout-complete';
    }
  }

  if (!user) {
    return (
      <>
        <Link href="/sign-in">
          <Button variant="ghost" size="lg">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="default" size="lg" className="rounded-full px-6">
            Get Started
          </Button>
        </Link>
      </>
    );
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback className="bg-gradient-to-br from-purple-dark to-periwinkle-dark text-white text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium text-navy-dark">
            {user.name || user.email.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback className="bg-gradient-to-br from-purple-dark to-periwinkle-dark text-white text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{user.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/account">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/team/settings">
            <Users className="mr-2 h-4 w-4" />
            <span>Team Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Desktop Sidebar Component
function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  useEffect(() => {
    // Check if user is admin
    if (user) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.roles?.includes('admin') || false);
          setRoleLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch user role:', err);
          setRoleLoading(false);
        });
    } else if (user === null) {
      setRoleLoading(false);
    }
  }, [user]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Admin navigation items
  const adminNavItems = [
    {
      title: 'Overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'User Management',
      icon: Users,
      children: [
        { title: 'All Users', href: '/dashboard/admin/users', icon: Users },
        { title: 'Role Management', href: '/dashboard/admin/users/roles', icon: Shield },
        { title: 'Access Control', href: '/dashboard/admin/users/permissions', icon: UserCheck },
        { title: 'Activity Logs', href: '/dashboard/admin/users/activity', icon: Activity },
      ],
    },
    {
      title: 'Mentorship',
      icon: GraduationCap,
      children: [
        { title: 'Mentor Applications', href: '/dashboard/admin/mentors/applications', icon: UserPlus },
        { title: 'Verified Mentors', href: '/dashboard/admin/mentors/verified', icon: CheckCircle },
        { title: 'Active Relationships', href: '/dashboard/admin/mentors/relationships', icon: Users },
        { title: 'Meeting Analytics', href: '/dashboard/admin/mentors/meetings', icon: BarChart3 },
      ],
    },
    {
      title: 'Events',
      icon: Calendar,
      children: [
        { title: 'Upcoming Events', href: '/dashboard/admin/events/upcoming', icon: CalendarClock },
        { title: 'Create Event', href: '/dashboard/admin/events/new', icon: CalendarPlus },
        { title: 'Registrations', href: '/dashboard/admin/events/registrations', icon: UserCheck },
        { title: 'Past Events', href: '/dashboard/admin/events/archive', icon: Archive },
      ],
    },
    {
      title: 'Content',
      icon: FileText,
      children: [
        { title: 'Resources Library', href: '/dashboard/admin/content/resources', icon: BookOpen },
        { title: 'Media Gallery', href: '/dashboard/admin/content/media', icon: ImageIcon },
        { title: 'Newsletters', href: '/dashboard/admin/content/newsletters', icon: Mail },
        { title: 'Blog Posts', href: '/dashboard/admin/content/blog', icon: FileEdit },
      ],
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/admin/analytics',
    },
    {
      title: 'Settings',
      icon: Settings,
      children: [
        { title: 'System Configuration', href: '/dashboard/admin/settings/system', icon: Cog },
        { title: 'Email Templates', href: '/dashboard/admin/settings/emails', icon: MessageSquare },
        { title: 'Membership Tiers', href: '/dashboard/admin/settings/membership', icon: CreditCard },
        { title: 'Audit Logs', href: '/dashboard/admin/settings/audit', icon: FileSearch },
      ],
    },
  ];

  const navItems = isAdmin ? adminNavItems : sidebarNavItems;

  // Show loading state or default nav while checking role
  if (roleLoading) {
    return (
      <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200">
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200">
      <nav className="flex-1 p-4 overflow-y-auto">
        {isAdmin && (
          <div className="mb-4 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Admin Panel</p>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        )}
        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-purple-light/30 hover:text-purple-dark",
                      expandedItems.includes(item.title) ? "bg-purple-light/20 text-purple-dark" : "text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    <svg
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedItems.includes(item.title) ? "rotate-180" : ""
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedItems.includes(item.title) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                            pathname === child.href
                              ? "bg-purple-dark text-white"
                              : "text-gray-600 hover:bg-purple-light/30 hover:text-purple-dark"
                          )}
                        >
                          <child.icon className="h-3 w-3" />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-purple-dark text-white"
                      : "text-gray-700 hover:bg-purple-light/30 hover:text-purple-dark"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

// Mobile Sidebar Component
function MobileSidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  useEffect(() => {
    // Check if user is admin
    if (user) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.roles?.includes('admin') || false);
          setRoleLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch user role:', err);
          setRoleLoading(false);
        });
    } else if (user === null) {
      setRoleLoading(false);
    }
  }, [user]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Reuse admin navigation items from desktop sidebar
  const adminNavItems = [
    {
      title: 'Overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'User Management',
      icon: Users,
      children: [
        { title: 'All Users', href: '/dashboard/admin/users', icon: Users },
        { title: 'Role Management', href: '/dashboard/admin/users/roles', icon: Shield },
        { title: 'Access Control', href: '/dashboard/admin/users/permissions', icon: UserCheck },
        { title: 'Activity Logs', href: '/dashboard/admin/users/activity', icon: Activity },
      ],
    },
    {
      title: 'Mentorship',
      icon: GraduationCap,
      children: [
        { title: 'Mentor Applications', href: '/dashboard/admin/mentors/applications', icon: UserPlus },
        { title: 'Verified Mentors', href: '/dashboard/admin/mentors/verified', icon: CheckCircle },
        { title: 'Active Relationships', href: '/dashboard/admin/mentors/relationships', icon: Users },
        { title: 'Meeting Analytics', href: '/dashboard/admin/mentors/meetings', icon: BarChart3 },
      ],
    },
    {
      title: 'Events',
      icon: Calendar,
      children: [
        { title: 'Upcoming Events', href: '/dashboard/admin/events/upcoming', icon: CalendarClock },
        { title: 'Create Event', href: '/dashboard/admin/events/new', icon: CalendarPlus },
        { title: 'Registrations', href: '/dashboard/admin/events/registrations', icon: UserCheck },
        { title: 'Past Events', href: '/dashboard/admin/events/archive', icon: Archive },
      ],
    },
    {
      title: 'Content',
      icon: FileText,
      children: [
        { title: 'Resources Library', href: '/dashboard/admin/content/resources', icon: BookOpen },
        { title: 'Media Gallery', href: '/dashboard/admin/content/media', icon: ImageIcon },
        { title: 'Newsletters', href: '/dashboard/admin/content/newsletters', icon: Mail },
        { title: 'Blog Posts', href: '/dashboard/admin/content/blog', icon: FileEdit },
      ],
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/admin/analytics',
    },
    {
      title: 'Settings',
      icon: Settings,
      children: [
        { title: 'System Configuration', href: '/dashboard/admin/settings/system', icon: Cog },
        { title: 'Email Templates', href: '/dashboard/admin/settings/emails', icon: MessageSquare },
        { title: 'Membership Tiers', href: '/dashboard/admin/settings/membership', icon: CreditCard },
        { title: 'Audit Logs', href: '/dashboard/admin/settings/audit', icon: FileSearch },
      ],
    },
  ];

  const navItems = isAdmin ? adminNavItems : sidebarNavItems;

  // Show loading state while checking role
  if (roleLoading) {
    return (
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex-1 p-4 overflow-y-auto">
      {isAdmin && (
        <div className="mb-4 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Admin Panel</p>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
        </div>
      )}
      <div className="space-y-1">
        {navItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "hover:bg-purple-light/30 hover:text-purple-dark",
                    expandedItems.includes(item.title) ? "bg-purple-light/20 text-purple-dark" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                  <svg
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedItems.includes(item.title) ? "rotate-180" : ""
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedItems.includes(item.title) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                          pathname === child.href
                            ? "bg-purple-dark text-white"
                            : "text-gray-600 hover:bg-purple-light/30 hover:text-purple-dark"
                        )}
                      >
                        <child.icon className="h-3 w-3" />
                        <span>{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-purple-dark text-white"
                    : "text-gray-700 hover:bg-purple-light/30 hover:text-purple-dark"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full border-b bg-white transition-all duration-150",
      scrolled ? "shadow-sm" : ""
    )}>
      <div className="mx-auto px-4 md:px-6 max-w-7xl flex h-16 items-center">
        {/* Logo - Click to return home */}
        <Link 
          href="/" 
          className="mr-8 flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
        >
          <div className="relative w-32 h-10">
            <Image
              src="/logos/she-sharp-logo.svg"
              alt="She Sharp"
              fill
              sizes="128px"
              className="object-contain transition-all duration-200 group-hover:brightness-110"
              priority
            />
          </div>
        </Link>

        {/* Desktop User Menu */}
        <div className="ml-auto hidden lg:flex items-center gap-3">
          <Suspense fallback={<div className="h-9 w-9 animate-pulse bg-gray-200 rounded-full" />}>
            <UserMenu />
          </Suspense>
        </div>

        {/* Mobile Menu Button */}
        <div className="ml-auto lg:hidden flex items-center gap-2">
          <Suspense fallback={<div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />}>
            <UserMenu />
          </Suspense>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray hover:text-purple-dark hover:bg-purple-light/30 focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-black/20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white border-r shadow-lg" onClick={(e) => e.stopPropagation()}>
            <MobileSidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-light/20 via-white to-periwinkle-light/20">
      <Header />
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16">
        <div className="h-full">
          {children}
        </div>
      </main>
      <footer className="lg:ml-64 bg-white border-t border-gray-200 py-4 sm:py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray text-center sm:text-left">
              © {new Date().getFullYear()} She Sharp. All rights reserved.
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/about" className="text-gray hover:text-purple-dark transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray hover:text-purple-dark transition-colors">
                Contact
              </Link>
              <Link href="/privacy-policy" className="text-gray hover:text-purple-dark transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-gray hover:text-purple-dark transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
