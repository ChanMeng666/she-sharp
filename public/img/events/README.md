# `public/img/events/` — one folder per event

Every asset belonging to an event lives in that event's own folder:

```
public/img/events/<event-slug>/
  cover.webp                  the hero and OG image        (coverImage.url)
  poster.webp                 portrait promo artwork       (detailPageData.posters[])
  social.webp story.webp square.webp humanitix.jpg
                              the other make-event-poster sizes
  <firstname-lastname>.jpg    speaker and mentor headshots
  photo-1.webp                on-page photos, curated      (detailPageData.photos[])
  team-<name>.webp            anything else specific to this event
  archive/1.webp              harvested gallery — see below
```

`<event-slug>` is the slug exactly as the site uses it, and the filename is
whatever the file is, with no slug prefix. Referenced as
`/img/events/<event-slug>/<name>.<ext>`.

## Why a folder and not a prefix

Until 2026-08-19 the rule was `<event-slug>-<descriptive>.<ext>` in one flat
directory. The rule was fine; the container was not. She Sharp runs about eight
events a year and each adds 3–50 files, so finding one event's assets meant
prefix-matching by eye down a 111-line listing — and prefix-matching was not
even reliable:

- **`her-waka` is a proper prefix of `her-waka-april-2026`**, `-may-2026` and
  `-june-2026`. A first-match scan filed four events' photographs under one.
  Directories cannot collide this way. (Five other slug pairs have the same
  shape, including `she-storytellers-series` and `she-storytellers-series-2-0`.)
- **Two files carried aliases, not slugs** — `iwd-2026-*` and
  `event-aut-linkedin-15-may-2026-*`. The owning event was not derivable from
  the filename at all, which is why an `EVENT_ALIASES` table existed. A long
  slug is unremarkable as a directory name, so that table is gone.

Nothing else changed. A speaker at two events still gets a copy in each folder;
there is no `shared/`, for the reasons in
`docs/development/SLACK_APP_DEVELOPMENT_GUIDE.md`.

## `archive/` is script-owned and disposable

`<slug>/archive/` holds what `scripts/build-event-archive.mts` harvests from the
event's public photo album, and that script **deletes the directory before every
rebuild**. Never put a hand-made file there — put it beside the folder as
`photo-<n>.webp`. Keeping the two apart is the whole reason `archive/` is a
sub-folder rather than merged in.

The site shows `archive/` photos only when an event ships no `photos[]` of its
own (`app/(site)/events/[slug]/page.tsx`).

## Checks

`npx tsx scripts/verify-image-paths.ts` enforces three things: every referenced
path resolves, every file on disk is referenced, and **nothing sits loose at the
top of this directory**. The last one is what stops the flat layout growing back
— a stray `her-waka-june-2026-cover.webp` here still resolves to its event, so
without it every other gate would stay green while the directory quietly refilled.

To move existing files, use `scripts/assets/plan-move.ts` and `apply-move.ts`
rather than moving by hand; they rewrite all ~1,400 references with the files.
