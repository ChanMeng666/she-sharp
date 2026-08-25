"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CurtainReveal } from "@/components/ui/reveal";
import { Lightbox, useLightbox, type LightboxImage } from "@/components/ui/lightbox";
import { archivePhotos } from "@/public/img/curated/archive";

/**
 * TimelineYearPhotos — one year of the /about timeline, as a contact sheet.
 *
 * A horizontal scroller rather than a grid, because the timeline already runs
 * to thirteen entries: a mosaic per year would add roughly a screen of height
 * apiece and bury the narrative it is supposed to illustrate. The strip costs
 * one tile-height per year and still opens onto everything — the lightbox
 * carries the whole year, not just the tiles on screen.
 *
 * NO EDGE MASK, unlike `PhotoBand`. That band is a decorative marquee nobody
 * interacts with, so fading its ends is free; this one is a list of buttons,
 * and a permanent gradient over the right-hand tile would dim a real target
 * and clip its focus ring. A partly-visible tile is the affordance instead.
 *
 * `next/image`, not the raw `<img>` PhotoBand uses: that shortcut exists
 * because curated frames ship pre-generated 768/1280/1920 renditions and a
 * `srcSet` to match. Event photographs have no such ladder, which is why
 * `PhotoMosaic` optimises them too.
 */

/** Tiles rendered in the strip. The lightbox still holds the full year. */
const STRIP_TILES = 10;

export interface TimelineYearPhotosProps {
  year: number;
  /** The whole year, interleaved across its events. */
  photos: LightboxImage[];
  /** Only used to decide whether an album link is worth offering. */
  albumCount: number;
}

export function TimelineYearPhotos({
  year,
  photos,
  albumCount,
}: TimelineYearPhotosProps) {
  // The hand-picked frame for this year leads the strip. These nine images
  // predate the derived set, they were chosen one at a time, and they are
  // still the best single photograph of most of these years. 2026 has none,
  // so its strip simply opens on the first derived frame.
  const lead = archivePhotos[String(year) as keyof typeof archivePhotos];
  const all: LightboxImage[] = lead ? [lead, ...photos] : photos;
  const visible = all.slice(0, STRIP_TILES);
  const lightbox = useLightbox(all);

  if (all.length === 0) return null;

  return (
    <div className="mb-6">
      <ul
        className={cn(
          "flex snap-x items-end gap-3 overflow-x-auto pb-3 md:gap-4",
          // Room for the focus ring, which would otherwise be clipped by the
          // scroll container on the first and last tiles.
          "-mx-1 scroll-px-1 px-1",
          // A thin, quiet scrollbar rather than `.scrollbar-hide`. On a desktop
          // with a mouse there is no swipe and no visible edge control, so
          // hiding it would leave shift-wheel and the tab key as the only ways
          // to reach the far end of the strip.
          "[scrollbar-color:var(--ink-300)_transparent] [scrollbar-width:thin]"
        )}
      >
        {visible.map((photo, index) => {
          const isLead = index === 0 && !!lead;
          return (
            <li key={`${photo.src}-${index}`} className="shrink-0 snap-start">
              <CurtainReveal
                delay={(index % 5) * 70}
                className={cn(
                  "overflow-hidden rounded-[16px] border border-border bg-muted",
                  isLead
                    ? "aspect-[4/3] h-40 md:h-56"
                    : "aspect-[3/2] h-32 md:h-44"
                )}
              >
                <button
                  type="button"
                  onClick={() => lightbox.openAt(index)}
                  aria-label={`View photo ${index + 1} of ${all.length} from ${year}`}
                  className="group relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 768px) 220px, 340px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </button>
              </CurtainReveal>
            </li>
          );
        })}

        {all.length > visible.length && (
          <li className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => lightbox.openAt(visible.length)}
              className="flex aspect-[3/2] h-32 cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-border px-4 text-center text-sm font-medium text-ink-600 transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:h-44"
            >
              +{all.length - visible.length} more
            </button>
          </li>
        )}
      </ul>

      {/*
        NO EVENT COUNT HERE, though `getTimelineYear()` computes one. The event
        register is thinner than the record for the older years — it holds
        seven events dated 2020 while the entry beside it says twelve, and ten
        for 2025 against "6 major events" — and `CONTENT_RULES.md` is explicit
        that those figures are not to be quietly "fixed". Printing the derived
        number next to the written one would stage that disagreement on the
        page. The photo count has no such counterpart in the copy.
      */}
      <p className="mt-1 text-sm text-ink-600">
        {all.length} {all.length === 1 ? "photo" : "photos"}
        {albumCount > 0 && (
          <>
            {" "}
            &middot;{" "}
            <Link
              href={`/resources/photo-gallery?year=${year}`}
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Browse the {year} albums
            </Link>
          </>
        )}
      </p>

      <Lightbox
        images={lightbox.images}
        index={lightbox.index}
        open={lightbox.open}
        onIndexChange={lightbox.onIndexChange}
        onOpenChange={lightbox.onOpenChange}
      />
    </div>
  );
}
