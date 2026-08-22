import {
  curatedImages,
  toSrcSet,
  type CuratedImage,
  type CuratedImageKey,
} from "@/public/img/curated";

/**
 * Which photographs go where on the public site.
 *
 * The curated pool is 78 frames and eleven pages now draw from it. Left to
 * itself that becomes eleven files each holding a hand-written list of string
 * keys, and the first question anyone asks — "is this photo already used
 * somewhere else, and does this page still make sense?" — needs a grep across
 * the whole app to answer. One file answers it by being read.
 *
 * Every set is typed against `CuratedImageKey`, so a renamed or removed photo
 * fails `pnpm typecheck` rather than rendering a broken tile.
 *
 * SAFE IN A CLIENT COMPONENT. It imports the generated curated manifest and
 * nothing else — about 30 KB of strings, already value-imported by three client
 * components today. It must never reach for `lib/data/events`,
 * `lib/data/gallery-albums` or `lib/data/stats`, which is the ~960 KB of event
 * JSON that `app/(site)/events/page.tsx` and `components/resources/albums.tsx`
 * both go out of their way to import as types only.
 */

/** Structurally compatible with `PhotoBandItem` in components/ui/photo-band.tsx. */
export type BandPhoto = {
  src: string;
  srcSet: string;
  alt: string;
  width: number;
  height: number;
};

const keys = <const T extends readonly CuratedImageKey[]>(k: T) => k;

/**
 * `/community` — the page has no image at all today, and it is the page about
 * turning up to other people's events. Deliberately mixed across the years
 * rather than all-2026: the point of that page is the length of the record.
 */
export const COMMUNITY_BAND = keys([
  "connection-hackathon-introductions",
  "divider-trademe-group",
  "connection-hackathon-talk",
  "workshop-girls-night-build",
  "celebration-hackathon-smiles",
  "divider-aws-community",
  "connection-hackathon-smile",
  "workshop-rpa-laughter",
  "divider-hackathon-crew",
  "celebration-anniversary-booth",
  "connection-hackathon-laughter",
  "divider-standing-group",
]);

/** `/contact` — faces, because the page asks a stranger to write to us. */
export const CONTACT_BAND = keys([
  "connection-hackathon-smile",
  "connection-smiles",
  "hero-hackathon-laughter",
  "connection-hackathon-laughter",
  "audience-centrality-laughter",
  "celebration-hackathon-photobooth",
  "workshop-hackathon-laughter",
  "celebration-imagine-zone",
]);

/** `/resources` — the range of things She Sharp actually runs. */
export const RESOURCES_BAND = keys([
  "speaker-hackathon-keynote",
  "workshop-design-thinking",
  "panel-women-in-ai",
  "workshop-hackathon-focus",
  "speaker-her-waka",
  "audience-hackathon-keynote",
  "panel-mic-moment",
  "workshop-hackathon-worksheet",
  "speaker-own-your-energy",
  "detail-sketch-hands",
]);

/** `/events` — twelve years of rooms, between the featured hero and the filters. */
export const EVENTS_BAND = keys([
  "divider-crowd-wide",
  "workshop-hackathon-roundtable",
  "speaker-stage-spotlight",
  "divider-community-room",
  "workshop-hackathon-laptops",
  "panel-her-waka",
  "celebration-awards",
  "audience-hackathon-smiles",
  "workshop-tower-focus",
  "speaker-hackathon-duo",
  "divider-group-warm",
  "workshop-hackathon-discussion",
]);

/** `/join-our-team` — what the volunteering actually looks like. */
export const JOIN_TEAM_BAND = keys([
  "divider-hackathon-crew",
  "workshop-collaboration",
  "mentoring-hackathon-table",
  "celebration-hackathon-smiles",
  "workshop-team-build",
  "connection-hackathon-break",
  "workshop-hackathon-explain",
  "celebration-swag-bags",
]);

/**
 * Single frames behind a call to action.
 *
 * Roughly 3:2 only. `PhotoBackdrop` is a `fill` cover at a fixed viewport
 * height, so the 2.9:1 panoramas crop on a phone to a band of torsos with every
 * face outside the frame.
 */
export const HOME_CTA_BACKDROP = "audience-hackathon-keynote" satisfies CuratedImageKey;
export const MENTORSHIP_CTA_BACKDROP = "workshop-hackathon-discussion" satisfies CuratedImageKey;

/**
 * Single frames set beside a block of prose.
 *
 * The two mentoring frames are the reason this project touched /mentorship at
 * all: DECK_SYSTEM.md records that the archive held no photograph anywhere of a
 * mentor and a mentee one to one, so those sections had nothing honest to show.
 */
export const MENTORSHIP_BENEFITS_ASIDE = "mentoring-hackathon-scarf" satisfies CuratedImageKey;
export const MENTORSHIP_HOW_IT_WORKS_ASIDE = "mentoring-hackathon-screen" satisfies CuratedImageKey;
export const ABOUT_VALUES_ASIDE = "connection-hackathon-introductions" satisfies CuratedImageKey;

/**
 * `/resources/photo-gallery`, second mosaic — everything before 2026.
 *
 * The hackathon fills the wall above it, and a gallery page that showed only
 * this year would misrepresent an organisation founded in 2014.
 */
export const GALLERY_ARCHIVE_WALL = keys([
  "hero-conference-crowd",
  "workshop-team-build",
  "panel-women-in-ai",
  "celebration-awards",
  "divider-trademe-group",
  "speaker-own-your-energy",
  "workshop-tower-focus",
  "audience-centrality-laughter",
  "celebration-anniversary-booth",
  "divider-aws-community",
  "workshop-rpa-laughter",
  "panel-her-waka",
  "connection-smiles",
  "workshop-girls-night-build",
  "divider-community-room",
  "speaker-her-waka",
  "workshop-design-thinking",
  "mentoring-huddle",
  "celebration-imagine-zone",
  "divider-city-backdrop",
]);

/** One curated entry, for the components that need intrinsic dimensions. */
export function photo(key: CuratedImageKey): CuratedImage {
  return curatedImages[key];
}

/**
 * Resolve keys into band tiles, carrying the pre-generated `srcSet` so the
 * browser picks a rendition that already exists rather than commissioning a
 * transformation for one that does not.
 */
export function toBandPhotos(
  photoKeys: readonly CuratedImageKey[]
): BandPhoto[] {
  return photoKeys.map((key) => {
    const image = curatedImages[key];
    return {
      src: image.src,
      srcSet: toSrcSet(image),
      alt: image.alt,
      width: image.width,
      height: image.height,
    };
  });
}
