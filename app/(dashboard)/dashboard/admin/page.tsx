import { Suspense } from 'react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/auth/permissions';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AdminPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(user.id);

  // Redirect non-admin users to regular dashboard
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Monitor and manage the She Sharp platform
        </p>
      </div>

      {/* Main Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard userId={user.id} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pending Tasks Skeleton */}
      <Skeleton className="h-48" />

      {/* Chart Skeleton */}
      <Skeleton className="h-80" />
    </div>
  );
}