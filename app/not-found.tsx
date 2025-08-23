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
      <div className="relative min-h-[calc(100vh-12rem)] pt-4 pb-16 px-4 bg-gradient-to-br from-purple-light/15 via-periwinkle-light/10 to-mint-light/10">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-32 w-64 h-64 bg-gradient-to-br from-purple-dark/5 to-periwinkle-dark/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-gradient-to-tr from-mint-dark/5 to-purple-light/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex items-center justify-center min-h-full">
          <div className="w-full max-w-lg relative z-10 bg-white/95 backdrop-blur-xl border-0 shadow-2xl shadow-purple-dark/10 rounded-xl">
            <div className="p-12 text-center space-y-8">
            {/* 404 Number Display */}
            <div className="relative">
              <div className="text-8xl font-black text-transparent bg-gradient-to-br from-purple-dark to-periwinkle-dark bg-clip-text leading-none">
                404
              </div>
              <div className="absolute inset-0 text-8xl font-black text-purple-dark/5 scale-110 leading-none">
                404
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-navy-dark">
                Oops! Page not found
              </h1>
              <p className="text-gray text-lg leading-relaxed max-w-md mx-auto">
                The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <Button
                asChild
                variant="gradient"
                size="lg"
                className="w-full h-12 rounded-xl shadow-lg shadow-purple-dark/25 hover:shadow-xl hover:shadow-purple-dark/30"
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
                  className="flex-1 h-12 rounded-xl border-2 border-purple-dark/20 hover:border-purple-dark hover:bg-purple-light/30"
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
                  className="flex-1 h-12 rounded-xl border-2 border-purple-dark/20 hover:border-purple-dark hover:bg-purple-light/30"
                  disabled={!mounted}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-periwinkle-light/30">
              <p className="text-sm text-gray">
                Need help? {' '}
                <Link href="/contact" className="text-purple-dark hover:text-purple-mid underline transition-colors">
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
