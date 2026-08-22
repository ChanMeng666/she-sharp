# Image conventions for event assets

## Target directory

Every asset for an event lives in **its own folder, named for the event slug**:

```
public/img/events/<event-slug>/
```

`<event-slug>` is the slug exactly as it appears in the merged event list — no
abbreviation, no alias. Relative path as stored in `events-custom.json` is
always `/img/events/<event-slug>/<filename>`.

Three reasons the folder is the rule, all of them things that used to bite:

- **The owning event is unambiguous.** Under the old flat scheme the filename
  began with the slug, and `her-waka` is a proper prefix of `her-waka-april-2026`
  — so "which event owns this file" was a guess. A directory boundary cannot be
  a prefix of another directory.
- **It kills the alias table.** A 53-character slug made an unusable *filename*
  (`she-sharp-and-academyex-international-womens-day-2026-ana-ivanovic-tongue.jpg`),
  which is why short aliases like `iwd-2026` existed. It makes a perfectly
  ordinary *directory* name, so the aliases are gone and must not come back.
- **One directory stops growing.** Each event adds 3–50 files. Flat, that was a
  single directory nobody could scan; foldered, an event is one `ls`.

## File naming

Inside the event's folder the filename is just the role — the slug is the folder,
so **never repeat it in the filename**. Lower-case, kebab-case, ASCII only.

| Role | Pattern | Example |
|---|---|---|
| Cover poster | `<slug>/cover.<ext>` | `her-waka-june-2026/cover.webp` |
| Speaker photo | `<slug>/<kebab-speaker-name>.<ext>` | `aotearoa-ai-hackathon-festival-2026/mahsa-mohaghegh.jpg` |
| Gallery photo (post-event) | `<slug>/photo-<n>.webp` | `aotearoa-ai-hackathon-festival-2026/photo-1.webp` |
| Sponsor-specific asset (rare) | `<slug>/<sponsor>-logo.<ext>` | `she-sharp-and-academyex-international-womens-day-2026/academyex-logo.svg` |

Rare because a sponsor mark almost always belongs in `/img/sponsors/`, which is a
flat directory of reusable logos and is **not** affected by the per-event folder
rule. Only put a logo in an event folder when no canonical exists.

Publishing artwork from `/make-event-poster` uses the same folder with its own
fixed names — `poster.webp`, `social.webp`, `story.webp`, `square.webp`,
`humanitix.jpg`.

The skill already receives `<slug>` from the user. Speaker-name kebab-case
should match the speaker's full name (first + last), lowercased with hyphens
and any diacritics stripped — e.g., `Stuart Little` → `stuart-little`,
`Sofía García` → `sofia-garcia`.

### The one sub-folder

`<event-slug>/archive/` is reserved for the output of
`scripts/build-event-archive.mts` — script-owned, disposable, regenerable. Never
hand-place a file there, and never reference one from anywhere the script does
not generate. No other sub-folder exists; in particular there is **no
`events/shared/`** (see "Forbidden image sources").

## Extension is derived from Slack, not from the current JSON

Trust Slack's `files.filetype` field as the authoritative source for the
file extension. Do not re-encode. Normalizations:

- `jpeg` → `.jpg`
- Everything else — preserve as-is.

On UPDATE, if the existing JSON references `…-cover.png` but the Slack
source file is JPEG bytes, the skill should propose renaming the target
to `…-cover.jpg` and removing the old `.png` file. Wrong extensions
silently work in browsers (MIME sniffing) but corrupt future automation
and confuse anyone reading the repo.

## Classifying images from a channel

Heuristic priority order:

1. **Explicit hint in the message text** — "poster", "cover", "banner",
   "header" → cover. "bio pic", "headshot", speaker name → speaker.
2. **Attached to a pinned message** — treat that as canonical regardless of
   other signals.
3. **Latest version of a visually similar image** — if two posters exist,
   the newer timestamp wins. Identify "similar" by dimensions (within 10%)
   or by file title prefix.
4. **File shared alongside a `.docx` bio** — the image in the same message
   as a bio docx is almost always the speaker headshot.
5. **Aspect ratio** — portrait-ish (height > width) tends to be posters;
   square or slightly portrait is usually a headshot.

When a classification is ambiguous (no hint, multiple candidates), stop
and present the candidates to the user rather than guessing. The CI gate
will catch dangling references, but wrong classification produces a
technically-valid page with the wrong picture on it.

## Deduplication

Before downloading, check whether the target path already has a file with
identical size. If so, skip the download and reuse the existing file (saves
Slack API calls and preserves git history).

## Galleries and external photo sources (post-event)

Event photos are usually **not** Slack `url_private` files — teams post them to a
Google Drive folder or Google Photos album, or a Canva design. `download-file.ts`
only handles Slack files, so for these:

- **Google Drive folder** (`drive.google.com/drive/folders/<id>`): download with
  `gdown --folder "<url>" -O <scratch-dir>`. A public folder needs no auth. It
  may contain videos and unsorted shots — curate to ~6–8 representative stills
  (match the count of a sibling event's gallery), preferring wide/contextual
  shots over close-ups of individual faces.
- **Google Photos album** (`photos.app.goo.gl/…` / `photos.google.com/share/…`):
  resists bulk download — use it as the visual reference for curating, and pull
  the actual files from the matching Drive folder (or ask the user for one). But
  it **is the preferred `galleryUrl`** (see below): a curated album is far more
  visitor-friendly than a raw Drive folder of mixed photos + videos.
- **Screen for children before anything else.** No frame in which a child is
  the identifiable subject, and never a child's name in `alt` text. A youth
  event runs under the host school's media consent — see
  `docs/development/PHOTOGRAPHING_MINORS.md`. This is the one rejection reason
  that cannot be undone after publishing, because `/img/*` is cached immutable
  for a year and the album copy is outside the repo.
- **Convert to `.webp`** before committing, with **`sharp`** — it is a project
  dependency (`sharp@^0.35.3`) and six scripts already use it, including
  `scripts/optimize-images.mts` and `scripts/build-event-archive.mts`. (This
  said "the project ships no `sharp`/`cwebp` binary — use Python `Pillow`",
  which stopped being true and sent people to a second image toolchain.)
  Resize to ≤1600px wide at quality ≈82 and call `.rotate()` first, which
  applies the EXIF orientation so phone photos are not sideways. Target
  ~100–250 kB each; step the quality down (82 → 78 → 74 → 70) until a frame
  fits rather than shrinking it further. The 24-photo hackathon set averages
  137 kB this way.

`galleryUrl` is the target of the page's **"View Gallery"** button
(`event-photos.tsx` → `window.open`), so it must be the link you actually want
visitors to land on — **prefer the curated Google Photos album** (`photos.app.goo.gl/…`)
over the raw Drive folder when both exist. It is the one allowed public external
link; a photo's `url`/`src` must always be a committed local `/img/events/…` path.
The Drive folder is for *downloading source images*, not necessarily the button
target.

## Post-event gallery update mode

When an event's date has passed (discovery flags `stale-status`) and a photo
album exists, run a gallery pass — mirror a sibling event already in this shape:

1. Download + curate + convert as above → `public/img/events/<slug>/photo-<n>.webp`
   (create the event's folder if this is its first asset).
2. In the event's `detailPageData`: set `status` to `"past"`, set `galleryUrl`
   to the public album link, and populate `photos[]` with one
   `{ url, alt }` per webp (descriptive alt text).
3. Run the CI gate; commit. No speakers/agenda change — this is purely the
   post-event addition.

## Forbidden image sources

- Do **not** pull images from `scripts/` scratch areas or temp paths.
- Do **not** re-use images from another event's folder, and do **not** invent a
  `public/img/events/shared/` for a speaker who appears twice. Every event gets
  its own copy even when the bytes are identical — one rule with no exceptions is
  cheaper to follow than a sharing scheme, and disk cost is negligible.
- Do **not** embed an external URL as a photo's `url`/`src` (Canva links, CDN
  links) — always download, convert, rename, and commit the bytes. (The separate
  `galleryUrl` field is the one place a public album link is allowed.)

## Orphan cleanup on re-sync

When a re-sync changes an image path (extension fix, slug change,
speaker rename), the old file remains on disk until explicitly
removed. `verify-image-paths.ts` only catches references → missing
files, not missing references → orphan files sitting in the repo.

Always pair a path change with `git rm <old_path>`. List the removals
in the dry-run plan so the user can veto before they happen.

A **slug change now moves a folder**, not a set of prefixes: `git mv
public/img/events/<old-slug> public/img/events/<new-slug>` and update every
`/img/events/<old-slug>/…` reference in `events-custom.json`. Do not leave the
old folder behind as a redirect — nothing reads it, and an empty-ish folder of
stale bytes is exactly the orphan this section is about. If the rename empties a
folder completely, remove the folder too. `<slug>/archive/` is the one part you
never hand-edit: re-run `npx tsx scripts/build-event-archive.mts --slug <new-slug>`
instead, which rewrites the folder and merges the new paths into
`lib/data/event-archive-photos.ts` — the module that references them.
