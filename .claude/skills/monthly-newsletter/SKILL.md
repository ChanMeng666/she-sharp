---
name: monthly-newsletter
description: Guides a Claude Code session through She Sharp's monthly newsletter loop — creating the month's issue file locally, writing the human editorial content (founder note, cover, photo of the month, subject/preview), curating the month's REAL event photos onto Vercel Blob, sanity-checking the NZ Tech Pulse data section, previewing and test-sending, then approving the issue and building the per-recipient send batch from the subscriber database to the June 2026 showcase quality bar. Use whenever the user wants to work on the monthly newsletter — phrases like "review this month's newsletter", "let's do the newsletter draft", "edit the newsletter", "approve the newsletter", "send the newsletter", "the newsletter for August", or anything about turning the month's issue file into an email that goes out. Reference issue (THE approved template): lib/data/json/newsletter-issues/2026-06.json.
---

# Run the monthly newsletter loop

This skill walks Claude Code through one month's newsletter, from an empty
issue file created on your own machine to a send that a human runs, one batch at
a time, with the recipient list built from She Sharp's own database. Every issue
is a JSON file at `lib/data/json/newsletter-issues/<YYYY-MM>.json` with two
blocks (`lib/newsletter/schema.ts`):

- **`auto`** — machine snapshot of events + stats + the photo strip, written by
  `scripts/newsletter/new-issue.ts` and refreshed by the local photo pipeline.
  Never hand-edit it except the one documented exception (pruning `photoStrip`).
- **`editorial`** — human-owned copy (founder note, cover, photo of the month,
  subject/preview, CTA, sponsor thanks, pulse). It starts as an **empty stub**
  with placeholder text in every slot; a human writes the issue. Nothing in this
  repo generates it, and `new-issue.ts` refuses to overwrite a file that exists,
  so nothing can silently replace what you wrote.

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

**Starting an issue (Step 1) needs none of these** — `new-issue.ts` reads the
repo and nothing else. They are the prerequisites for the steps that follow.

1. Working directory is the repo root (contains `lib/newsletter/`).
2. ~~`OPENAI_API_KEY`~~ — **not needed anywhere in this loop.** The line is kept,
   struck through and still numbered, because deleting it would only invite the
   next reader to reinstate it. The Pulse in Step 4a is written by *you*, the AI
   agent running this skill, against a candidate file the repo fetches itself;
   the model call that used to sit there went with the cloud draft. Somebody who
   has just cloned the repo can produce a month's Pulse with nothing else. If
   something tells you an OpenAI key is required here, it is this line's older
   self.
3. `RESEND_API_KEY` — for test sends, and for the `resend` CLI that a human uses
   to send the batches in Step 8e.
4. `BLOB_READ_WRITE_TOKEN` — for the photo step (read from env or `.env.local`).
5. `ffmpeg` + `ffprobe` on PATH — the photo pipeline transcodes with them.
6. `POSTGRES_URL` — the recipient list is read from this project's own database
   (the `newsletter_subscribers` table), not from Resend.

   **Read this before you plan a send.** That table holds the Mailchimp list,
   imported on 2026-08-29 — **1,549 mailable as at 2026-08-30**, and it moves;
   `npx tsx scripts/email/suppression.ts reconcile` prints the live figure on
   its **`Mailable after suppression`** line. Read that one, not the
   `Subscribed rows` line above it: the second is the table's own count and the
   first is what a send actually reaches. So a batch built today would reach
   real people. But **nothing has ever been sent from it**, and the live
   newsletter still goes out from **Mailchimp** — the cutover has not happened.

   So if someone asks you to "send this month's newsletter" through this skill,
   the answer is not "yes" and not "no" — it is the **three-stage approval
   chain** below, in order. Each stage is recorded in the issue ledger, and the
   batch build in Step 8d is gated on all three being on the record:

   1. **Your own test mailbox** (Step 6). Whoever is running this skill names
      their own inbox. Not the founder's, not a colleague's, and — unless you
      are the developer — not `chanmeng6666@gmail.com`, which this file used to
      hardcode as "the single approved test mailbox". One person, proving the
      render.
   2. **The review round** (Step 6b). The founder together with the **newsletter
      team**, one email each — marketing and events are on the roster but not on
      the default round. This is **how the founder sees the issue**, so it comes
      *before* her approval, not after it.
   3. **The founder's approval** (Step 8b), with the evidence for it — a Slack
      permalink, her email, or plainly "said so on the call". **Only this gates
      the broadcast.** The first send from this list is the organisation's
      cutover, not a technical step.

   Then, and separately, **each ramp slice is approved on its own**:
   `recipients-from-db.ts --restrict-to-hashes` for the warm cohort, or
   `--limit` for a plain first-N slice — never the whole list at once.

   The reason all of this exists is the account-wide complaint ceiling —
   **0.08%, about 1.25 complaints on a full send** — and the consequence of
   breaching it, which is that password resets and donation receipts stop with
   the newsletter. Account detail: `docs/deployment/EMAIL_AUTHENTICATION.md`.
   The same ceiling is why there is a **frequency cap**: three marketing sends
   per calendar month across `/monthly-newsletter`, `/email-the-community` and
   `/promote-event`, counted for you by the ledger, because until 2026-08-30
   none of those three skills could see what the other two had sent.
7. `EMAIL_UNSUBSCRIBE_SECRET` — signs each recipient's personal unsubscribe
   link. The batch build in Step 8d **hard-fails without it**; there is no
   fallback and no way to skip it. It lives on Vercel production and is **not**
   in the local `.env`, so pull it rather than invent one —
   `vercel env pull .env.production.local --environment production --yes` — and
   read the value out of that file. It is not marked Sensitive, so the pull
   returns the real 66-character value rather than the `""` a Sensitive variable
   comes back as (CLAUDE.md, "Vercel environment variables"); if you ever see an
   empty string here, that is the trap, not the value. A batch built with a
   different secret still
   builds: it signs links that then fail to verify, so every recipient's
   one-click unsubscribe is broken, on the one send where that matters most.
8. For approve: production `BASE_URL` + `CRON_SECRET`.

---

## Step 1 — Create the issue file, locally

The issue id is the **current NZ month** as `YYYY-MM` (e.g. `2026-08`). One
command creates it:

```powershell
npx tsx scripts/newsletter/new-issue.ts 2026-08
```

That writes `lib/data/json/newsletter-issues/2026-08.json` with:

- the **`auto`** block — this month's events and stats, snapshotted from
  `lib/data/*` by `assembleAutoData()`;
- an **empty `editorial`** block — the valid *shape* of the human copy, with
  generic placeholder text in every slot and an evergreen pulse. It is a form to
  fill in, not a draft to edit.

**No API key. No `CRON_SECRET`. No network call.** Everything comes out of the
repo, so a fresh clone can start a month's newsletter.

**It refuses to overwrite an existing issue.** If the file is already there, that
is a month somebody has been editing — do not reach for `--force` to get past the
message. `--force` exists only for a deliberate "start this month over", and it
destroys the founder note.

> **There is no AI draft any more, and this is the point of the change.** The
> newsletter used to be generated by a Vercel cron and pulled down from Redis;
> its copy was rewritten by hand every single month, so the machine was paying
> for an OpenAI call to produce something always discarded. Steps 3–4 are not
> polish on a draft — they are where the issue gets written. Budget for that.
>
> The one machine-written part that remains is the **pulse** section, which is
> refreshed by its own script in Step 4a. The stub's pulse is an evergreen
> fallback; Step 4a replaces it.

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
+ `auto.photoAlbumUrl`, which `new-issue.ts` leaves empty.

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
  **from a different event where the month has more than one**, with an `alt`
  and an optional `eventSlug`. Move its Blob URL into `photoOfTheMonth.src` and
  delete it from the strip.
- **Strip** (`auto.photoStrip`) — the varied remaining shots. **Caps at 13**, and
  an ODD count is what you want: the first photo runs full width and the rest
  pair into rows of two, so `1 + 2n` fills every row and an even count leaves a
  gap in the last one. Write an `alt` for each — see the caption rule below.

**No photograph carries a caption, and `alt` is not a caption.** The template
printed a line of text under every photo until 2026-08-31. Those lines were
written *about* frames rather than read *off* them, so they asserted things the
photograph did not show, and the founder's instruction was to drop the lot: the
photograph alone is the honest version. `PhotoStrip` and the photo-of-the-month
block now render the image and nothing else, and `render.test.ts` fails if a
caption comes back.

`alt` survives, because a screen reader still needs something — and it is held
to the same standard, since a described-from-memory `alt` is a fabrication read
aloud to the one reader who cannot check it. **Write the event's own title,
verbatim from `auto.recapEvents[].title`, and nothing else.** Do not describe
the frame, name a person, or add a venue the photo may not show. Repeating one
title across thirteen strip photos is correct when the month was one event;
`photos.ts` already writes exactly this.

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
- Placeholder strip entries carry **no `eventSlug`**, and their `alt` says they
  are placeholders. A placeholder is a generated purple card, not a photograph
  of a room, so it must never be tied to a real event.
- Never ship placeholders to the real send if real photos exist. Swap first.
- Once real photos land, prefer re-running the normal Step 3 path (add the
  event's `galleryUrl` and let `photos.ts` harvest) over hand-uploading.

## Step 4 — Write the `editorial` block (this is the newsletter)

The stub is placeholder text in the right shape — every field below has to be
written, not adjusted. Match the tone and structure of the reference issue
(`2026-06.json`). **Required:**

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
- **`pulse`** — **see Step 4a**, which is where this section is actually done.
  It used to say "sanity-check only", and that was how a section built for three
  items shipped with one for three issues running. Numbers are copied verbatim
  from fetched sources by the pipeline and every URL is one it retrieved — what
  the pipeline cannot judge is whether an item is worth a reader's attention,
  and that judgement is the step.

**Optional:** `eventBlurbs` (per-slug one-liners), `opportunities` (mentor /
volunteer / donate — keep the three canonical hrefs), `sponsorThanks` (name ONLY
partners/venues present in the event data, or `null` to omit).

- **`headline`** — promote ONE upcoming event to a marquee block under the founder
  note. Use it when a month has a single obvious must-attend event; leave it `null`
  when the month is evenly weighted. `eventSlug` must match an entry in
  `auto.upcomingEvents` — every hard fact is read from there, so only the framing
  copy (`eyebrow`, `dateBadge`, `blurb`, CTA) lives in `editorial`. The promoted
  event is removed from "What's next" and its CTA replaces the one at the bottom.
- **`pulse.newsBites`** — up to 3 source-attributed NZ items. The generator now
  produces this list and leaves the legacy `newsBite` null. Curating it is
  **Step 4a**, which carries the fill rates, the editorial bar and the checks.

**From the September 2026 issue on — REQUIRES PR #238, NOT YET MERGED:**

- **`editorial.askToReconfirm`** — set it to `true` from `2026-09` onward. It
  defaults to `false` and is decided per issue, so nothing sets it for you; the
  August issue ships without it. **This field does not exist on `main` today** —
  if the schema rejects it, PR #238 (`feat/newsletter-reconfirm`) has not landed
  yet, and the correct action is to leave it out, not to add it to the schema.
  It exists because 1,168 of the 1,549 subscribers have weak or unknown consent
  evidence (752 bought a ticket and never ticked anything; 416 have unrecoverable
  provenance), after the Humanitix→Mailchimp "sync contacts who haven't opted in"
  option was left on until 2026-08-27. The ask lets those people refresh their
  own consent over the coming issues — it is **not** an ultimatum, and nobody is
  dropped for ignoring it.

Never re-add a spotlight / featured-mentee section — it was removed. Only feature
a person when you can verify a real photo + source (there is no schema slot for it
today, so in practice: don't).

Do not touch the rest of the `auto` block by hand — it is the machine snapshot.

## Step 4a — The NZ Tech Pulse (the industry-news section)

This has its own step because for three issues it did not get one. The schema,
the renderer and this document were all built for a three-item news list; the
generator produced one. So the best Pulse the newsletter has had — July 2026's
three items — was **typed into the fixture by hand**, which is why it never
happened again. Read that as the warning it is: a section nobody has a procedure
for is a section that is excellent once and thin afterwards.

**You write this section.** Not a model in the cloud, not an OpenAI key — you,
the AI agent running this skill, whichever tool you are: Claude Code, Cursor,
Codex. There is no API key anywhere in this step, and a developer who has just
cloned the repo can produce a month's Pulse with nothing else.

What has *not* moved is every check. The code still fetches the sources, still
ranks them, and still verifies your words against them — a URL you did not get
from the candidate file is refused, a number that is not verbatim in its own
source is refused, and a headline that breaks house style is refused. That is
the deal: you get the writing, the repo keeps the truth.

### The loop, in three commands

```powershell
npx tsx scripts/newsletter/pulse-candidates.ts 2026-08     # 1. code fetches
#                                                            2. YOU write the draft
npx tsx scripts/newsletter/pulse-apply.ts 2026-08          # 3. code validates (dry run)
npx tsx scripts/newsletter/pulse-apply.ts 2026-08 --apply  #    then writes
```

**Step 1 — fetch the candidates.** `pulse-candidates.ts` reads the SEEK NZ
employment report, six RSS feeds and the HRD New Zealand article sitemap, and
writes `tmp/newsletter/pulse-candidates-2026-08.json`. It prints the list to the
terminal too, in mission order, so you can see what the month has. `tmp/` is
gitignored; the file is regenerable and is never a source of truth.

**Do not go and search the web for stories instead.** Not as a supplement,
not "just to check". Three reasons, and the third is the one that bites: agents
differ in whether they even have web search, so the section would change with
whoever ran it; the retention windows, the `?paged=N` depths, the hcamag sitemap
quirks and the deliberate exclusions are all encoded in `lib/newsletter/pulse.ts`
and would be rediscovered badly every month; and `pulse-apply.ts` checks your
draft against **the candidate file**, so a URL from anywhere else is refused
however real the story is.

**Step 2 — you write the draft.** Open the candidate file. It carries, for every
candidate, the URL, the publisher, the publication date and age, the relevance
tier in words, the publisher's own headline, a teaser, and `text` — the retrieved
article text. `text` is load-bearing: it is the *same string* the number guard
checks you against, so **a number you can see in it is a number you may use, and
a number that is not in it is one you may not.** There is no third case.

The file also carries `editorialBrief` and `houseStyle`, copied verbatim out of
the code that enforces them. Read those two fields; they are the rules, and they
cannot drift from the checker because they are the checker's own strings.

**Step 3 — apply.** `pulse-apply.ts` re-runs every guard on what you wrote and,
only if all of them pass, writes `editorial.pulse` into the issue fixture and
nothing else. Dry run by default. `--apply` must be spelled out.

### What you write, exactly

Write this file to `tmp/newsletter/pulse-draft-<issue>.json` (the candidate
file's `writeDraftTo` names the exact path). Three fields per item, no more:
`sourceLabel`, the dateline and the ordering are attached by the code from the
candidate, so that a story can never be credited to a publication that did not
run it. Since 2026-08-31 the email does not *print* `sourceLabel` — every source
link reads "Source", "(Source)" or the item's own dateline — but the field stays
in the data and stays accurate: it is the provenance record `check-facts.ts`,
`lint-pulse.ts` and `pulse-copy.ts` read, and the link still points at the
source. Do not delete it, and do not put a publication's name back in the copy.

```json
{
  "heroStat": {
    "value": "9.9%",
    "label": "more NZ tech job ads than a year ago",
    "context": "Tech job ads rose 9.9% on a year ago, while ads nationally rose just 0.2%."
  },
  "newsBites": [
    {
      "title": "Know a Year 9 girl? August is when to nudge her",
      "summary": "TechWomen NZ's ShadowTech26 places 1,500 secondary school girls in tech workplaces this August, for Years 9 to 11. If you know one, this is the month to tell her about it.",
      "url": "https://techwomen.nz/shadowtech26/"
    },
    {
      "title": "The gender pay gap did not move this year",
      "summary": "Stats NZ put the gap at 5.3% for the June 2026 quarter, unchanged on last year. If you are heading into a pay review, that is the number the conversation starts from.",
      "url": "https://www.hcamag.com/nz/specialisation/diversity-inclusion/new-zealands-gender-pay-gap-sitting-at-53/587457"
    },
    {
      "title": "If you shelved a job search, take it back off the shelf",
      "summary": "Tech job ads rose 9.9% on a year ago and Auckland is up 5.0%, while ads nationally rose just 0.2%.",
      "url": "https://www.seek.co.nz/about/news/article/seek-nz-employment-report-june26"
    }
  ]
}
```

Every `url` above is copied character-for-character from a candidate. Every
number is verbatim in that candidate's own `text`.

- **`heroStat` may be `null`**, and sometimes must be. It has to come from the
  SEEK report; if no report was fetched this month, write `null` and the code
  rotates a sourced evergreen fact in its place. Writing a hero stat with no
  report to check it against is refused, and rightly.
- **`heroStat.value` is checked as a literal substring** of the report, `%` sign
  included — stricter than the rule for prose, because it is the one number the
  section leads with.
- **`newsBites` may have fewer than three items, or none.** See the fill rates
  below before you decide that is a problem.
- **The SEEK report is also eligible as one news item**, using its own URL. It is
  the only NZ job-market *data* source here. Two rules, both enforced: at most
  **one** item from it, and it must not be built on the figure the hero stat
  already uses.
- **Prefer one item per publisher — but do not drop a good story for it.** Two
  from one publisher is reported as a `look at`, never refused. See the fill
  rates below for why some months it is simply the right answer.

### When apply refuses

It will print `REFUSED — nothing was written`, name every rule you broke, and
exit non-zero. **That is the guard working, not a bug and not something to route
around.**

The fix is always to correct the copy in your draft and run it again. It is
never to edit a guard, relax a rule, add a flag, hand-write the number straight
into the issue JSON, or "just apply it anyway". `docs/development/CONTENT_RULES.md`
exists because numbers reached the public that nobody could source, and this is
the section where that is easiest to do by accident.

Dropping an item you cannot source is always allowed and is often the right fix.

| What it says | What you did | What to do |
|---|---|---|
| `is not a URL in the candidate file` | cited something you found elsewhere, or retyped a URL | copy the `url` field from a candidate, exactly |
| `numbers not present verbatim in that candidate's own text` | rounded, recomputed, or used a real number from a *different* story | copy the figure character-for-character from that item's own `text`, or drop the number |
| `heroStat.value … does not appear verbatim` | the hero number is not a literal substring of the report | copy it including the `%`, or write `heroStat: null` |
| `repeats the hero stat figure` | the SEEK bite is built on the number the hero already leads with | pick a different figure from the report, or drop the SEEK bite |
| `the same article twice` | two bites share a URL | keep the better one |
| `[MUST FIX] Headline is the publisher's, not ours` | you copied or lightly reworded their title | read the candidate's `text` and say what it means for a woman in tech in NZ; a headline does not need a number |
| any other `[MUST FIX]` | a house-style rule | the report prints the one instruction for each |

A `note:` line is not a refusal — it tells you the code deleted a closing
sentence that added no fact. Check that you are happy with what is left.

### What the sources can honestly supply

Do not skip this. It is the difference between a section that is short some
months and a section padded with filler.

| Slot | Where it comes from | How often it fills |
|---|---|---|
| **Hero statistic** | SEEK NZ Employment Report, monthly | Every month |
| **Job-market / hiring story** | HRD New Zealand | Every month |
| **Women's story** | TechWomen NZ, else HRD's women-and-work coverage | Effectively every month |
| — of which *specifically* women **in tech** | TechWomen NZ alone (1.19 posts/month) | **~92%** of months at a 90-day window; ~62% at 35 days |
| **Industry story** | Tech New Zealand, AI Forum, The Conversation NZ | Most months |

**So: three items is normal, and the third is a women's-news item that is only
sometimes specifically about women in tech.** That is what the measured rates
support. The flattering version — "a fresh women-in-tech story every month" — is
false at 62%, and writing it here would make an operator go looking for
something to fill the gap.

**Two of the three items coming from HRD New Zealand is expected in some
months, and is not an error.** Read the table again: HRD fills the job-market
slot every month *and* is the second source of women's stories, so a month where
its best women's story and its best job-market story are the two strongest
things available is a predicted outcome, not a mistake. `lint-pulse.ts` and
`pulse-apply.ts` both flag it as a `look at` so you notice it; neither refuses
it. Do not go hunting for a third publisher that did not publish anything worth
a reader's minute.

**Two items is a correct outcome.** 宁缺毋滥. One strong local story beats three
where two are vendor press releases, and the reader cannot tell you padded but
they can tell it was dull.

**A fresh women-in-tech *statistic* is roughly twice a year**, not monthly — the
Stats NZ gender pay gap each August, and Digital Skills Aotearoa every two to
three years (next expected ~2029). No NZ publisher produces women-in-tech data
more often; this was checked, not assumed. The hero stat rotates the evergreen
pool for exactly this reason. **Treat a fresh statistic as a windfall, never as
a slot to fill.**

### What a good item looks like

A subscriber is a woman in, or entering, tech in New Zealand — often a student
or a career-changer. Judge every item by whether it changes what she does this
month.

- **Good:** "Tech job ads are up 9.9% on a year ago and Auckland is up 5.0%,
  while ads nationally rose just 0.2%." She can act on that.
- **Good:** a pay-gap or pay-equity story with a number and a source.
- **Bad:** any sentence of the form "*Vendor* launches *product* for
  *enterprise*". The feeds are full of these; they are trade press, not news for
  her.
- **Bad:** international infrastructure announcements with no NZ hook.

### The house style, in full

This is what `lib/newsletter/pulse-copy.ts` checks, what the candidate file
hands you, and what you should hold your own hand-written headlines to. Stated
here so an agent reading this skill in Cursor is aiming at the same target as
one reading it in Claude Code.

- **The headline is ours, never the publisher's.** Do not copy, trim, or lightly
  reword the article's own title. If every meaningful word of your headline
  already appears in the source's headline, you have not written one.
- **Sentence case.** First word and proper nouns; nothing else.
- **At most 14 words**, aim for about ten.
- **No quotation marks carried over** from the source's headline.
- **The subject is what changed for the reader**, not the company or the report
  that announced it. No `, according to X` or `, the report shows` tail — the
  source is already printed beside the item.
- **Summary: two sentences, about 35 words.** The fact, then what it means for a
  woman working in or entering tech in New Zealand. A third sentence is allowed
  and only earns its place when it is that second half. No sentence that adds no
  fact ("This initiative aims to…", "This highlights ongoing disparities…").
- **No trade-press words anywhere**: unveils, launches, solutions, leverages,
  empowers, "is set to", cutting-edge, seamless, world-class, game-changer.
- **Across the three:** do not let all of them open with a number, and prefer
  one item per publisher.

**Worked example** — the left-hand side is real August 2026 generator output:

| | |
|---|---|
| Source article title | ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa |
| **Bad** | *ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa* — the publisher's headline, copied |
| **Bad** | *ShadowTech26 Opens Doors for 1,500 Girls* — Title Case, and still only the source's headline with words removed |
| **Good** | *Know a Year 9 girl? August is when to nudge her* |
| Good summary | TechWomen NZ's ShadowTech26 places 1,500 secondary school girls in tech workplaces this August, for Years 9 to 11. If you know one, this is the month to tell her about it. |

The good version **invents nothing** — every number and every fact is still the
source's, copied verbatim. Only whose voice it is in has changed. That order of
priority is absolute: if re-angling a headline would need a number the source
does not have, **the original wording wins and the item stays**. Style never
buys a relaxation of the verbatim-number rule.

### Checking it, in this order

0. **Run the checker.** `pulse-apply.ts` has already run it once on your draft —
   but the Pulse is then CURATED BY HAND, and a headline *you* rewrote in the
   fixture a minute ago breaks the house style exactly as easily as a generated
   one. Nothing checks the file after that edit except this.

   ```powershell
   npx tsx scripts/newsletter/lint-pulse.ts 2026-08
   ```

   Every violation comes with the offending text and one instruction. `MUST FIX`
   exits non-zero; `look at` is an advisory you may overrule with a reason. It
   reads the file on disk, so run it again after every edit. One rule — "is this
   the publisher's own headline?" — is checked against the article's URL slug
   here rather than against the fetched headline `pulse-apply.ts` had, and the
   report says which items it could not check that way.

1. **Every `sourceUrl` and every item `url` opens**, and the page says what the
   item says it says. The pipeline guarantees the URL was fetched and that every
   number appears verbatim in the source — it cannot guarantee the framing is
   fair.
2. **No item duplicates another.** Tech New Zealand cross-posts TechWomen
   articles at a different URL with an identical title; dedup is by normalised
   title for that reason, but check with your eyes too.
3. **Read the three aloud as a set.** Three AI stories is not a Pulse, it is a
   theme.

### Removing an item

Delete it from `newsBites` in the draft and run apply again — that keeps the
guards in the loop. If you are editing the issue fixture directly instead,
delete it from `newsBites` there and re-run `lint-pulse.ts`. Do not replace it
with something you found yourself unless you can meet the same standard: a real
NZ-relevant source, a URL that opens, and every number verbatim in that source.
**Never hand-write a number into this section.**
`docs/development/CONTENT_RULES.md` exists because numbers were published that
nobody could source, and this is the section where that is easiest to do by
accident.

### Check the evergreen pool before you send

```powershell
npx tsx scripts/newsletter/check-facts.ts          # add --json for the machine-readable form
```

The pool in `lib/data/nz-tech-facts.ts` is the fallback the hero stat and the
"did you know" line come from whenever the live fetch is thin — so it reaches
readers most months, and nothing used to notice when one of its facts went bad.
One did: the gender pay gap read "5.2% … the lowest on record" for a year after
Stats NZ published a higher figure, and it was found by accident. Every fact now
records `verifiedAt` (when a human last read the source) and `refresh` (how often
that source publishes a new figure), and this script reports which are due.

Read its four outcomes as four different things:

- **FAIL** — the source URL is gone, or the page contradicts a number in the
  fact. Unciteable; fix it before the issue ships. This is the only outcome that
  exits non-zero.
- **REVIEW DUE** — the cadence says a newer figure exists. Open the source, read
  it, and update the fact **and** its `verifiedAt` by hand. The script never
  edits a fact: a machine deciding what the new number is would be worse than
  the stale one.
- **COULD NOT BE CHECKED** — not a failure and not a pass. See the bot walls
  below.
- **OK** — nothing contradicts the fact today. Note that the number match is a
  substring, so a pass is weaker evidence than it looks.

**Never hand-write a new number into that file.** It goes to the whole
subscriber list with a source attached, which is the strongest claim the
newsletter makes.

### Known limitations, so you do not chase them

- The evergreen fact "women hold around 29% of professional IT roles in NZ" has
  **no refresh path** — no NZ publisher updates it. It is sourced and
  attributed, and it will not change. Do not go looking for this year's figure.
  It is recorded as `refresh: "none"` and `check-facts.ts` will never call it
  overdue, which is the point: a flag nobody can clear is a flag everybody
  learns to skip. Its URL and its numbers are still checked on every run.
- **Four facts report COULD NOT BE CHECKED on every run, and that is the correct
  answer, not a bug to fix.** Stats NZ answers 200 with 115 KB of HTML that
  renders zero visible characters (the release is filled in client-side); MBIE
  answers 200 with an 851-byte Imperva/Incapsula challenge, even for the `.pdf`
  URL; Te Ara serves a 403 to both facts that cite it. A page that returns 200
  and no readable text has confirmed nothing — which is a different result from
  failing, and the script keeps them apart on purpose.
- **`she-sharp-growth` currently FAILS**, and it is a citation problem rather
  than a wrong number: the fact quotes the members / sponsors / events counts
  from `globalStats` and cites `/about`, but `/about` prints only the members
  figure in prose. The event count is on the home page. Fixing it means a human
  deciding whether to re-point the source or to show the counts on `/about`.
- RNZ publishes exactly the right stories and is **deliberately not a source**:
  its `robots.txt` names `anthropic-ai` and `ChatGPT-User` and disallows them.
  The generic rule permits a plain fetch, but this pipeline summarises with an
  LLM, which is the use RNZ refused. Do not add it back.
- Stats NZ, MBIE and Education Counts cannot be fetched at all — a JS-only app,
  a bot wall that returns HTTP 200 with a challenge page, and a Cloudflare 403
  respectively. Their numbers reach us through the evergreen pool by hand.
- **A source that answers slowly or not at all costs you its items and nothing
  else.** Each leg is fetched independently and swallowed on failure, so
  `SEEK report: NOT FOUND` or a short candidate list is a thin month, not a
  broken script. Re-run it; if it is still thin, write the shorter section.

### If you want to see what a run will read first

```powershell
npx tsx scripts/newsletter/lint-pulse.ts --preflight
```

Thirty seconds, and it lists every feed that will be read and where the writing
and the checking each happen. It is also printed at the top of every
`pulse-candidates.ts` run, so you get it either way.

## Step 5 — Preview loop

```powershell
npx tsx scripts/newsletter/preview.ts lib/data/json/newsletter-issues/2026-08.json --open
```

Writes `tmp/emails/newsletter-2026-08.<mode>.html`. Check:
- Both `broadcast` and `preview` modes render without error.
- Each rendered size is **< 100 KB** (renderer throws above; Gmail clips larger).
- Light **and** dark inbox appearance; all images load (URLs absolute); no photo
  repeats across cover / POM / strip / recap thumbnails.

## Step 6 — Stage 1: test send, to YOUR OWN mailbox

**Ask the person running this skill for their own address, and send only there.**
One mailbox, theirs.

Until 2026-08-30 this step hardcoded `chanmeng6666@gmail.com` and called it "the
single approved test mailbox". That is the *developer's* personal inbox, and
this skill is run by the newsletter department — so the instruction sent a
newsletter person's proof copy to somebody else, and gave them no way to see
their own render. If you *are* the developer, that address is still the right
one. If you are not, it is the wrong one.

```powershell
$env:RESEND_API_KEY="re_…"
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json you@example.com
```

This uses the transactional `sendEmail` helper with a `[TEST]` subject prefix — it
does NOT touch the subscriber list and does NOT send a batch. Inspect in Gmail (web + mobile)
and Outlook: layout, images, links, preheader.

Then put it on the record. **No address is stored** — the ledger keeps a count
and a truncated hash, because `state/issues.json` is committed:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-test `
  --issue 2026-08 --to "you@example.com"
```

Iterate Steps 3–6 until it matches the June bar — **email UI quality is the
pilot's acceptance bar.** Re-recording stage 1 after a fix is fine; it
overwrites, keeping the latest.

### Step 6b — Stage 2: the review round (the founder AND the newsletter team)

**This is not optional, and it is not gated on the founder's approval.** It is
*how she sees the issue.* The old version of this step required "the founder has
explicitly approved widening" before the round could go out, which asked her to
approve an issue nobody had shown her. Her approval is stage 3, and it comes
after this.

**Who is on it, by default: 4 people at 5 addresses** — the founder (Mahsa
McCauley, who holds two mailboxes, one organisational and one academic) plus the
three on the newsletter team (Lesley Gao, Tharaneetharan Thavarasan, Chan Meng).
Marketing and events (Marriane Bentigan, Len Estioko, Sara Ghafoor, Nikita
Kumari) are on the roster with their roles recorded but are **not** on the
default round — `--reviewers` adds anyone for one issue.

**The `role` field records which loop a person runs, not their job title, and it
deliberately disagrees with `lib/data/team.ts`.** Lesley and Chan are
Website/Product roles on the team page; Tharaneetharan is an Events Coordinator
there, and his own bio says he contributes to monthly newsletter preparation.
All three are `newsletter` here. **Do not "fix" the roster against the team
page** — that would silently drop three of the four reviewers. `team.ts` is the
authority on spelling (a test enforces it) and on public titles; the roster is
the authority on who reviews what.

**Chan Meng usually runs this skill and is also a reviewer.** So the same person
can be your stage-1 test mailbox and a stage-2 recipient. That is fine and
nothing collapses the two: stage 1 asks "does the render survive my inbox",
stage 2 asks "does the team endorse this issue". Record both.

Resolve the round first. This prints the addresses and the commands that follow:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts --issue 2026-08
```

**The roster is deliberately in two halves.** The reviewers' **names and roles**
are committed in `lib/email/newsletter-reviewers.ts`, so a diff shows who is on
the round. Their **addresses are not** — they live in
`.claude/skills/monthly-newsletter/state/reviewers.local.json`, which is
gitignored (`**/*.local.json`). Most reviewers hold personal off-domain
mailboxes, and an address in git is permanent: a volunteer who leaves stays in
the history. The founder holds **two** addresses, one organisational and one
academic, and the round goes to both — she is one person with two mailboxes, not
two reviewers.

**First run on a machine:** copy the example beside it and fill it in.

```powershell
Copy-Item .claude/skills/monthly-newsletter/state/reviewers.local.example.json `
          .claude/skills/monthly-newsletter/state/reviewers.local.json
```

Never commit that file, and never paste its contents into a PR, a commit message
or a Slack thread.

**If the script refuses, read what it says — it will not send a partial round.**
Four refusals, all of them deliberate:

- *"No reviewer address file at …"* → the local file has not been created on
  this machine. Copy the example.
- *"The only person on the review round is … the founder"* → the round has
  collapsed to one person, which is not a joint review: it shows the issue to
  nobody but the person whose approval is the next stage. Since the roster names
  four, this now means the other three are unaddressed in your local file. Add
  them.
- *"These reviewers are on the committed roster but have no address"* → the
  local file has fallen behind the roster, and it **names the people**. Add
  them. This is the failure the whole split exists to catch: a round that
  quietly leaves somebody out looks exactly like one that reached everybody,
  and the person most likely to be missing from a stale local file is the
  founder — whose approval is the very next stage.
- *"… is marked `expected: "missing"` in own-mailboxes.ts"* → an
  `@shesharp.org.nz` address that the 2026-08-23 delivery probe could not reach.
  Sending *as* a non-existent address works fine, so a dead on-domain reviewer
  is invisible from the sender's side; seven addresses this project published
  for a year had never been created. **That check applies to on-domain
  addresses only** — `OWN_MAILBOXES` is a register of She Sharp's own mailboxes,
  so a Gmail's absence from it proves nothing, and a personal address is
  accepted without a lookup.

To add somebody for one issue only, name the round yourself. On-domain addresses
are still checked:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts --issue 2026-08 `
  --reviewers "someone@example.com,another@example.com"
```

If they belong on every issue, ask the maintainer to add their **name** to
`NEWSLETTER_REVIEWERS` and their address to everyone's local file.
`npx tsx lib/email/newsletter-reviewers.test.ts` covers both halves.

The protections on the send itself are unchanged:

- **Maximum 25 addresses** (`send-test.ts` hard-caps this; `review-round.ts`
  refuses at the same number before you get there).
- **One email per address.** The script loops rather than passing an array to
  `to:`, so reviewers never see each other's addresses.
- **Always `--dry-run` first** and read the parsed list back before the real send.
- Never the mailing list, and never anyone who merely attended an event.

```powershell
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json "<the list review-round.ts printed>" --dry-run
npx tsx scripts/newsletter/send-test.ts lib/data/json/newsletter-issues/2026-08.json "<the list review-round.ts printed>"
```

Record stage 2 — hashes and counts only, as before. `review-round.ts` prints
this command with `--people` already filled in:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-review `
  --issue 2026-08 --to "a@example.com,b@example.com" --people 2
```

`recipientCount` in the ledger counts **addresses**; `--people` records how many
**people** that was. They differ whenever the founder is on the round, and
recording only the first would make a two-person round read as three reviewers.

**Stage 3 cannot be recorded until this is on the record.** `record-approval`
refuses outright when stage 2 is missing, and `check` refuses an approval whose
timestamp lands before the review round it is supposed to follow — that
backwards order *is* the bug this chain replaces.

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
domain's health (8a), record the founder's approval and mark the issue approved
(8b), build the recipient list from the database (8c), build the batch files
behind the approval-chain gate (8d), send them (8e), and — only if a send is
interrupted — resume without double-mailing (8f).

**Nothing in 8a–8d sends any email.** The only step that puts mail in inboxes is
8e, and a **human** runs it.

Before starting, see where the issue stands:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts show --issue 2026-08
```

### Step 8a — Deliverability check (before approving)

The newsletter is the only recurring bulk send on this domain, so this monthly
loop is where the domain's health gets looked at. Six things, ~5 minutes:

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
4. **Pull Mailchimp's own unsubscribes.** `sync` above sees only the opt-outs
   that reached *our* infrastructure. Mailchimp is still the platform that
   actually sends the newsletter, so someone who unsubscribed from a real issue
   since the 2026-08-17 export exists **only** in Mailchimp's record, and this
   is the one command in the checklist that can see them. Dry run first:
   ```powershell
   npx tsx scripts/email/suppression.ts pull-mailchimp --dry-run
   npx tsx scripts/email/suppression.ts pull-mailchimp
   ```
   **It has already paid for itself once.** Run immediately before the
   2026-08-29 import, it moved the committed register 2,138 → **2,144** — and
   six of the fifteen rows that import then held back were those six people, who
   had left in the two days since the export was taken. Every file is a snapshot
   of an afternoon, and people leave after it. **Run it every month until the
   cutover is done, and if it adds anyone, say the number.** Needs
   `MAILCHIMP_API_KEY`. Mailing someone who has already opted out is a
   complaint, and the ceiling is account-wide.
5. **Reconcile the subscriber table against the registers.** This reports anyone
   who is marked subscribed *and* sits on a suppression register:
   ```powershell
   npx tsx scripts/email/suppression.ts reconcile
   ```
   Those people are stripped automatically in Step 8c, so a small number here is
   not an emergency. But a count that keeps growing month after month means some
   part of the site is not writing unsubscribes back to the subscriber table —
   **report the number to the user; don't just move on.**

   **Then commit the register, on its own.** Items 3 and 4 both write
   `lib/data/json/email-suppression-hashes.json`, which is committed — leave it
   dirty and the do-not-contact instruction exists only on this laptop, and the
   next send built from a clean checkout will not have it. If the diff is
   non-empty:
   ```powershell
   git add lib/data/json/email-suppression-hashes.json
   git commit -m "chore(email): sync the suppression register"
   ```
   Nothing else in that commit, and say the before-and-after count in the body if
   the numbers moved. The rule and the reasoning live in
   `/update-mailing-list` Step 8, "Commit a suppression change on its own"; this
   is the same rule, not a second one.
6. **Check for people who have JOINED since the last import.** Items 3-5 all run
   in one direction — they take people *off* the send. Nothing takes anyone on,
   and while Mailchimp is still the live sender, that is where new subscribers
   keep arriving. Measured on **2026-08-30**: Mailchimp's audience held **1,552**
   subscribed members against our **1,545** mailable rows — a strict subset, 7
   in Mailchimp and not in our table, 0 the other way, and all seven with a
   `last_changed` after the 2026-08-17 export (18, 19, 19, 20, 27, 28, 28 Aug).
   A send that night would have silently skipped seven people who had just asked
   to be on the list, and the gap widens every month Mailchimp keeps sending.
   **That measurement is a record, not the current gap.** Four rows were added
   from a Marketing API delta pull on 2026-08-30, which is why the table now
   reads 1,549 rather than 1,545. Run the check; do not remember it.

   The check is a **comparison, not a command**: the live audience's subscribed
   count against the count `recipients-from-db.ts` will actually mail (Step 8c
   prints it). **If Mailchimp is higher, those people are about to be skipped —
   say the number and stop.**

   **Detect and hand over. Do not run the import from here.** Adding anyone to
   `newsletter_subscribers` is `/update-mailing-list`'s job, needs its own plan
   and its own approval, and has a written procedure there — Step 6, "Closing
   the joiner gap", which owns the fresh-export import and the order it runs in
   (`pull-mailchimp`, **then** the import, **then** `reconcile`) and explains
   why it has to be the CSV export rather than an API delta. Do not restate that
   procedure here and do not improvise a shorter one; say the number, name the
   skill, and stop.

   Nothing about "do not re-run the importer" in `/update-mailing-list` forbids
   this. That prohibition is about the frozen 2026-08-17 export, which has
   already been imported. A **fresh** `subscribed` export is a different file and
   a sanctioned operation.

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

### Step 8b — Stage 3: record the founder's approval, then approve the issue

**Two different things, in this order.** The first is the organisational fact —
the founder said yes. The second is the server-side marker that makes the web
version and the send slot official.

First, only once she has actually said yes, and with what proves it:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-approval `
  --issue 2026-08 --by "Mahsa" `
  --evidence "https://shesharp.slack.com/archives/C0ABC/p1756512345"
```

`--evidence` is **mandatory and the command refuses without it.** An approval
with nothing behind it is somebody's recollection written into a file that will
outlive the conversation; a Slack permalink, the subject line of her email, or
plainly `"said so on the 10am call, 2026-08-30"` are all fine. What is not fine
is an empty string, and `check` treats blank evidence as no approval at all.

It also **refuses if stage 2 is not on the record** — she cannot have approved
an issue she was never sent.

Then the existing server-side approval, unchanged:

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
  Outside the warm cohort    …   (only with --restrict-to-hashes)
  WILL BE MAILED             …
```

**If "WILL BE MAILED" is 0, stop.** Since the 2026-08-29 import that is NOT the
expected result — the table holds the whole imported list, so a zero means
something is wrong (an empty query, a database pointing somewhere else, a
suppression register that has swallowed the list) and not that the list is
young. Find the cause; do not build a batch of nothing and describe it as a
send.

**If it is the whole list, that is also not a licence to send.** See
Prerequisite 6: the founder approves the issue, and each ramp slice is approved
on its own.

Three flags, all of which can only ever make the list **smaller** — none can
add anyone who is not already a confirmed, unsuppressed subscriber:

- `--only <address>` — narrow to one person. This is how you do a **real batch
  test**: the same machinery as the live send, aimed at a single confirmed
  mailbox. Use your own address if it is a confirmed subscriber; the one below
  is an example, not a default.
  ```powershell
  npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08 --only chanmeng6666@gmail.com
  ```
- `--restrict-to-hashes <path>` — keep only the people in a cohort file of
  `hashEmail()` digests, as `scripts/mailchimp/recent-openers.ts` writes. This
  ramps by **engagement**: the warmest readers first, which is what
  "Ramp, don't switch" in `docs/deployment/EMAIL_AUTHENTICATION.md` asks for.
  It is a send-order filter, not a consent source — being in the file cannot
  make anyone mailable who was not already.
  ```powershell
  npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08 `
    --restrict-to-hashes tmp/mailchimp/recent-openers.json
  ```
- `--limit <n>` — keep only the first N. This ramps by **row order**, which is
  not the same thing: mail a small slice, watch the bounce and complaint numbers
  for a day, then do the rest. Combine the two and `--limit` applies to the warm
  cohort, not to the whole list.
  ```powershell
  npx tsx scripts/email/recipients-from-db.ts --key newsletter-2026-08 --limit 50
  ```

**Whether to ramp, and how big the first slice is, is the founder's decision,
not yours.** Ask.

### Step 8d — Build the batch files (behind the approval-chain gate)

**Run it as one command with the gate in front.** The `&&` is the point: the
ledger's `check` exits non-zero when any stage of the chain is missing, so the
build cannot run on an issue nobody approved, and the step cannot be
half-performed by someone scrolling past a warning.

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts check --issue 2026-08 `
  && npx tsx scripts/newsletter/build-newsletter-batch.ts 2026-08 `
       --recipients tmp/emails/recipients-newsletter-2026-08.json
```

If `check` fails it prints exactly which stage is missing and the command that
records it. Do not work around it — go back and do the stage. The two refusals
worth naming in advance:

- *"FREQUENCY CAP: N marketing send(s) already on the record"* → three marketing
  emails have already gone to these inboxes this calendar month, counting
  `/email-the-community` and `/promote-event` as well as this skill. If sending
  anyway is genuinely the right call, it is a decision somebody makes on the
  record:
  ```powershell
  npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts check --issue 2026-08 `
    --override-frequency "why this fourth send is worth the complaint risk"
  ```
  The override is written into the ledger with the reason and the count it
  overrode, and it stays there. It applies to that month only.
- *"an approval dated BEFORE the review round"* → the record has the founder
  approving before she was shown the issue. Fix the record, or fix the order.

After each chunk goes out in 8e, record it, so an interrupted ramp is resumable
and the frequency count is accurate:

```powershell
npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-batch `
  --issue 2026-08 --chunk 1 --of 3 --recipients 100 --idempotency-key "…"
```

A ramp counts as **one** marketing send for the cap, not one per chunk — the cap
is about how often a person's inbox is touched, and a ramp touches each inbox
once.

The build itself is unchanged. It renders the issue once, then for each recipient substitutes their own
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
- **Keep the `Start-Sleep` lines.** Resend allows **10 requests a second per
  team** — the same on every plan, and this rule said 2 until 2026-08-30 — so
  the printed 600ms pause is a margin rather than the limit. Keep it: the budget
  is shared with the live site's transactional mail, and it costs ten seconds
  across sixteen chunks. Don't paste all the commands as one block without them.
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
   different event where the month has one, `alt` = that event's title; strip =
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
   an item from `pulse.newsBites` when it is not genuinely relevant or local. A
   two-item Pulse is a correct Pulse — see Step 4a for what the sources can
   honestly supply in a given month.
6. **Sections auto-hide when empty** (cover / strip / POM / headline / news /
   sponsors). An issue with no photos is VALID — never pad with filler. The ONE
   exception is the documented placeholder path (Step 3b), for an event whose real
   photos are still coming; placeholders must be visibly labelled as such and must
   be swapped before the real send.
7. **Voice.** Warm in-person Auckland community voice, NZ spelling, real venue
   names, one concrete in-the-room detail in the founder note. Subject ≤50
   (≤1 emoji); preview ≤120 (complements, not repeats); ONE primary CTA. The
   stub is a form, not a draft — write to the `2026-06.json` bar.

Also non-negotiable:
- **Never re-run `new-issue.ts --force` over a written issue.** It rewrites the
  whole file, founder note included. Without `--force` the script refuses, which
  is the guard — do not reach past it to get rid of an error message.
- **All image URLs absolute** (`https://…`). Email clients don't resolve
  site-relative paths.
- **The three-stage approval chain is not skippable, and it runs in this order:**
  (1) a test send to the caller's OWN mailbox, (2) the review round to the
  founder **and the newsletter team** — which is how she sees the issue — and
  (3) her approval, with evidence, which is the only thing that gates the
  broadcast. Each stage is recorded with
  `.claude/skills/monthly-newsletter/scripts/issue-ledger.ts`, and Step 8d's
  build is gated on `issue-ledger.ts check` exiting 0. Never widen the round
  beyond the roster plus an explicit `--reviewers` (max 25), and never widen on
  your own initiative.
- **Reviewer names are committed; reviewer addresses are not.**
  `lib/email/newsletter-reviewers.ts` holds the people and roles;
  `state/reviewers.local.json` holds the addresses and is gitignored. If a
  person on the roster has no address there, `review-round.ts` **names them and
  refuses** — never send the round to whoever it could resolve, and never
  "fix" it by dropping somebody from the roster to make the error go away.
- **Three marketing sends per calendar month, across skills.** `/monthly-newsletter`,
  `/email-the-community` and `/promote-event` reach the same people; the ledger
  counts all three. A fourth needs `--override-frequency "<reason>"`, which is
  recorded and stays recorded.
- **A real batch is only ever built from `recipients-from-db.ts` output.** Never
  hand-write a recipients file, never paste addresses into one, never add
  someone to a list the script produced. If a person needs to receive the
  newsletter, they belong in `newsletter_subscribers` — that is the whole point
  of the table. The `--only`, `--limit` and `--restrict-to-hashes` flags exist
  because every one of them can only narrow the list; nothing in this loop may
  widen it.
- **Approve reads the deployed bundle, not Redis** — always commit + deploy
  (Step 7) before approving (Step 8b).
- **The assistant does not send the batches.** Steps 8c and 8d are safe to run;
  the `resend emails batch` commands in 8e are handed to a human.
- **Never write an email address into `state/issues.json`.** It is committed.
  The ledger stores counts and truncated hashes, and the recording commands do
  the hashing for you — pass real addresses on the command line, never edit the
  file by hand. The one file in this skill that holds real addresses is
  `state/reviewers.local.json`, which is gitignored; keep it that way and keep
  its contents out of PRs, commit messages and Slack.
- **Listed, but not indexed.** Every issue gets an archive card (Step 7b); the
  web version keeps `noindex` and stays out of `app/sitemap.ts`.

## Flexible sections — decision table

| Section | Field | Shows when | Source |
|---|---|---|---|
| Cover | `editorial.heroImageUrl` | a strong landscape shot exists | best photo, promoted out of the strip (Blob JPEG) |
| Founder note | `editorial.founderNote` | always | hand-written; fixed signature + photoUrl |
| Headline event | `editorial.headline` | ONE upcoming event deserves top billing | human curation; facts read from the matching `auto.upcomingEvents` entry |
| Photo strip | `auto.photoStrip` | ≥1 real event photo | `photos.ts` upload, then human-pruned to an odd count ≤13 |
| Photo of the month | `editorial.photoOfTheMonth` | a second good shot exists | second-best photo (different event); no caption, `alt` = the event title |
| Last-month recap | recap cards | recap events exist OR POM set | `auto.recapEvents` + `editorial.eventBlurbs` |
| Upcoming + CTA | `auto.upcomingEvents`, `editorial.primaryCta` | upcoming events exist | event data; CTA = next event's registration link. The promoted headline event is filtered out of this list, and the button is suppressed here when a headline block is present (that block carries the issue's one CTA) |
| NZ Tech Pulse | `editorial.pulse` | pipeline produced verified data | `lib/newsletter/pulse.ts` (SEEK + RSS, verbatim-guarded) |
| — hero stat | `pulse.heroStat` | present in draft | SEEK report (verbatim) or evergreen fallback |
| — news list | `pulse.newsBites` | 1-3 genuinely relevant/local items | SEEK report + NZ feeds + the HRD sitemap, verbatim-guarded; wins over `newsBite` when set |
| — news bite | `pulse.newsBite` | legacy, for issues predating the list | always `null` in new issues; the renderer falls back to it for 2026-06/-07/-08 |
| — did you know | `pulse.didYouKnow` | present in draft | evergreen NZ/Auckland fact pool |
| Stats strip | `auto.stats` | always | site stats |
| Get involved | `editorial.opportunities` | always | mentor / volunteer / donate (canonical hrefs) |
| Sponsor thanks | `editorial.sponsorThanks` | partners/venues in the data | named from event data, or `null` |

## What this skill does *not* do

- Write the editorial copy for you. There is no AI draft: the newsletter is not
  generated in the cloud, and Step 4 is where the issue is actually written.
- Manage who is on the mailing list. Subscribing, unsubscribing and importing
  people into `newsletter_subscribers` all happen outside this loop; this skill
  only reads the list as it stands.
- Import the Mailchimp subscribers. That already happened, on **2026-08-29** —
  1,560 read, 15 held back by the suppression register, **1,545 rows written** —
  in a one-off run of `scripts/email/import-mailchimp-subscribers.ts`, not from
  here. Nor is there a next one to run from here: putting anybody into
  `newsletter_subscribers`, then or now, is `/update-mailing-list`'s job and is
  gated by that skill's `references/consent-rules.md`. See Prerequisite 6 for
  what the table holds today.
- Actually run the `resend emails batch` commands (a human does, Step 8e).
- Send transactional or auth email.
- Publish the web version to search — the archive card links it, `noindex` stays.
