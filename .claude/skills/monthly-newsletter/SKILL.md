---
name: monthly-newsletter
description: Guides a Claude Code session through She Sharp's monthly newsletter loop — pulling the AI-staged draft, adding the required human editorial polish (founder note, cover, photo of the month, subject/preview), curating the month's REAL event photos onto Vercel Blob, sanity-checking the NZ Tech Pulse data section, previewing and test-sending, then approving the issue and building the per-recipient send batch from the subscriber database to the June 2026 showcase quality bar. Use whenever the user wants to work on the monthly newsletter — phrases like "review this month's newsletter", "let's do the newsletter draft", "edit the newsletter", "approve the newsletter", "send the newsletter", "the newsletter for August", or anything about turning the staged monthly draft into an email that goes out. Reference issue (THE approved template): lib/data/json/newsletter-issues/2026-06.json.
---

# Run the monthly newsletter loop

This skill walks Claude Code through one month's newsletter, from the
machine-staged draft to a send that a human runs, one batch at a time, with the
recipient list built from She Sharp's own database. Every issue is a JSON file
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

The web version stays `noindex` — it is not published to search. But since the
August 2026 issue it IS listed: every issue gets a card in the public archive
(`lib/data/newsletters-manual.ts`) pointing at its on-site render. See Step 7b.

All commands below are PowerShell-first (this repo's primary shell on Windows).

## Prerequisites

1. Working directory is the repo root (contains `lib/newsletter/`).
2. `CRON_SECRET` — Bearer token for the admin/cron endpoints (must match Vercel).
3. `RESEND_API_KEY` — for test sends, and for the `resend` CLI that a human uses
   to send the batches in Step 8e.
4. `BLOB_READ_WRITE_TOKEN` — for the photo step (read from env or `.env.local`).
5. `ffmpeg` + `ffprobe` on PATH — the photo pipeline transcodes with them.
6. `POSTGRES_URL` — the recipient list is read from this project's own database
   (the `newsletter_subscribers` table), not from Resend.

   **Read this before you plan a send.** As of today that table is **empty**.
   The ~1,560 people on the Mailchimp list have **not** been imported yet — that
   import is a later phase of this migration and has not happened. So a real
   batch built today would contain **nobody**. The live newsletter still goes
   out from **Mailchimp**; nothing has been cut over. If someone asks you to
   "send this month's newsletter" through this skill, you can do every step up
   to and including the test send, and then you must **stop and say that the
   subscriber list is empty** rather than producing an empty batch and calling
   it a send. Account detail: `docs/deployment/EMAIL_AUTHENTICATION.md`.
7. `EMAIL_UNSUBSCRIBE_SECRET` — signs each recipient's personal unsubscribe
   link. The batch build in Step 8d **hard-fails without it**; there is no
   fallback and no way to skip it.
8. For approve: production `BASE_URL` + `CRON_SECRET`.

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
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 15 --dry-run

# Looks good → run for real (uploads JPEGs to Blob, writes photoStrip + album URL back):
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 15
```

For each recap event it gathers candidates in priority order — on-page
`detailPageData.photos` → `eventArchivePhotos` renditions → (only if neither
exists and the event has a `galleryUrl`) a harvest of the public Google Photos
album — selects a landscape-leaning spread across events, transcodes each to an
**email-safe JPEG** (≤1200px, metadata stripped, <200KB), uploads to Blob under
`newsletter/<issueId>/photos/…`, and writes the strip + album URL.

### Step 3a — When the photos arrive as a folder

A big event's photography usually turns up as a folder of originals — a
photographer's export, a WhatsApp dump — with no album URL and nothing on the
event page yet. `--from-dir` takes that folder as the candidate set:

```powershell
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json `
  --from-dir "D:\path\to\picks" --max 15 --dry-run
```

Curate the folder BEFORE pointing the script at it — hundreds of raw frames are
not a selection. Copy the shots you want into a fresh directory and name them in
running order (`01-cover…`, `02-photo-of-the-month…`, `03-…`), because
`--from-dir` **preserves filename order** and skips the landscape-first sort: the
folder's order is your editorial decision and the script will not second-guess
it. Slot 01 is the cover, 02 the photo of the month, 03 the strip's full-width
lead, and the rest pair up. Contact sheets built with `sharp` are the fastest way
to review a large folder. `--slug` is only needed when the issue has more than
one recap event.

Then **hand-curate into three disjoint slots** (never rely on the renderer's
dedupe guard — curate so it never has to fire):

- **Cover** (`editorial.heroImageUrl`) — the best landscape people-shot. Move its
  Blob URL up from `photoStrip` into `editorial.heroImageUrl` and delete it from
  the strip. A panoramic group shot works especially well here: it sits under the
  masthead as a wide band rather than a deep block.
- **Photo of the month** (`editorial.photoOfTheMonth`) — the second-best shot,
  **from a different event where the month has more than one**, with a `caption`
  that names the real venue and an optional `eventSlug`. Move its Blob URL into
  `photoOfTheMonth.src` and delete it from the strip.
- **Strip** (`auto.photoStrip`) — the varied remaining shots. **Caps at 13**, and
  an ODD count is what you want: the first photo runs full width and the rest
  pair into rows of two, so `1 + 2n` fills every row and an even count leaves a
  gap in the last one. Write a real `alt` for each — see the caption note below.

**Captions.** `PhotoStrip` overrides a photo's `alt` with
"&lt;event&gt; · &lt;location&gt;" whenever its `eventSlug` resolves to a recap event. That
is right when the strip spans several events and wrong when it does not: a
single-event month would print the same caption up to thirteen times. In that
case **drop `eventSlug` from the strip entries** and write the venue into the
`alt` yourself, one line per photo, describing what is actually in the frame.

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
- Never ship placeholders to the real send if real photos exist. Swap first.
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
does NOT touch the subscriber list and does NOT send a batch. Inspect in Gmail (web + mobile)
and Outlook: layout, images, links, preheader.

### Step 6b — Reviewer round (only on explicit approval)

Sometimes the founder wants a wider human review before the real send. That is
allowed under all of these conditions:

- Step 6 has already been sent **and the founder has explicitly approved widening**.
  Never expand the recipient list on your own initiative.
- The list is a named reviewer list supplied by the founder — never the mailing
  list, never anyone who merely attended an event.
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

### Step 7b — Add the archive card

Add ONE entry to `NEWSLETTER_MANUAL` in `lib/data/newsletters-manual.ts`, with
`url` pointing at the on-site render rather than a Mailchimp campaign:

```ts
{ id: "2026-08", month: 8, year: 2026, url: "/resources/newsletters/2026-08" },
```

`components/resources/newsletters-grid.tsx` needs no change — it opens whatever
`url` holds in a new tab, internal or not.

**The route stays `noindex` and stays out of `app/sitemap.ts`.** Those two travel
together (see CLAUDE.md), and listing a noindex URL in the sitemap is what earns
a "Submitted URL marked 'noindex'" in Search Console. Linked-but-unindexed is the
deliberate state: the archive is for people who follow the link, not for search.

## Step 8 — Approve, then build and send the batches

This step used to be one command. It is now six small ones, in order: check the
domain's health (8a), mark the issue approved (8b), build the recipient list from
the database (8c), build the batch files (8d), send them (8e), and — only if a
send is interrupted — resume without double-mailing (8f).

**Nothing in 8a–8d sends any email.** The only step that puts mail in inboxes is
8e, and a **human** runs it.

### Step 8a — Deliverability check (before approving)

The newsletter is the only recurring bulk send on this domain, so this monthly
loop is where the domain's health gets looked at. Four things, ~5 minutes:

1. **DMARC report.** Cloudflare dashboard → `shesharp.org.nz` → Email → DMARC
   Management. Every sending source should be one you recognise — normally just
   Google Workspace, Amazon SES (Resend), and forwarders. **An unrecognised
   source is either a spoofer or a legitimate tool nobody authenticated; say so
   and stop before approving.**
2. **Last month's send numbers**, in the Resend dashboard under **Emails**
   (filter to the newsletter's sending address — these are individual sends now,
   so there is no Broadcasts page entry to read). Complaint rate must be **under
   0.1%**, hard bounces **under 2%**. Above either, do not send this month's
   issue until the list is cleaned.
3. **Sync the suppression register** so this send skips anyone who bounced,
   complained or unsubscribed since last month:
   ```powershell
   npx tsx scripts/email/suppression.ts sync
   ```
4. **Reconcile the subscriber table against the registers.** This reports anyone
   who is marked subscribed *and* sits on a suppression register:
   ```powershell
   npx tsx scripts/email/suppression.ts reconcile
   ```
   Those people are stripped automatically in Step 8c, so a small number here is
   not an emergency. But a count that keeps growing month after month means some
   part of the site is not writing unsubscribes back to the subscriber table —
   **report the number to the user; don't just move on.**

If any of these is out of bounds — or a single send would exceed ~1,000
recipients — that is the pre-agreed trigger to move marketing onto a separate
`news.shesharp.org.nz` sending subdomain. Raise it with the user; do not decide
alone. Background: `docs/deployment/EMAIL_AUTHENTICATION.md`.

The newsletter sends from **`She Sharp <newsletter@shesharp.org.nz>`** (the
`marketing` identity in `lib/email/senders.ts`) — byte for byte the visible
sender Mailchimp has been using for years. **Do not change the From.**
Preserving it is what carries the address's reputation across the
Mailchimp → Resend migration. If you see `noreply@` or `hello@` as the From
anywhere in the approve path, that is a regression.

The **Reply-To is `info@shesharp.org.nz`**, and that difference is deliberate.
`newsletter@` accepts mail, but as of August 2026 nobody on the team had its
password and a direct "does anyone read this inbox?" in Slack went unanswered,
so every subscriber who pressed Reply was writing into nothing.

### Step 8b — Approve the issue

```powershell
$env:BASE_URL="https://www.shesharp.org.nz"; $env:CRON_SECRET="…"
npx tsx scripts/newsletter/approve.ts 2026-08
```

**Approving no longer sends anything.** It marks the issue as approved on the
server and works out the issue's send slot (by default the **last Thursday,
10am NZ**), then posts a Slack message. It is the record that a human signed the
issue off — the mail itself is built and sent in 8c–8e.

Read what the script prints back before continuing. Common failures:

- *"not in the deployed bundle"* → Step 7 hasn't finished deploying. The approve
  endpoint reads the **deployed** JSON, never Redis. Wait, confirm the web
  version loads, retry.
- *"already approved"* → somebody already did this (idempotency guard). Nothing
  to do; carry on to 8c.
- *"Send slot … has passed"* → the last Thursday is behind you. Re-run with
  `--send-now`, which resolves the slot to now instead:
  ```powershell
  npx tsx scripts/newsletter/approve.ts 2026-08 --send-now
  ```

Confirm the Slack message landed.

### Step 8c — Build the recipient list from the database

```powershell
npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08
```

This reads `newsletter_subscribers`, keeps only the rows whose status is
`subscribed`, applies **both** suppression registers (the live one and the
committed one), and writes
`tmp/emails/recipients-newsletter-2026-08.json`.

It prints **counts and truncated hashes only — never an address**, so the output
is safe to paste into Slack, a PR or a message to the user. Read the counts back
to the user before going further:

```
  Confirmed subscribers      …
  Held back by suppression   …
  WILL BE MAILED             …
```

**If "WILL BE MAILED" is 0, stop.** As of today that is the expected result —
nobody has been imported from Mailchimp yet (see Prerequisite 6). Say so; do not
build a batch of nothing and describe it as a send.

Two flags, both of which can only ever make the list **smaller** — neither can
add anyone who is not already a confirmed, unsuppressed subscriber:

- `--only <address>` — narrow to one person. This is how you do a **real batch
  test**: the same machinery as the live send, aimed at a single confirmed
  mailbox.
  ```powershell
  npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08 --only chanmeng6666@gmail.com
  ```
- `--limit <n>` — keep only the first N. This is how you **ramp** a first real
  send: mail a small slice, watch the bounce and complaint numbers for a day,
  then do the rest.
  ```powershell
  npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08 --limit 50
  ```

**Whether to ramp, and how big the first slice is, is the founder's decision,
not yours.** Ask.

### Step 8d — Build the batch files

```powershell
npx tsx scripts/newsletter/build-newsletter-batch.ts 2026-08 `
  --recipients tmp/emails/recipients-newsletter-2026-08.json
```

This renders the issue once, then for each recipient substitutes their own
signed unsubscribe link, runs the pre-send gates (the same size and image checks
as the preview), splits the list into chunks of **100** — the maximum Resend
accepts in one request — and writes the batch files plus a **manifest** into
`tmp/emails/`.

**It sends nothing.** What it prints at the end is the list of commands a human
then runs in 8e. Keep that output; you need it.

If it fails:
- *missing `EMAIL_UNSUBSCRIBE_SECRET`* → it stops before writing anything. Set
  the variable; there is no way around this one.
- *a gate fails* (email too large, a WebP or site-relative image) → **nothing is
  written at all**, because a bad render is a whole-list problem, not a
  one-message one. Go back to Step 3/5, fix it, re-render, rebuild.

> **If it is the `image-format` gate on an event cover, run the twin generator.**
> The website serves WebP and Outlook cannot display it, so every event cover
> needs an email-safe JPEG beside it:
>
> ```powershell
> npx tsx scripts/newsletter/email-covers.ts            # generate what is missing
> npx tsx scripts/newsletter/email-covers.ts --check    # confirm, writes nothing
> ```
>
> Run it after any month where the issue picked up a new event, and commit the
> `.jpg` files it writes. It only ever generates covers an issue actually refers
> to. **Never ask anyone to relax the gate** — it is the only reason we know, and
> the old sending path ran no checks at all.

### Step 8e — Send the batches (a human runs these)

The commands printed by 8d look like this, one per chunk of 100, with a pause
line already written in between them:

```powershell
# chunk 1/3 — 100 recipient(s)
resend emails batch --file "tmp/emails/batch-newsletter-2026-08-newsletter-1.json" --idempotency-key … --batch-validation strict
Start-Sleep -Milliseconds 600
```

Rules for this step:

- **A human runs these commands, not the assistant.** Paste them to the user,
  say how many there are, and let them run them.
- **Keep the `Start-Sleep` lines.** Resend allows 2 requests a second; the
  printed 600ms pause is what keeps the send inside that. Don't paste all the
  commands as one block without them.
- **There is no `--dry-run` for `resend emails batch`.** The only preflight that
  exists is the local build in 8d plus `--batch-validation strict`, which makes
  Resend reject the whole chunk if any message in it is malformed. Never drop
  `--batch-validation strict`, and never "just try one to see". If you want to
  eyeball one message first, open a chunk file and read its `"html"` field.
- **Do not edit the printed commands.** The `--idempotency-key` is what stops the
  same chunk delivering twice if a command is re-run.
- Watch the first chunk's result before running the rest. If it errors, **stop
  and report** — do not keep going through the list.

### Step 8f — If a send is interrupted

A half-finished send is resumed by excluding everyone the previous run already
mailed. Rebuild with the previous run's manifest:

```powershell
npx tsx scripts/newsletter/build-newsletter-batch.ts 2026-08 `
  --recipients tmp/emails/recipients-newsletter-2026-08.json `
  --exclude-hashes tmp/emails/batch-newsletter-2026-08-newsletter.manifest.json
```

Everyone recorded in that manifest is skipped, so **nobody is mailed twice**.
Then run the newly printed commands from 8e.

Never resume by hand-picking who "probably didn't get it" — use the manifest.

## Step 9 — Wrap-up (after the send day)

- Set `meta.status` to `"sent"`. There is no broadcast id to record any more —
  the issue was sent as individual messages, not as one Resend broadcast.
- Record **where the send is written down** instead: the manifest path from Step
  8d (e.g. `tmp/emails/batch-newsletter-2026-08-newsletter.manifest.json`), how many
  recipients it covered, and the date it actually went out. Note it in the commit
  message and in the Slack thread. `tmp/` is gitignored and gets cleared, so if
  the manifest matters beyond this month, say so and ask the user where it should
  be kept.
- `git commit -m "chore(newsletter): mark 2026-08 sent"` + push.
- Confirm the archive card from Step 7b opens the right issue on
  `https://www.shesharp.org.nz/resources/newsletters`.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Photos are the product.** Run `scripts/newsletter/photos.ts <issue.json>`
   on every issue (`--from-dir` when they arrive as a folder). Photos must be
   email-safe JPEG on Blob — NEVER WebP, never Google-hotlinked, never
   site-relative.
2. **Zero photo repeats.** Cover, photo of the month, strip, and recap thumbnails
   must all be disjoint. Curate them apart (Step 3); never rely on the renderer's
   dedupe guard. Cover = best landscape people-shot; POM = second-best, from a
   different event where the month has one, with a venue-named caption; strip =
   an ODD number of varied others up to 13, so every paired row is full;
   `photoAlbumUrl` = the month's album.
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
   be swapped before the real send.
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
  each time — never widen on your own initiative.
- **A real batch is only ever built from `recipients-from-db.ts` output.** Never
  hand-write a recipients file, never paste addresses into one, never add
  someone to a list the script produced. If a person needs to receive the
  newsletter, they belong in `newsletter_subscribers` — that is the whole point
  of the table. The `--only` and `--limit` flags exist because they can only
  narrow the list; nothing in this loop may widen it.
- **Approve reads the deployed bundle, not Redis** — always commit + deploy
  (Step 7) before approving (Step 8b).
- **The assistant does not send the batches.** Steps 8c and 8d are safe to run;
  the `resend emails batch` commands in 8e are handed to a human.
- **Listed, but not indexed.** Every issue gets an archive card (Step 7b); the
  web version keeps `noindex` and stays out of `app/sitemap.ts`.

## Flexible sections — decision table

| Section | Field | Shows when | Source |
|---|---|---|---|
| Cover | `editorial.heroImageUrl` | a strong landscape shot exists | best photo, promoted out of the strip (Blob JPEG) |
| Founder note | `editorial.founderNote` | always | hand-written; fixed signature + photoUrl |
| Headline event | `editorial.headline` | ONE upcoming event deserves top billing | human curation; facts read from the matching `auto.upcomingEvents` entry |
| Photo strip | `auto.photoStrip` | ≥1 real event photo | `photos.ts` upload, then human-pruned to an odd count ≤13 |
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
- Manage who is on the mailing list. Subscribing, unsubscribing and importing
  people into `newsletter_subscribers` all happen outside this loop; this skill
  only reads the list as it stands.
- Import the Mailchimp subscribers. That has not happened yet and is not a step
  here — see Prerequisite 6.
- Actually run the `resend emails batch` commands (a human does, Step 8e).
- Send transactional or auth email.
- Publish the web version to search — the archive card links it, `noindex` stays.
