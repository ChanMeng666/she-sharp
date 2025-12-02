import { Suspense } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button variant="outline">
            Import Users
          </Button>
          <Button variant="default">
            Export Users
          </Button>
        </div>
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