import { Suspense } from 'react';
import MentorApplications from '@/components/admin/MentorApplications';
import { Skeleton } from '@/components/ui/skeleton';

export default function MentorApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mentor Applications</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Review and verify mentor applications
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500">
            Auto-refresh every 30 seconds
          </span>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base">
            Bulk Approve
          </button>
        </div>
      </div>

      {/* Mentor Applications Component */}
      <Suspense fallback={<ApplicationsSkeleton />}>
        <MentorApplications />
      </Suspense>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}