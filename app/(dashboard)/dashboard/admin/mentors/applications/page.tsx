import { Suspense } from 'react';
import MentorApplications from '@/components/admin/MentorApplications';
import { Skeleton } from '@/components/ui/skeleton';

export default function MentorApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentor Applications</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Review and verify mentor applications
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Auto-refresh every 30 seconds
          </span>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base">
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