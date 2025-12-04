'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandalonePageLayout } from '@/components/standalone-page-layout';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <StandalonePageLayout>
      <div className="relative min-h-[calc(100vh-12rem)] pt-24 pb-16 px-4 bg-[#f4f4fa]">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-32 w-64 h-64 bg-[#f7e5f3] rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-[#eaf2ff] rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#effefb] rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className="flex items-center justify-center min-h-full">
          <div className="w-full max-w-lg relative z-10 bg-white border border-[#eaf2ff] shadow-xl rounded-2xl">
            <div className="p-12 text-center space-y-8">
              {/* 404 Number Display */}
              <div className="relative">
                <div className="text-8xl font-black text-[#9b2e83] leading-none">
                  404
                </div>
                <div className="absolute inset-0 text-8xl font-black text-[#f7e5f3] scale-110 leading-none -z-10">
                  404
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-[#1f1e44]">
                  Oops! Page not found
                </h1>
                <p className="text-[#1f1e44]/70 text-lg leading-relaxed max-w-md mx-auto">
                  The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                <Button
                  asChild
                  variant="brand"
                  size="lg"
                  className="w-full"
                >
                  <Link href="/">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Home
                  </Link>
                </Button>

                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Link href="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>

                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={!mounted}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t border-[#eaf2ff]">
                <p className="text-sm text-[#1f1e44]/60">
                  Need help?{' '}
                  <Link href="/contact" className="text-[#9b2e83] hover:text-[#c846ab] underline transition-colors">
                    Contact our support team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandalonePageLayout>
  );
}
