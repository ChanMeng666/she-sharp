import type { EventV3 } from "@/types/event";
import { getEventsByYear, parseDateString } from "@/lib/data/events";
import { eventArchivePhotos } from "@/lib/data/event-archive-photos";
import type { GalleryPhoto } from "@/lib/data/event-photo-set";

/**
 * One year of the /about timeline, as photographs rather than as one photograph.
 *
 * The timeline used to carry a single hand-picked 768px frame per year from
 * `public/img/curated/archive`, which is nine photographs for an organisation
 * that has run ninety-eight events and keeps a public Google Photos album for
 * ninety of them. Everything needed to do better was already in the repository;
 * it was just never joined up.
 *
 * SERVER-ONLY, for the reason spelled out at the top of
 * `lib/data/event-photo-set.ts`: `lib/data/events` value-imports about 960 KB
 * of event JSON. Call this from a server component and hand the returned plain
 * arrays to the client component that renders them.
 */

export type TimelineYear = {
  year: number;
  /** Every eligible photograph from that year, interleaved across its events. */
  photos: GalleryPhoto[];
  /**
   * Events already held in that year, as of `asOf`.
   *
   * Deliberately NOT rendered on the timeline — see the note in
   * `components/about/timeline-year-photos.tsx`. It disagrees with the
   * hand-written copy for 2020 and 2025, and the copy is not this module's to
   * correct. Kept because it is the honest count of what the register holds.
   */
  eventCount: number;
  /** How many of those have a public Google Photos album. */
  albumCount: number;
};

/**
 * Frames withheld from the timeline because a child is the identifiable
 * subject, keyed by event slug and by 1-based position in that event's own
 * `detailPageData.photos`.
 *
 * `docs/development/PHOTOGRAPHING_MINORS.md` bars a frame where the picture is
 * *about* a child AND their face is readable, and separately bars individual
 * close-ups from the surfaces that get reused across the site. /about is such a
 * surface. Each of the two Youth Tech Series workshops ships seven photographs;
 * the six that survive here are the ones where the audience is seen from behind
 * or an adult facilitator is the subject, so the programme is visible on the
 * timeline without any child being the published subject.
 *
 * This withholds nothing from the events' own pages, where all fourteen stay.
 */
const WITHHELD_FROM_TIMELINE: Record<string, readonly number[]> = {
  // Kept: 2 (audience from behind), 3 (facilitator presenting), 4 (raised
  // hands, no faces), 6 (audience from behind, adult volunteers on stage).
  // Withheld: 1 (whole-class group photo — the school's media consent is
  // recorded as unconfirmed), 5 (close frame, two readable faces), 7 (seated
  // row at readable distance).
  "peyvand-academy-13-june-2026": [1, 5, 7],
  // Kept: 1 (wide room, speaker as subject), 4 (worktable, nearest child from
  // behind, the rest looking down at the kit).
  // Withheld: 2, 3, 6, 7 (readable faces at mid distance), 5 (near-portrait of
  // one child).
  "peyvand-academy-20-june-2026": [2, 3, 5, 6, 7],
};

/**
 * An event's photographs, on the same precedence the event page itself uses:
 * its own curated set, else the harvested archive set, else nothing.
 */
function photosForEvent(event: EventV3): GalleryPhoto[] {
  const own = event.detailPageData.photos ?? [];
  const all: GalleryPhoto[] =
    own.length > 0
      ? own.map((photo) => ({ src: photo.url, alt: photo.alt }))
      : (eventArchivePhotos[event.slug] ?? []).map((photo) => ({
          src: photo.src,
          alt: photo.alt,
          width: photo.width,
          height: photo.height,
        }));

  const withheld = WITHHELD_FROM_TIMELINE[event.slug];
  if (!withheld) return all;
  return all.filter((_, i) => !withheld.includes(i + 1));
}

/**
 * Collect one year of the timeline.
 *
 * Photographs are INTERLEAVED, not concatenated: the first frame of every
 * event, then the second of every event, and so on. The strip shows the first
 * handful, and a straight concatenation would let one event own all of them —
 * the 2026 hackathon alone ships twenty-four frames, which would bury the ten
 * other events that year.
 *
 * Only events that have already happened are counted, so a year part-way
 * through does not advertise sessions nobody has attended yet.
 */
export function getTimelineYear(year: number, asOf: Date = new Date()): TimelineYear {
  const cutoff = new Date(asOf);
  cutoff.setHours(0, 0, 0, 0);

  const held = getEventsByYear(year)
    .filter((event) => {
      const date = parseDateString(event.date);
      return !Number.isNaN(date.getTime()) && date < cutoff;
    })
    .sort(
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime()
    );

  const perEvent = held.map(photosForEvent);
  const deepest = Math.max(0, ...perEvent.map((set) => set.length));

  const photos: GalleryPhoto[] = [];
  for (let rank = 0; rank < deepest; rank++) {
    for (const set of perEvent) {
      const photo = set[rank];
      if (photo) photos.push(photo);
    }
  }

  return {
    year,
    photos,
    eventCount: held.length,
    albumCount: held.filter((event) =>
      event.detailPageData.galleryUrl?.trim()
    ).length,
  };
}
