'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  Shield,
  Users,
  Activity,
  Mail,
  LogOut,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserData {
  id: number;
  name?: string;
  email: string;
  emailVerifiedAt?: string;
  role?: string;
  roles?: string[];
}

interface UserNavProps {
  variant?: 'desktop' | 'mobile';
}

export function UserNav({ variant = 'desktop' }: UserNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    fetchUserAndRoles();
  }, []);

  const fetchUserAndRoles = async () => {
    try {
      const [userResponse, roleResponse] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/user/role')
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        setIsAdmin(roleData.isAdmin || false);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Call NextAuth signOut first
      await signOut({ 
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
  };

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

  const isEmailVerified = !!user?.emailVerifiedAt;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        {variant === 'desktop' && (
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        )}
      </div>
    );
  }

  // Not logged in - show sign in/up buttons
  if (!user) {
    if (variant === 'mobile') {
      return (
        <div className="pt-4 border-t border-[#f7e5f3]">
          <Link href="/sign-up" className="w-full">
            <Button variant="secondary" size="lg" className="w-full">
              <User className="mr-2 h-4 w-4" />
              Membership
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <Link href="/sign-up">
          <Button size="lg" variant="default">
            Membership
          </Button>
        </Link>
      </div>
    );
  }

  // Mobile variant - simplified menu
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-2 pt-4 border-t border-[#f7e5f3]">
        <div className="flex items-center gap-3 px-2 py-3 bg-[#f7e5f3]/50 rounded-lg">
          <Avatar className="h-10 w-10 border-2 border-[#9b2e83]/20">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback className="bg-[#9b2e83] text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1f1e44]">{user.name || 'User'}</p>
            <p className="text-xs text-[#1f1e44]/60">{user.email}</p>
            {!isEmailVerified && (
              <Badge variant="destructive" className="mt-1 text-xs">
                Email not verified
              </Badge>
            )}
          </div>
        </div>

        {isAdmin ? (
          <>
            <Link href="/dashboard/admin" className="w-full">
              <Button variant="ghost" size="lg" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Overview
              </Button>
            </Link>
            <Link href="/dashboard/admin/users" className="w-full">
              <Button variant="ghost" size="lg" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Button>
            </Link>
            <Link href="/dashboard/admin/matching" className="w-full">
              <Button variant="ghost" size="lg" className="w-full justify-start">
                <BrainCircuit className="mr-2 h-4 w-4" />
                AI Matching
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/dashboard" className="w-full">
            <Button variant="ghost" size="lg" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        )}

        <Link href="/dashboard/account" className="w-full">
          <Button variant="ghost" size="lg" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Button>
        </Link>

        <Button
          variant="destructive"
          size="lg"
          className="w-full justify-start"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  // Desktop variant - full dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback className="bg-muted text-foreground text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex items-center gap-1">
            <span className="text-sm font-medium">
              {user.name || user.email.split('@')[0]}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          {!isEmailVerified && (
            <div className="absolute -top-1 -right-1 h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
              <AvatarFallback className="bg-muted text-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {!isEmailVerified && (
                <Badge variant="destructive" className="text-xs w-fit">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Unverified
                </Badge>
              )}
              {isEmailVerified && (
                <Badge variant="secondary" className="text-xs w-fit bg-green-100 text-green-700">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {isAdmin ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Admin Overview</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/admin/matching">
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  <span>AI Matching</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/account">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>

              {!isEmailVerified && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/verify-email" className="text-amber-600">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Verify Email</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/account">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/activity">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Activity</span>
                </Link>
              </DropdownMenuItem>

              {!isEmailVerified && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/verify-email" className="text-amber-600">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Verify Email</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}
        
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