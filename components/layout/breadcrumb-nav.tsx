'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function BreadcrumbNav() {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    // Special handling for different sections
    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      let label = path;

      // Format common paths
      const labelMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'settings': 'Settings',
        'account': 'Account',
        'sessions': 'Sessions',
        'team': 'Team',
        'billing': 'Billing',
        'sign-in': 'Sign In',
        'sign-up': 'Sign Up',
        'forgot-password': 'Forgot Password',
        'reset-password': 'Reset Password',
        'verify-email': 'Verify Email',
        'about': 'About',
        'programs': 'Programs',
        'events': 'Events',
        'mentorship': 'Mentorship',
        'resources': 'Resources',
        'contact': 'Contact',
        'support': 'Support',
        'volunteer': 'Volunteer',
        'podcasts': 'Podcasts',
        'newsletters': 'Newsletters',
        'gallery': 'Gallery',
        'press': 'Press',
        'components-showcase': 'Components Showcase',
      };

      label = labelMap[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

      // Last item shouldn't have href (current page)
      if (index === paths.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if only home
  if (breadcrumbs.length <= 1) return null;

  const paddingClass = pathname.startsWith('/about') ? 'py-0' : 'py-2';

  return (
    <nav 
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm text-gray ${paddingClass} px-4 md:px-6 max-w-7xl mx-auto`}
    >
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight aria-hidden="true" className="h-4 w-4 mx-1 text-muted-foreground opacity-70" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "text-blue hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-colors",
                index === 0 && "flex items-center gap-1"
              )}
            >
              {index === 0 && <Home aria-hidden="true" className="h-3 w-3" />}
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground font-semibold">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}