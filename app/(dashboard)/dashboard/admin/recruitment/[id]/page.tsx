import { Suspense } from 'react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/auth/permissions';
import ApplicationDetail from '@/components/admin/application-detail';
import { Skeleton } from '@/components/ui/skeleton';

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const isAdmin = await isUserAdmin(user.id);

  if (!isAdmin) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const applicationId = parseInt(id, 10);

  if (isNaN(applicationId)) {
    redirect('/dashboard/admin/recruitment');
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <Suspense fallback={<DetailSkeleton />}>
        <ApplicationDetail id={applicationId} />
      </Suspense>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
