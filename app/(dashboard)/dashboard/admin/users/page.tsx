import { Suspense } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Import Users
          </button>
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