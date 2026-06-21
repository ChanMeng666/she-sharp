# Image conventions for event assets

## Target directory

All event images live at:

```
public/img/events/
```

Relative path as stored in `events-custom.json` is always `/img/events/<filename>`.

## File naming

Naming is derived from the event `slug` to keep search/grep easy and avoid
collisions. Lower-case, kebab-case, ASCII only.

The prefix is the event **`slug`** (newer slugs do not start with `event-`, e.g.
`peyvand-academy-20-june-2026`). Substitute the real slug for `<slug>` below.

| Role | Pattern | Example |
|---|---|---|
| Cover poster | `<slug>-cover.<ext>` | `peyvand-academy-20-june-2026-cover.png` |
| Speaker photo | `<slug>-<kebab-speaker-name>.<ext>` | `event-aut-linkedin-15-may-2026-stuart-little.jpg` |
| Gallery photo (post-event) | `<slug>-photo-<n>.webp` | `peyvand-academy-20-june-2026-photo-1.webp` |
| Sponsor-specific asset (rare) | `<slug>-<sponsor>.<ext>` | `event-aut-linkedin-15-may-2026-aut.png` |

The skill already receives `<slug>` from the user. Speaker-name kebab-case
should match the speaker's full name (first + last), lowercased with hyphens
and any diacritics stripped — e.g., `Stuart Little` → `stuart-little`,
`Sofía García` → `sofia-garcia`.

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
- **Convert to `.webp`** before committing (the project ships no `sharp`/`cwebp`
  binary — use Python `Pillow`): resize to ≤1600px wide, quality ≈82,
  `ImageOps.exif_transpose` first so phone photos aren't sideways. Target
  ~100–250 kB each.

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

1. Download + curate + convert as above → `<slug>-photo-<n>.webp`.
2. In the event's `detailPageData`: set `status` to `"past"`, set `galleryUrl`
   to the public album link, and populate `photos[]` with one
   `{ url, alt }` per webp (descriptive alt text).
3. Run the CI gate; commit. No speakers/agenda change — this is purely the
   post-event addition.

## Forbidden image sources

- Do **not** pull images from `scripts/` scratch areas or temp paths.
- Do **not** re-use images from other events' slugs. Every event gets its
  own assets even if visually similar.
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
