import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StandalonePageLayout } from '@/components/standalone-page-layout';

export default function NotFound() {
  return (
    <StandalonePageLayout>
      <div className="min-h-[calc(100vh-12rem)] bg-muted px-4 py-24">
        <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
          <p className="text-label text-ink-500 mb-6">Page not found</p>

          {/* Outline display 404 */}
          <div className="text-display-lg text-outline text-foreground leading-none">
            404
          </div>

          <h1 className="text-display-sm text-foreground mt-8">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-700">
            The page you&apos;re looking for may have been moved, deleted, or the
            URL was mistyped.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="brand" size="lg" className="rounded-full px-8">
              <Link href="/events">Browse events</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-ink-500">
            Need help?{' '}
            <Link
              href="/contact"
              className="text-brand underline underline-offset-2 hover:text-brand-hover"
            >
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    </StandalonePageLayout>
  );
}
