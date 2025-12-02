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
    <div className="@container/main flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">
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
      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      
      {/* Tables Skeleton */}
      <Skeleton className="h-96" />
    </div>
  );
}