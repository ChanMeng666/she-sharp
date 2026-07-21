---
name: monthly-newsletter
description: Guides a Claude Code session through She Sharp's monthly newsletter loop — pulling the AI-staged draft, adding the required human editorial polish, previewing/test-sending the email, shipping the issue, and approving the Resend broadcast. Use whenever the user wants to work on the monthly newsletter — phrases like "review this month's newsletter", "let's do the newsletter draft", "edit the newsletter", "approve the newsletter", "send the newsletter", "the newsletter for August", or anything about turning the staged monthly draft into a scheduled email. Covers fetching the Redis-staged draft via the admin endpoint, registering the issue, editing the human-owned `editorial` block (spotlight, photo of the month, founder note, subject/preview), the local preview + test-send loop, committing + deploying, and running the approve script that schedules the broadcast for the last-Thursday send slot.
---

# Run the monthly newsletter loop

This skill walks a human + Claude Code through one month's newsletter, from the
machine-staged draft to a scheduled Resend broadcast. The system splits every
issue into two blocks (see `lib/newsletter/schema.ts`):

- **`auto`** — a machine snapshot of events + stats. Refreshed freely on every
  (re)generation. You never hand-edit this.
- **`editorial`** — human-owned copy (founder note, spotlight, photo of the
  month, subject line, CTAs). The AI writes a *placeholder* draft once; a human
  must give it a real voice. **Regeneration must never silently overwrite this**
  (only a `force` regeneration does — see Guardrails).

Issues live at `lib/data/json/newsletter-issues/<YYYY-MM>.json` and are served
to the email + web version through `lib/newsletter/issues-registry.ts`.

During the **pilot** the newsletter is unlisted: the web version has a
`noindex` header and is NOT added to the public archive
(`lib/data/newsletters-manual.ts`). Keep it that way until told otherwise.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "review this month's newsletter" / "let's do the August newsletter"
- "edit the newsletter draft" / "rewrite the founder note"
- "approve the newsletter" / "schedule the newsletter" / "send it"
- "add the spotlight for this month's issue"

If the user is talking about the monthly email issue, this skill applies. All
commands below are PowerShell-first (this repo's primary shell on Windows); the
`$env:VAR` assignments and `curl.exe` calls are written for PowerShell.

## Prerequisites

1. Working directory is the repo root (contains `lib/newsletter/` and
   `lib/data/json/newsletter-issues/`).
2. `CRON_SECRET` is known to you (the Bearer token for the admin/cron endpoints;
   must match the value set in Vercel). Ask the user if you don't have it.
3. For test sends: `RESEND_API_KEY` in the environment.
4. For approve/schedule: the production `BASE_URL` + `CRON_SECRET`, and the
   Resend newsletter env (`RESEND_NEWSLETTER_SEGMENT_ID`,
   `RESEND_NEWSLETTER_TOPIC_ID`) already set on the server.

## Workflow

### Step 1 — Determine the issue id and fetch the staged draft

The issue id is the **current NZ month** as `YYYY-MM` (e.g. `2026-08`). Pull the
Redis-staged draft the monthly cron produced and save it as the repo fixture,
pretty-printed:

```powershell
curl.exe -s -H "Authorization: Bearer $env:CRON_SECRET" `
  https://www.shesharp.org.nz/api/admin/newsletter/draft/2026-08 `
  -o lib/data/json/newsletter-issues/2026-08.json

# Pretty-print in place (preserves key order; PowerShell's ConvertTo-Json would reorder keys)
node -e "const f='lib/data/json/newsletter-issues/2026-08.json';const fs=require('fs');fs.writeFileSync(f, JSON.stringify(JSON.parse(fs.readFileSync(f,'utf8')),null,2)+'\n')"
```

**If the fetch returns 404** (`No staged draft found`), the draft hasn't been
generated yet. Trigger generation manually, then re-fetch:

```powershell
curl.exe -s -X POST -H "Authorization: Bearer $env:CRON_SECRET" `
  -H "Content-Type: application/json" `
  -d '{"month":"2026-08","force":true}' `
  https://www.shesharp.org.nz/api/cron/newsletter-draft
```

`force:true` bypasses the draft-day gate and the "already committed / already
staged" guards. Then re-run the fetch above. If the OpenAI/Redis pipeline is
unavailable, you can author the fixture by hand from the `2026-07.json` template
plus the real `auto` block (`assembleAutoData(year, month)`) — but the staged
draft is the normal path.

### Step 2 — Register the issue

Add ONE import line and ONE map entry to
`lib/newsletter/issues-registry.ts` (same one-line-per-month convention as
`lib/data/newsletters-manual.ts`):

```ts
import issue2026_08 from "@/lib/data/json/newsletter-issues/2026-08.json";

const ISSUES: Record<string, unknown> = {
  "2026-07": issue2026_07,
  "2026-08": issue2026_08,
};
```

Without this the web version and the approve endpoint can't find the issue.

### Step 3 — Edit the `editorial` block (the human's job)

The AI draft is a starting point, not a finished issue. Give it a real voice.
**Required human inputs:**

- **`founderNote`** — rewrite `bodyMd` in the founder's actual voice; the AI
  draft is a placeholder. Keep `heading` + `signature` accurate.
- **`spotlight`** — pick a real person for the month. Set `name`, `role`, a
  short `qa` array (2–3 genuine Q&As), and an **absolute** `photoUrl`. Source the
  photo from `public/img/team/…` or a real event photo, and absolutize it
  (`https://www.shesharp.org.nz/img/…`). Leave `null` only if there is genuinely
  no one to feature this month.
- **`photoOfTheMonth`** — pick a strong shot from a real event that month
  (`detailPageData.photos` in the events data), absolutized, with a caption and
  optional `eventSlug`. `null` if the month's events have no photos yet.
- **`subjectLine`** (≤50 chars) and **`previewText`** (≤120 chars) — tune for the
  actual content and open-rate. These limits are enforced by the schema.

**Optional:** `eventBlurbs` (per-slug one-liners overriding the auto
`shortDescription`), `primaryCta` (keep it the single most important action —
see Guardrails), `opportunities`, `sponsorThanks` (or `null` to omit).

Do not touch the `auto` block by hand — it is the machine snapshot.

### Step 3b — Refresh the event photo strip

The email carries a strip of real event photos from the month
(`auto.photoStrip`) plus a "view all photos" album link (`auto.photoAlbumUrl`).
The serverless cron can't build these (no ffmpeg / no album harvesting), so
refresh them locally with the photo pipeline:

```powershell
# Preview the selection + conversion plan without uploading or writing:
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 4 --dry-run

# Looks good → run for real (uploads JPEGs to Vercel Blob, writes photoStrip back):
npx tsx scripts/newsletter/photos.ts lib/data/json/newsletter-issues/2026-08.json --max 4
```

For each recap event it gathers candidates in priority order — on-page
`detailPageData.photos` → `eventArchivePhotos` archive renditions → (only if
neither exists and the event has a `galleryUrl`) a harvest of the public Google
Photos album — then selects a landscape-leaning spread across events, transcodes
each to an **email-safe JPEG** (≤1200px, metadata stripped, <200KB via the
ffmpeg CLI), uploads to Blob under `newsletter/<issueId>/photos/…`, and writes
`auto.photoStrip` + `auto.photoAlbumUrl` back into the issue JSON.

- **`photoStrip` is machine-refreshed but human-prunable.** Re-running rebuilds
  it wholesale; to curate, hand-edit the `auto.photoStrip` array in the issue
  JSON afterward (drop weak shots, reorder, fix `alt` text). It caps at 6.
- **Email photos MUST stay JPEG.** Outlook renders WebP as broken images, so
  never point `src` at a `.webp` (the pipeline transcodes webp archive photos to
  JPEG for exactly this reason). Requires `BLOB_READ_WRITE_TOKEN` (read from the
  environment or `.env.local`).
- If the month's recap events have no photos and no album, the strip comes out
  empty — that's fine; the template simply omits the section.

`BLOB_READ_WRITE_TOKEN` is the only new env this step needs; `--dry-run` needs
none. This step edits the machine-owned `auto` block on purpose (it is the one
exception to "don't hand-edit `auto`", and only via this pipeline or a manual
prune of `photoStrip`).

### Step 4 — Preview loop

Render both modes locally and eyeball them:

```powershell
npx tsx scripts/newsletter/preview.ts lib/data/json/newsletter-issues/2026-08.json --open
```

Writes `tmp/emails/newsletter-2026-08.<mode>.html` and (with `--open`) opens them.
Check:
- Both `broadcast` and `preview` modes render without error.
- Each rendered size is **< 100 KB** (the renderer throws above that — Gmail
  clips larger messages).
- Light **and** dark inbox appearance; images load (URLs must be absolute).

Pass `--mode broadcast` or `--mode preview` to render just one.

### Step 5 — Test send

Send a single real email to yourself and inspect it in actual clients:

```powershell
$env:RESEND_API_KEY="re_…"
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json you@example.com
```

This uses the transactional `sendEmail` helper with a `[TEST]` subject prefix —
it does NOT touch Resend broadcasts/segments/topics. Check the result in Gmail
(web + mobile) and Outlook: layout, images, links, and the inbox preheader.

Iterate Steps 3–5 until the email quality is right — **email UI quality is the
pilot's acceptance bar.**

### Step 6 — Ship (commit + deploy)

The approve endpoint reads the **deployed** JSON bundle, never the Redis draft —
so the issue must be committed and live first.

```powershell
git add lib/data/json/newsletter-issues/2026-08.json lib/newsletter/issues-registry.ts
git commit -m "feat(newsletter): add 2026-08 issue"
git push
```

Wait for the GitHub Actions deploy to finish (this repo deploys via prebuilt
GitHub Actions on push to `main`, not a Vercel Git connection). Then spot-check
the web version:

```
https://www.shesharp.org.nz/resources/newsletters/2026-08
```

### Step 7 — Approve and schedule

Trigger the server to create + schedule the Resend broadcast:

```powershell
$env:BASE_URL="https://www.shesharp.org.nz"; $env:CRON_SECRET="…"
npx tsx scripts/newsletter/approve.ts 2026-08
```

On success it prints the broadcast id and the NZ-local send time, and posts a
Slack "scheduled" message (to `SLACK_NEWSLETTER_WEBHOOK_URL`, falling back to the
contact webhook). By default it schedules for the issue's **canonical send slot
(the last Thursday, 10am NZ)**.

**Handling a 409 / failure:**
- *"not in the deployed bundle"* → Step 6 hasn't finished deploying. Wait for the
  deploy, confirm the web version loads, then retry.
- *"already scheduled / sent"* → the issue was already approved (idempotency
  guard). Nothing to do.
- *"Send slot … has passed"* → the last Thursday is already behind you. Re-run
  with `--send-now` to queue an immediate send (the server delays it 5 minutes as
  a dashboard cancel window):
  ```powershell
  npx tsx scripts/newsletter/approve.ts 2026-08 --send-now
  ```

Confirm the Slack "scheduled" message landed.

### Step 8 — Wrap-up (after the send day)

Once the broadcast has gone out, record it in the fixture and commit:

- Set `meta.status` to `"sent"` and `meta.broadcastId` to the id from Step 7 in
  `lib/data/json/newsletter-issues/2026-08.json`.
- `git commit -m "chore(newsletter): mark 2026-08 sent"` + push.

During the pilot **do NOT** add the issue to `lib/data/newsletters-manual.ts`
(the public archive) — it stays unlisted. Post-pilot, the archive step is to add
a `NEWSLETTER_MANUAL` entry pointing at the web version
(`/resources/newsletters/<YYYY-MM>`).

## Guardrails

- **Never regenerate over human-edited editorial.** Re-running the draft with
  `force:true` overwrites the `editorial` block. Only do it before a human has
  edited, or when the user explicitly wants to discard their edits and start over.
- **All image/photo URLs must be absolute** (`https://www.shesharp.org.nz/…`).
  Email clients don't resolve site-relative paths. This applies to
  `spotlight.photoUrl` and `photoOfTheMonth.src`.
- **One primary CTA.** `primaryCta` is the single most important action of the
  issue — don't dilute it. Secondary asks go in `opportunities`.
- **Email UI quality is the acceptance bar.** Don't ship until the render looks
  right in Gmail (web + mobile) and Outlook, in both light and dark mode, under
  100 KB.
- **Keep it unlisted during the pilot** — no archive entry, `noindex` stays.
- **The approve endpoint reads the deployed bundle, not Redis** — always commit +
  deploy (Step 6) before approving (Step 7).

## What this skill does *not* do

- Generate the AI draft itself (that's the monthly cron / the `force` POST).
- Manage Resend segments/topics/contacts (see `scripts/newsletter/` setup).
- Send transactional or auth email.
- Add the issue to the public newsletter archive during the pilot.
