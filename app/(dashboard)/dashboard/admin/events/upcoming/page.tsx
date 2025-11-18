import { Suspense } from 'react';
import EventManagement from '@/components/admin/EventManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function UpcomingEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Create, manage, and monitor all platform events
          </p>
        </div>
      </div>

      <Suspense fallback={<EventsSkeleton />}>
        <EventManagement />
      </Suspense>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}