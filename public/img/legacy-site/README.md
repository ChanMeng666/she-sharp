# `public/img/legacy-site/` — live production imagery. Do not delete.

**These 902 files (109 MB) are shipped assets.** They came off the old Webflow
site, which is all the name records; it says nothing about whether they are in
use. They are — deleting this tree breaks event pages, speaker portraits, sponsor logos, podcast
tiles and the photo gallery.

## How they reach a page

`lib/data/json/shesharp_events_v3.json` (paths, as plain strings)
→ `lib/data/events-data.ts` (`eventsV3`)
→ `lib/data/events.ts` (merges `events-custom.json` in, exposes `getAllEvents`/`getEventBySlug`)
→ `app/(site)/events/[slug]/page.tsx`
→ `components/events/event-detail/*` — `event-featured-photo.tsx`,
`event-photos.tsx`, `event-speakers.tsx`, `event-sponsors.tsx` render them via
`next/image`. `lib/data/gallery-albums.ts` derives the `/community` albums from
the same records.

**804 of the 902** are referenced from `shesharp_events_v3.json` alone; the rest
from `shesharp_podcasts_with_local_images.json` (30), `events-custom.json` (18),
`lib/data/mentors.ts` (18), `shesharp_news_press_with_local_images.json` (11),
`lib/data/testimonials.ts` (4) and two page/route files. Effectively nothing
here is orphaned.

| Subfolder | Files | Size | Holds |
| --- | --- | --- | --- |
| `photos/` | 275 | 60M | Event hero and gallery photography |
| `speakers/` | 254 | 8.4M | Speaker headshots |
| `misc/` | 108 | 17M | Webflow responsive variants (`-p-500`…`-p-2000`) and UI SVGs |
| `conference/` | 56 | 8.1M | `2023/`, `2024/` (photos, speakers, sponsors) and `hub/` |
| `sponsors/` | 56 | 1.8M | Sponsor and partner logos |
| `galleries/` | 49 | 4.2M | Numbered gallery album covers |
| `covers/` | 38 | 6.4M | Event tile/cover images |
| `site/` | 38 | 2.7M | Page furniture: `conference/`, `content/`, `mentorship/`, `sponsors/` |
| `podcasts/` | 15 | 840K | Podcast episode tiles |
| `news/` | 7 | 804K | Press-item cover images |
| `avatars/` | 3 | 28K | DiceBear placeholder SVGs (generated, not scraped) |
| `organizers/` | 3 | 168K | Organiser portraits |

## Filenames cannot be guessed

Most read `<24-hex Webflow CMS id>_<original name, truncated mid-word>_<8-hex>.<ext>`:
`public/img/legacy-site/speakers/670c9279065093d7fd6b92ec_Paul_Savage_Workshop_Spea_eb2624c7.webp`
— `Spea` is `Speakers`, cut off. No path is derivable from a person or an event;
every lookup is a grep for the CMS id or a name fragment.

## Traps

- **28 filenames contain literal spaces**, some commas and parentheses too —
  e.g. `photos/654aa33edd99fce2e9a4e1dc_Hero Image, Centrality.jpg`. Naive
  globbing and a naive `grep -o '/img/legacy-site/[^)]*'` both split these, so a
  hand-rolled orphan audit reports files as unused that are not. Quote paths.
- **The same person appears twice under different conventions.**
  `conference/<year>/speakers/` uses kebab slugs
  (`conference/2024/speakers/alliv-samson.jpg`); `speakers/` uses hash names for
  some of the same people
  (`speakers/670c79e4bcb72874bd74433a_Alliv_Samson_Keynote_d15fed8d.jpg`). At
  least 7 such pairs exist — one is not a stale copy of the other.
- **`scripts/audit-event-images.ts` deliberately excludes this folder** from its
  disk scan, so absence from its orphan report proves nothing.
  `scripts/verify-image-paths.ts` (CI) catches a *missing* file, never an
  unreferenced one.
- **`public/img/curated/` is derived from these** by `scripts/optimize-images.mts`,
  which reads a picks JSON of source paths. That picks file is **not committed**
  (the script defaults to a scratchpad path), so the source→output mapping
  survives only in `public/img/curated/index.ts`. Delete a source here and its
  curated variant becomes unreproducible.

**Renamed 2026-08-19** from `public/img/scraped/`. The old name said "scraper
leftovers" and invited exactly the wrong conclusion; `legacy-site` says where the
files came from without implying they are spent. Anything written before that
date — `QA_REPORT_FIXES.md`, the M0 scope note in
`docs/development/SLACK_APP_DEVELOPMENT_GUIDE.md` — is talking about this tree.
The word *archive* was deliberately avoided: this repo already overloads it three
ways (`events/<slug>/archive/`, `curated/archive/`, and the deck wall).
