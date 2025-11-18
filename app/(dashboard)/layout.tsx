'use client';

import { Suspense } from 'react';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
}
