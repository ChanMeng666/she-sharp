import { Suspense } from 'react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/auth/permissions';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage the She Sharp platform from your admin dashboard.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <Button variant="default">
            Export Report
          </Button>
        </div>
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