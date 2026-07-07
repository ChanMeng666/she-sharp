"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Static cover image for the Newsletters band.
const COVER_IMAGE = "/img/newsletter.jpg";

/**
 * Newsletters band for the resources hub — full-width horizontal hairline card.
 * Links to the newsletter archive page.
 */
export function NewsletterPreviewCard() {
  return (
    <Link href="/resources/newsletters" className="group block">
      <article className="grid grid-cols-1 overflow-hidden rounded-[32px] border border-border bg-background transition-colors duration-300 group-hover:border-foreground/30 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto">
          <img
            src={COVER_IMAGE}
            alt="She Sharp community members at a workshop"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-col justify-center p-6 md:p-10">
          <span className="text-label text-brand">Newsletters</span>
          <h3 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">
            Newsletter archive
          </h3>
          <p className="mt-2 max-w-xl text-ink-600">
            Read past issues, or subscribe to get She Sharp events, mentorship
            milestones, and community news in your inbox.
          </p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
            Browse the archive
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
