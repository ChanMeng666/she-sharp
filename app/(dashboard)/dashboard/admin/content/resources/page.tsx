import { Suspense } from 'react';
import ContentManagement from '@/components/admin/ContentManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContentResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage resources, media, newsletters, and blog content
          </p>
        </div>
      </div>

      <Suspense fallback={<ContentSkeleton />}>
        <ContentManagement />
      </Suspense>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}