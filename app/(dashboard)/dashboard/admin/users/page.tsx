import { Suspense } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* User Management Component */}
      <Suspense fallback={<UserTableSkeleton />}>
        <UserManagement />
      </Suspense>
    </div>
  );
}

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}