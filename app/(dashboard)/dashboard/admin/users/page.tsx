import { Suspense } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
            Import Users
          </button>
          <Button variant="default" className="text-sm sm:text-base">
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