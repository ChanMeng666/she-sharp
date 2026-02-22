import { Suspense } from 'react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { isUserAdmin } from '@/lib/auth/permissions';
import RecruitmentDashboard from '@/components/admin/recruitment-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default async function RecruitmentPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const isAdmin = await isUserAdmin(user.id);

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recruitment Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Manage volunteer and ambassador applications through the recruitment pipeline
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<RecruitmentSkeleton />}>
        <RecruitmentDashboard />
      </Suspense>
    </div>
  );
}

function RecruitmentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
