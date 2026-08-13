"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { newsPressItems } from "@/lib/data/news-press";

/**
 * "In the Press" highlight card for the resources hub — image-top hairline card.
 * Uses the most recent news item as the cover image.
 */
export function PressHighlightCard() {
  const featured = newsPressItems[0];

  return (
    <Link href="/resources/in-the-press" className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-background transition-colors duration-300 group-hover:border-foreground/30">
        <div className="relative aspect-[16/10] overflow-hidden">
          {featured && (
            <Image
              src={featured.coverImage}
              alt={featured.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <span className="text-label text-brand">In the Press</span>
          <h3 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">
            News &amp; press coverage
          </h3>
          <p className="mt-2 text-ink-600">
            Media features and awards celebrating the She Sharp community.
          </p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
            Read
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
