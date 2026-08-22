# `public/img/events/` — one folder per event

Every asset belonging to an event lives in that event's own folder:

```
public/img/events/<event-slug>/
  cover.webp                  the hero and OG image        (coverImage.url)
  poster.webp                 portrait promo artwork       (detailPageData.posters[])
  social.webp story.webp square.webp humanitix.jpg
                              the other make-event-poster sizes
  email.jpg                   the mailing-list banner       (/promote-event)
  <firstname-lastname>.jpg    speaker and mentor headshots
  speaker-<firstname-lastname>-social.jpg
  lineup-social.jpg           the per-speaker campaign set — see below
  index.ts                    generated manifest naming the unrendered files
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

### Why one event has 24 `photo-<n>.webp` and everything else has five

`aotearoa-ai-hackathon-festival-2026` is the deliberate outlier, and it is not
a precedent to copy by default.

`CONTENT_RULES.md` is right that the Google Photos album, not the repo, is the
home of event photography, and for a regular evening event five curated frames
plus a `galleryUrl` is the correct amount. Two things made this one different:
it was a two-day festival with a professional shoot large enough to tell the
whole story in sequence, and 31 of its frames also went into
`public/img/curated/` — the pool that dresses `/community`, `/contact`,
`/mentorship` and the home page — where the alternative was carrying on with
photographs scraped off the old Webflow site.

So the test for the next event is not "how many did the hackathon get" but
"does this shoot have to carry surfaces beyond its own page". Usually it does
not.

## `index.ts` is what lets the unrendered files exist

`scripts/events/build-event-poster.ts` writes two kinds of file no page on the
website renders — the per-speaker campaign artwork (`speaker-*`, three sizes per
person, plus a `lineup-*` tile) and `email.jpg`, the mailing-list banner — and
then rewrites `index.ts` beside them, naming every one.

**The manifest is why those files are allowed to exist.** The speaker set is
uploaded to LinkedIn and Instagram by hand, one a week, over the month before the
event; `email.jpg` is linked by absolute URL from a generated `MessageSpec` that
lives in gitignored `tmp/` and is rebuilt for every send, so no committed file
ever points at it either. The reverse check below fails on any image nothing
references, and a dozen entries per event in that script's `KNOWN_UNREFERENCED`
array would make it unreadable. So they are named in code instead — the same
trick `public/img/curated/index.ts` and `public/img/plates/index.ts` already use,
and the reason `scripts/assets/refs.ts` scans `public/**` for `.ts` at all.

It makes the forward check cover them too, which is the point: deleting one now
fails CI, rather than CI staying green while somebody's scheduled post loses its
picture or an announcement goes out with a hole in it. Do not edit `index.ts` by
hand — rebuild it by re-running the script.

**None of these is a `coverImage`.** A speaker poster has no safe band, so an
event card would crop the person's name away; `email.jpg` is 2:1, and the cover
slot is re-cropped down to 21:9 against bands only the 4:5 `social` file was
checked against.

## Checks

`npx tsx scripts/verify-image-paths.ts` enforces three things: every referenced
path resolves, every file on disk is referenced, and **nothing sits loose at the
top of this directory**. The last one is what stops the flat layout growing back
— a stray `her-waka-june-2026-cover.webp` here still resolves to its event, so
without it every other gate would stay green while the directory quietly refilled.

To move existing files, use `scripts/assets/plan-move.ts` and `apply-move.ts`
rather than moving by hand; they rewrite all ~1,400 references with the files.
