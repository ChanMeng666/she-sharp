import Image from "next/image";
import Link from "next/link";
import { Presentation } from "lucide-react";

export interface DeckArchiveCardProps {
  /** Deck slug — the card links to `/present/<slug>`. */
  slug: string;
  title: string;
  subtitle?: string;
  slideCount: number;
  /** Display-ready event date, absent when the event record has gone. */
  date?: string;
  /** Cover image from the event record, when it has one. */
  image?: { url: string; alt: string };
  /** Link to the event's own page, when the event is still on the site. */
  eventHref?: string;
}

/**
 * One deck in the `/slides` archive.
 *
 * Deliberately shares nothing with `components/deck/` — that tree renders
 * inside `.deck-stage` and assumes `deck.css`, which only `app/present/layout.tsx`
 * loads. A card here is an ordinary site card and must stay one.
 */
export function DeckArchiveCard({
  slug,
  title,
  subtitle,
  slideCount,
  date,
  image,
  eventHref,
}: DeckArchiveCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[32px] border border-border bg-white transition-colors hover:border-brand/40">
      <Link
        href={`/present/${slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-muted"
        aria-label={`Open the slides for ${title}`}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          // No cover on the event record. A flat brand panel rather than a
          // borrowed archive photograph — a photo from another event reads as
          // this event's, which is exactly the mistake the deck system avoids.
          <div className="absolute inset-0 flex items-center justify-center bg-brand/10">
            <Presentation className="h-10 w-10 text-brand" aria-hidden />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-label text-brand">
          {date ? `${date} · ` : ""}
          {slideCount} slides
        </p>

        <h2 className="text-xl font-semibold leading-tight text-foreground">
          <Link
            href={`/present/${slug}`}
            className="transition-colors hover:text-brand"
          >
            {title}
          </Link>
        </h2>

        {subtitle && (
          <p className="text-sm leading-relaxed text-ink-600">{subtitle}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-sm">
          <Link
            href={`/present/${slug}`}
            className="font-medium text-brand hover:underline"
          >
            Open the slides
          </Link>
          {eventHref && (
            <Link
              href={eventHref}
              className="text-ink-600 hover:text-foreground hover:underline"
            >
              About this event
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
