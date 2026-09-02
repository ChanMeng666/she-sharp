"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface BentoLinkCardProps {
  /** In-site destination for the whole card. */
  href: string;
  /** Small brand-coloured category label above the title. */
  eyebrow: string;
  title: string;
  description: string;
  /** Verb on the bottom row, e.g. "Explore", "Listen", "Read". */
  action: string;
  /** Omitted when the card has no cover to show; the frame still reserves its space. */
  image?: { src: string; alt: string };
}

/**
 * The resources hub's image-top hairline card.
 *
 * Photo Gallery, Podcast and In the Press all render this exact markup and
 * differ only in href, cover and copy. The Newsletters band, Impact Reports
 * card and Album card are deliberately NOT built on this — their bodies and
 * aspect ratios genuinely differ.
 */
export function BentoLinkCard({
  href,
  eyebrow,
  title,
  description,
  action,
  image,
}: BentoLinkCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-white transition-colors duration-300 group-hover:border-foreground/30">
        <div className="relative aspect-[16/10] overflow-hidden">
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <span className="text-label text-brand">{eyebrow}</span>
          <h3 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">
            {title}
          </h3>
          <p className="mt-2 text-ink-600">{description}</p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
            {action}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
