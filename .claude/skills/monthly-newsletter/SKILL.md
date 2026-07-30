---
name: monthly-newsletter
description: Guides a Claude Code session through She Sharp's monthly newsletter loop — pulling the AI-staged draft, adding the required human editorial polish (founder note, cover, photo of the month, subject/preview), curating the month's REAL event photos onto Vercel Blob, sanity-checking the NZ Tech Pulse data section, and previewing/test-sending/approving the Resend broadcast to the June 2026 showcase quality bar. Use whenever the user wants to work on the monthly newsletter — phrases like "review this month's newsletter", "let's do the newsletter draft", "edit the newsletter", "approve the newsletter", "send the newsletter", "the newsletter for August", or anything about turning the staged monthly draft into a scheduled email. Reference issue (THE approved template): lib/data/json/newsletter-issues/2026-06.json.
---

# Run the monthly newsletter loop

This skill walks Claude Code through one month's newsletter, from the
machine-staged draft to a scheduled Resend broadcast. Every issue is a JSON file
at `lib/data/json/newsletter-issues/<YYYY-MM>.json` with two blocks
(`lib/newsletter/schema.ts`):

- **`auto`** — machine snapshot of events + stats + the photo strip. Refreshed
  freely on every (re)generation and by the local photo pipeline. Never
  hand-edit it except the one documented exception (pruning `photoStrip`).
- **`editorial`** — human-owned copy (founder note, cover, photo of the month,
  subject/preview, CTA, sponsor thanks, pulse). The AI writes a *placeholder*
  draft once; a human must give it real voice. **Regeneration must never
  silently overwrite this** (only a `force` regen does — see Guardrails).

## Reference issue — the quality bar

`lib/data/json/newsletter-issues/2026-06.json` is THE user-approved showcase
template. **Read it first, every month.** It defines the tone, the founder
signature, the cover/POM/strip photo curation, and the pulse shape you are
reproducing. Match its structure and warmth; do not invent new sections.

During the **pilot** the newsletter is unlisted: the web version is `noindex`
and issues are NOT added to the public archive (`lib/data/newsletters-manual.ts`).
Keep it that way until told otherwise.

All commands below are PowerShell-first (this repo's primary shell on Windows).

## Prerequisites

1. Working directory is the repo root (contains `lib/newsletter/`).
2. `CRON_SECRET` — Bearer token for the admin/cron endpoints (must match Vercel).
3. `RESEND_API_KEY` — for test sends and approve.
4. `BLOB_READ_WRITE_TOKEN` — for the photo step (read from env or `.env.local`).
5. `ffmpeg` + `ffprobe` on PATH — the photo pipeline transcodes with them.
6. For approve/schedule: production `BASE_URL` + the Resend newsletter env
   (`RESEND_NEWSLETTER_SEGMENT_ID`, `RESEND_NEWSLETTER_TOPIC_ID`) set on the server.

---

## Step 1 — Fetch the staged draft

The issue id is the **current NZ month** as `YYYY-MM` (e.g. `2026-08`). Pull the
Redis-staged draft the monthly cron produced and save it as the repo fixture,
pretty-printed:

```powershell
curl.exe -s -H "Authorization: Bearer $env:CRON_SECRET" `
  https://www.shesharp.org.nz/api/admin/newsletter/draft/2026-08 `
  -o lib/data/json/newsletter-issues/2026-08.json

# Pretty-print in place (preserves key order; ConvertTo-Json would reorder keys)
node -e "const f='lib/data/json/newsletter-issues/2026-08.json';const fs=require('fs');fs.writeFileSync(f, JSON.stringify(JSON.parse(fs.readFileSync(f,'utf8')),null,2)+'\n')"
```

**If the fetch returns 404** (`No staged draft found`), trigger generation, then
re-fetch:

```powershell
curl.exe -s -X POST -H "Authorization: Bearer $env:CRON_SECRET" `
  -H "Content-Type: application/json" `
  -d '{"month":"2026-08","force":true}' `
  https://www.shesharp.org.nz/api/cron/newsletter-draft
```

`force:true` bypasses the draft-day gate and the already-staged guards. The
generated draft already includes a source-verified **pulse** section (see
`lib/newsletter/pulse.ts`) — you sanity-check it in Step 3, you do not author it.

## Step 2 — Register the issue

Add ONE import line and ONE map entry to `lib/newsletter/issues-registry.ts`:

```ts
import issue2026_08 from "@/lib/data/json/newsletter-issues/2026-08.json";

const ISSUES: Record<string, unknown> = {
  "2026-07": issue2026_07,
  "2026-08": issue2026_08,
};
```

Without this the web version and the approve endpoint can't find the issue.

## Step 3 — Curate the month's photos (photos ARE the product)

**Run the photo step on EVERY issue** — a strong issue is carried by real event
photos. It uploads email-safe JPEGs to Vercel Blob and populates `auto.photoStrip`
+ `auto.photoAlbumUrl` (the serverless cron cannot — no ffmpeg/harvesting).

```powershell
# Preview the selection + conversion plan (no upload, no write):
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 6 --dry-run

# Looks good → run for real (uploads JPEGs to Blob, writes photoStrip + album URL back):
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 6
```

For each recap event it gathers candidates in priority order — on-page
`detailPageData.photos` → `eventArchivePhotos` renditions → (only if neither
exists and the event has a `galleryUrl`) a harvest of the public Google Photos
album — selects a landscape-leaning spread across events, transcodes each to an
**email-safe JPEG** (≤1200px, metadata stripped, <200KB), uploads to Blob under
`newsletter/<issueId>/photos/…`, and writes the strip + album URL.

Then **hand-curate into three disjoint slots** (never rely on the renderer's
dedupe guard — curate so it never has to fire):

- **Cover** (`editorial.heroImageUrl`) — the best landscape people-shot. Move its
  Blob URL up from `photoStrip` into `editorial.heroImageUrl` and delete it from
  the strip.
- **Photo of the month** (`editorial.photoOfTheMonth`) — the second-best shot,
  **from a different event**, with a `caption` that names the real venue and an
  optional `eventSlug`. Move its Blob URL into `photoOfTheMonth.src` and delete
  it from the strip.
- **Strip** (`auto.photoStrip`) — 4–6 varied remaining shots spanning ≥2 events.
  Fix each `alt` if needed. Caps at 6.

All photo URLs must be **absolute Blob JPEGs** — never WebP, never Google-hotlinked,
never site-relative. If the month's recap events have no photos and no album, all
photo slots come out empty — that is a VALID issue; the template auto-hides each
empty section. Never pad with filler.

### Step 3b — Placeholder photos (only when real ones are still coming)

Narrow, documented exception to "never pad with filler". Use it **only** when a
recap event has genuinely happened (or is being treated as having happened) but
its photos have not arrived yet — e.g. the album link is still pending. It exists
so the issue can be laid out and reviewed now, and the real photos dropped in
later without touching the JSON.

```powershell
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-07.json --placeholders --dry-run
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-07.json --placeholders
```

This generates six branded gradient JPEGs (She Sharp purple ramp, the event name
and a visible "photo coming soon" line) and uploads them to **fixed, guessable,
overwritable** paths:

```
newsletter/<issueId>/photos/{hero,photo-of-the-month,strip-1..4}.jpg
```

Unlike the real-photo path, these upload with `addRandomSuffix: false`,
`allowOverwrite: true` and `cacheControlMaxAge: 300` (Blob's default is one YEAR).
That is the whole point: **swapping in real photos = re-uploading to the same six
paths. The issue JSON never changes.**

Rules:
- Placeholder strip entries carry **no `eventSlug`**. `PhotoStrip.captionFor()`
  overrides `alt` when the slug resolves, which would caption a synthetic image
  with a real venue name.
- Never ship placeholders to the real broadcast if real photos exist. Swap first.
- Once real photos land, prefer re-running the normal Step 3 path (add the
  event's `galleryUrl` and let `photos.ts` harvest) over hand-uploading.

## Step 4 — Edit the `editorial` block (give it real voice)

The AI draft is a starting point. Match the tone and structure of the reference
issue (`2026-06.json`). **Required:**

- **`founderNote.bodyMd`** — rewrite in the founder's warm, in-person Auckland
  voice (NZ spelling), naming real venues/neighbourhoods and **one concrete
  in-the-room detail** from a real event. Do not start with a greeting (the
  template injects one).
- **`founderNote.heading`** — e.g. `"A note from our founder"`.
- **`founderNote.signature`** — always exactly
  `"Dr. Mahsa McCauley, Founder & Chair, She Sharp"` (override the AI's
  placeholder).
- **`founderNote.photoUrl`** — always
  `https://vqfhbpoqrf3jfw3s.public.blob.vercel-storage.com/newsletter/people/mahsa-mccauley.jpg`
- **`subjectLine`** ≤50 chars (≤1 emoji, only if natural).
- **`previewText`** ≤120 chars — complements the subject, does NOT repeat its words.
- **`recapIntro`** — 1–2 sentences framing last month.
- **`primaryCta`** — the SINGLE most important action (usually the next event's
  registration link). Label ≤40 chars. Don't dilute it.
- **`pulse`** — sanity-check only. Numbers are already copied verbatim from
  fetched sources by the pipeline; confirm each `sourceUrl` resolves. **Set
  `newsBite` to `null`** unless the drafted item is genuinely relevant and local
  (宁缺毋滥 — better empty than filler).

**Optional:** `eventBlurbs` (per-slug one-liners), `opportunities` (mentor /
volunteer / donate — keep the three canonical hrefs), `sponsorThanks` (name ONLY
partners/venues present in the event data, or `null` to omit).

- **`headline`** — promote ONE upcoming event to a marquee block under the founder
  note. Use it when a month has a single obvious must-attend event; leave it `null`
  when the month is evenly weighted. `eventSlug` must match an entry in
  `auto.upcomingEvents` — every hard fact is read from there, so only the framing
  copy (`eyebrow`, `dateBadge`, `blurb`, CTA) lives in `editorial`. The promoted
  event is removed from "What's next" and its CTA replaces the one at the bottom.
- **`pulse.newsBites`** — up to 3 source-attributed NZ items, replacing the single
  `newsBite`. Same 宁缺毋滥 rule: one strong local item beats three vendor press
  releases. Every number must appear verbatim in the linked source, and every
  source must be NZ-relevant to a reader here.

Never re-add a spotlight / featured-mentee section — it was removed. Only feature
a person when you can verify a real photo + source (there is no schema slot for it
today, so in practice: don't).

Do not touch the rest of the `auto` block by hand — it is the machine snapshot.

## Step 5 — Preview loop

```powershell
npx tsx scripts/newsletter/preview.ts lib/data/json/newsletter-issues/2026-08.json --open
```

Writes `tmp/emails/newsletter-2026-08.<mode>.html`. Check:
- Both `broadcast` and `preview` modes render without error.
- Each rendered size is **< 100 KB** (renderer throws above; Gmail clips larger).
- Light **and** dark inbox appearance; all images load (URLs absolute); no photo
  repeats across cover / POM / strip / recap thumbnails.

## Step 6 — Test send

**Default: send ONLY to `chanmeng6666@gmail.com`** — the single approved test
mailbox. This is always the first send, and by default the only one.

```powershell
$env:RESEND_API_KEY="re_…"
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json chanmeng6666@gmail.com
```

This uses the transactional `sendEmail` helper with a `[TEST]` subject prefix — it
does NOT touch Resend broadcasts/segments/topics. Inspect in Gmail (web + mobile)
and Outlook: layout, images, links, preheader.

### Step 6b — Reviewer round (only on explicit approval)

Sometimes the founder wants a wider human review before the broadcast. That is
allowed under all of these conditions:

- Step 6 has already been sent **and the founder has explicitly approved widening**.
  Never expand the recipient list on your own initiative.
- The list is a named reviewer list supplied by the founder — never a segment,
  never the mailing list, never anyone who merely attended an event.
- **Maximum 25 addresses** (the script hard-caps this).
- **One email per address.** The script loops rather than passing an array to
  `to:`, so reviewers never see each other's addresses.

```powershell
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json "a@x.com,b@y.com" --dry-run
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json "a@x.com,b@y.com"
```

Always `--dry-run` first and read the parsed list back before the real send.

Iterate Steps 3–6 until it matches the June bar — **email UI quality is the
pilot's acceptance bar.**

## Step 7 — Ship (commit + deploy)

The approve endpoint reads the **deployed** JSON bundle, never Redis — so commit
and deploy first.

```powershell
git add lib/data/json/newsletter-issues/2026-08.json lib/newsletter/issues-registry.ts
git commit -m "feat(newsletter): add 2026-08 issue"
git push
```

Wait for the GitHub Actions deploy (this repo deploys via prebuilt Actions on push
to `main`, not a Vercel Git connection). Spot-check the web version:
`https://www.shesharp.org.nz/resources/newsletters/2026-08`.

## Step 8 — Approve and schedule

```powershell
$env:BASE_URL="https://www.shesharp.org.nz"; $env:CRON_SECRET="…"
npx tsx scripts/newsletter/approve.ts 2026-08
```

On success it prints the broadcast id + NZ-local send time and posts a Slack
"scheduled" message. By default it schedules the **last Thursday, 10am NZ**.

**409 / failure handling:**
- *"not in the deployed bundle"* → Step 7 hasn't finished deploying. Wait, confirm
  the web version loads, retry.
- *"already scheduled / sent"* → already approved (idempotency guard). Nothing to do.
- *"Send slot … has passed"* → the last Thursday is behind you. Re-run with
  `--send-now` (server delays 5 min as a cancel window):
  ```powershell
  npx tsx scripts/newsletter/approve.ts 2026-08 --send-now
  ```

Confirm the Slack "scheduled" message landed.

## Step 9 — Wrap-up (after the send day)

- Set `meta.status` to `"sent"` and `meta.broadcastId` to the id from Step 8.
- `git commit -m "chore(newsletter): mark 2026-08 sent"` + push.

During the pilot **do NOT** add the issue to `lib/data/newsletters-manual.ts` —
it stays unlisted.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Photos are the product.** Run `scripts/newsletter/photos.ts <issue.json>
   --max 6` on every issue. Photos must be email-safe JPEG on Blob — NEVER WebP,
   never Google-hotlinked, never site-relative.
2. **Zero photo repeats.** Cover, photo of the month, strip, and recap thumbnails
   must all be disjoint. Curate them apart (Step 3); never rely on the renderer's
   dedupe guard. Cover = best landscape people-shot; POM = second-best from a
   different event with a venue-named caption; strip = 4–6 varied others across
   ≥2 events; `photoAlbumUrl` = the month's album.
3. **Founder signature is fixed.** `founderNote.signature` = exactly
   `"Dr. Mahsa McCauley, Founder & Chair, She Sharp"`, always paired with
   `founderNote.photoUrl` =
   `https://vqfhbpoqrf3jfw3s.public.blob.vercel-storage.com/newsletter/people/mahsa-mccauley.jpg`.
4. **No spotlight / featured-person section.** Never re-add people who can't be
   verified with a real photo + source.
5. **Truthfulness.** Pulse numbers come verbatim from fetched sources (the
   pipeline guarantees it; you just sanity-check the source links). Venues only
   from event data; sponsor thanks names only partners present in the data; drop
   `pulse.newsBite` when nothing genuinely relevant/local surfaced.
6. **Sections auto-hide when empty** (cover / strip / POM / headline / news /
   sponsors). An issue with no photos is VALID — never pad with filler. The ONE
   exception is the documented placeholder path (Step 3b), for an event whose real
   photos are still coming; placeholders must be visibly labelled as such and must
   be swapped before the real broadcast.
7. **Voice.** Warm in-person Auckland community voice, NZ spelling, real venue
   names, one concrete in-the-room detail in the founder note. Subject ≤50
   (≤1 emoji); preview ≤120 (complements, not repeats); ONE primary CTA. The AI
   draft is a starting point — hand-polish to the `2026-06.json` bar.

Also non-negotiable:
- **Never regenerate over human-edited editorial.** `force:true` overwrites the
  `editorial` block — only before a human has edited, or on explicit "start over".
- **All image URLs absolute** (`https://…`). Email clients don't resolve
  site-relative paths.
- **The first test send always goes to `chanmeng6666@gmail.com` alone.** Widening
  to a named reviewer list (Step 6b, max 25) requires explicit founder approval
  each time — never widen on your own initiative, and never to a segment.
- **Approve reads the deployed bundle, not Redis** — always commit + deploy
  (Step 7) before approving (Step 8).
- **Keep it unlisted during the pilot** — no archive entry, `noindex` stays.

## Flexible sections — decision table

| Section | Field | Shows when | Source |
|---|---|---|---|
| Cover | `editorial.heroImageUrl` | a strong landscape shot exists | best photo, promoted out of the strip (Blob JPEG) |
| Founder note | `editorial.founderNote` | always | hand-written; fixed signature + photoUrl |
| Headline event | `editorial.headline` | ONE upcoming event deserves top billing | human curation; facts read from the matching `auto.upcomingEvents` entry |
| Photo strip | `auto.photoStrip` | ≥1 real event photo | `photos.ts` upload, then human-pruned |
| Photo of the month | `editorial.photoOfTheMonth` | a second good shot exists | second-best photo (different event) + venue caption |
| Last-month recap | recap cards | recap events exist OR POM set | `auto.recapEvents` + `editorial.eventBlurbs` |
| Upcoming + CTA | `auto.upcomingEvents`, `editorial.primaryCta` | upcoming events exist | event data; CTA = next event's registration link. The promoted headline event is filtered out of this list, and the button is suppressed here when a headline block is present (that block carries the issue's one CTA) |
| NZ Tech Pulse | `editorial.pulse` | pipeline produced verified data | `lib/newsletter/pulse.ts` (SEEK + RSS, verbatim-guarded) |
| — hero stat | `pulse.heroStat` | present in draft | SEEK report (verbatim) or evergreen fallback |
| — news list | `pulse.newsBites` | 1-3 genuinely relevant/local items | NZ tech RSS + hand-verified sources; wins over `newsBite` when set |
| — news bite | `pulse.newsBite` | legacy single-item fallback | NZ tech RSS; else `null` (drop it) |
| — did you know | `pulse.didYouKnow` | present in draft | evergreen NZ/Auckland fact pool |
| Stats strip | `auto.stats` | always | site stats |
| Get involved | `editorial.opportunities` | always | mentor / volunteer / donate (canonical hrefs) |
| Sponsor thanks | `editorial.sponsorThanks` | partners/venues in the data | named from event data, or `null` |

## What this skill does *not* do

- Generate the AI draft itself (the monthly cron / the `force` POST does).
- Manage Resend segments/topics/contacts (see `scripts/newsletter/` setup).
- Send transactional or auth email.
- Add the issue to the public newsletter archive during the pilot.
