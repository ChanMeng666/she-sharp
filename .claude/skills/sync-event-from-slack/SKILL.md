---
name: sync-event-from-slack
description: Fully-automated sync of a Slack event-planning channel into the She Sharp Next.js codebase (`lib/data/json/events-custom.json` + `public/img/events/`). Use this skill whenever the user wants to create, update, or refresh an event on the She Sharp website from a Slack channel — phrases like "sync the AUT LinkedIn event from Slack", "pull the latest event info from #event-…", "update the event page from the planning channel", "create a new event from Slack", or anything involving turning Slack channel content about an event into a code change. Handles messages, thread replies, pinned items, bookmarks, speaker `.docx` bios, cover posters, and speaker headshots — downloading, renaming, and placing every asset automatically, then running the `verify-image-paths` CI gate and offering to open a PR or commit directly. Replaces the earlier `/event` Slack-bot flow, which required the developer to download and rename images by hand.
---

# Sync an event from a Slack channel to the repo

This skill turns a Slack event-planning channel into a correct,
up-to-date entry in `lib/data/json/events-custom.json` plus all the
event's image assets under `public/img/events/` — with no manual
download-and-rename work from the developer.

It uses the **She Sharp Event Collector** bot (read-only). The Collector
token is already in `.env` and has the scopes needed: `channels:history`,
`channels:read`, `channels:join`, `groups:history`, `groups:read`,
`files:read`, `users:read`, `pins:read`, `bookmarks:read`.

The skill keeps a committed **memory** at `state/sync-state.json` so it knows
what it already read, links each channel to its event(s) (slugs differ from
channel names), reads only deltas, and short-circuits unchanged channels to a
no-op. See `references/state-and-incremental.md` for the full model.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "sync event-aut-linkedin-15-may-2026 from slack"
- "create the AUT LinkedIn event page from the planning channel"
- "update the May LinkedIn workshop from slack"
- "pull the latest content for event X from its slack channel"
- "I want to refresh event Y on the site with whatever's in its slack channel now"

If the user names a slug like `event-…` or a Slack channel, this skill
applies. When in doubt, invoke it and confirm with the user before doing
anything destructive.

## What the user gives you

At minimum: a Slack **channel name or ID** (channels usually share the
slug, e.g. `event-aut-linkedin-15-may-2026` is both). Optional:

- An explicit slug (if it differs from the channel name)
- A commit strategy preference (PR vs direct-to-main)
- A title override, a featured-flag, a date — only honor when stated

The skill **always defaults to dry-run** — no file writes, no git, no
network side-effects beyond reading Slack — unless the user explicitly
asks to apply changes ("go ahead and apply", "commit it", "run it for
real"). This is the single most important safety property: the pipeline
is only trustworthy when the user has seen the plan before it executes.

### Never copy internal codes or private links into the repo

`events-custom.json` and the pages it renders are **public**. Slack
channels routinely carry things meant only for controlled distribution —
access codes, promo/discount/registration codes (e.g. a student
free-entry code, a flat-rate discount code, an `?accesscode=…` query
param), and private "invite-only" registration or checkout links.
**None of these may enter the data files or images** — and do not quote
the real code values anywhere, including this skill's own docs. Strip
them everywhere they can appear — `registrationUrl`
query params, `fullDescription` paragraphs, `specialSections` bullets
(especially a "Registration" section), `coverImage.alt`, sponsor notes.

Publish only the **public** registration base URL and, if concessions
exist, a neutral note that they're available via the event's official
channel (Community Hub / organiser) — never the code itself. When unsure
whether a token or link is internal, **leave it out and flag it in the
dry-run plan** for the user to decide. A leaked code is not fixed by a
later edit: it persists in public git history and must then be rewritten
out and rotated at its source.

## Prerequisites you must verify before doing anything

1. Working directory is the repo root (contains `lib/data/json/events-custom.json`).
2. `.env` contains `SLACK_BOT_TOKEN`. If not, stop and tell the user.
3. `@slack/web-api` + `dotenv` are in `package.json`. These are pre-existing
   dependencies; absence means the user is in the wrong project.
4. `mammoth` in `devDependencies` is optional — if absent, `.docx` extraction
   falls back to a built-in extractor. Note this in your plan summary.
5. For **post-event galleries only**: `gdown` (Google Drive folder download) and
   Python `Pillow` (webp conversion). Both are external tools, not repo deps —
   verify they're on PATH when a gallery pass is needed (see
   `references/image-conventions.md`). Not required for normal CREATE/UPDATE.

## Workflow

This skill runs in two layers. **Layer A (discovery)** finds what changed across
the whole workspace; **Layer B (per-channel sync)** turns one channel's delta into
event data and records state. When the user names a single channel you may jump
straight to Layer B (the fast lane) — but still update state at the end so the next
run stays incremental.

### Step 0 — Discover what changed (Layer A)

Run the triage first whenever the ask is broad ("sync any new events from Slack",
"check Slack for new events") or you weren't given a specific channel:

```
npx tsx .claude/skills/sync-event-from-slack/scripts/discover-channels.ts
```

It prints a compact table — one row per channel, never message bodies — and writes
the full machine triage to `.cache/triage.json`. Read the `action` column and act:

- `incremental` → mapped event with new content → Layer B with `--state`.
- `create?` / `create? (general-signal)` → likely a new event (an event channel
  with no mapping yet, or a general channel whose new messages scored for event
  content); confirm the slug with the user, then Layer B in CREATE mode.
- `exists? (≈slug @source)` → a page for this channel **already exists in a
  non-skill data source** (e.g. `shesharp_events_v3.json`). Do **not** create a
  duplicate — map the channel as `skip` (reason: already published there), or
  map it to the slug if you intend this skill to take ownership. This guard
  prevents the "the 2025 event is missing" illusion: events live across more than
  one file and only `events-custom.json` is skill-managed.
- `join+sync` → run `discover-channels.ts --join` to self-join, then Layer B.
- `skip→review (new msgs)` → a settled skip that got new activity; glance and
  decide whether to un-skip.
- `fingerprint-stale` → the event was edited in the repo since last sync; reconcile.
- `stale-status (slug: <status>)` → a mapped event whose date has passed but whose
  status is still future → run the **post-event gallery** pass (flip status to
  `past`, add the gallery; see `references/image-conventions.md`).
- `no-op` / `archived` / `skip` are quiet and hidden by default (`--all` shows them).

A `↳ digest:` line under a row is the **prior understanding** carried from the last
sync — read it first; it often answers "what is this and what's left to do" without
reading any messages. Use `--propose` for fuzzy event-match suggestions on unmapped
channels (backfill aid — verify, since names and slugs diverge). See
`references/state-and-incremental.md` for the full action table and semantics.

### Step 1 — Fetch the channel (Layer B)

For a channel already in the manifest, fetch **incrementally** so only new
messages enter context:

```
npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts <channel> --state > /tmp/channel.json
```

`--state` reads the channel's watermark + thread state from the manifest and
returns only the delta. For a brand-new channel (CREATE), omit `--state` for a
full fetch. Always pipe stdout to a file (output can exceed tool context limits).

The JSON includes a `_meta` block (`mode`, `since`, `newWatermarkTs`,
`threadState`, `newCount`, `priorDigest`), `channel` metadata, `pinned` messages
(always included — canonical), `bookmarks`, a `users` dictionary (id → name), and
`messages[]` with each thread expanded in a `thread` subarray. In incremental
mode `messages[]` carries only new top-level messages plus any older thread that
gained replies (with just its new replies). User IDs inside `text` stay as
`<@U…>` — the dictionary resolves them.

**Read the delta with `render-delta.ts` — never `head`/`tail` the raw JSON.**

```
npx tsx .claude/skills/sync-event-from-slack/scripts/render-delta.ts /tmp/channel.json
```

It prints the `priorDigest` first (the prior understanding — read it to
re-orient), then pinned/bookmarks, then **every** new message and reply in order
with files/links flagged. It bounds each message's length but never trims the
*set* of messages, so you cannot miss the late thread that carries the one thing
that changed (a confirmed date, a post-event photo album). Dumping the JSON with
`node -e … | head` silently drops the tail and has caused real misses — don't.

**No-op fast path:** if `_meta.newCount` is 0 and the event's fingerprint is
unchanged, there is nothing to sync — emit the UPDATE no-op line (Step 6) and skip
to recording state (Step 7.4).

### Step 2 — Identify assets

Walk every message (top-level and threaded). Collect:

- Image files (`filetype` = `png`, `jpg`, `jpeg`, `webp`, `gif`)
- `.docx` files (speaker bios, event overviews)
- Canonical URLs: Humanitix base URL, speaker LinkedIn, live event
  page URL ("Website is ready" style announcements)

### Step 3 — Download and read `.docx` attachments

For every `.docx` file referenced in the channel, download it to a
temporary path and extract text. The bio / overview docx is usually
the authoritative source for speaker name, title, full description,
and the "What You'll Learn" list.

```
# Download
npx tsx .claude/skills/sync-event-from-slack/scripts/download-file.ts \
  '<url_private>' '/tmp/<slugified-filename>.docx'

# Extract
npx tsx .claude/skills/sync-event-from-slack/scripts/extract-docx.ts \
  '/tmp/<slugified-filename>.docx'
```

Read the extracted text into your context and use it when composing
the event fields.

### Step 4 — Extract event fields

See `references/event-json-schema.md` for the full field map. For
each field, apply the **authoritative-content rules** documented
there (pinned > speaker-authored > latest thread reply > top-level
team confirmations). When multiple conflicting versions exist,
choose by the rules; do not paraphrase.

#### UPDATE mode: preserve editorial polish

When the target slug already exists in `events-custom.json`, you are
not starting from scratch — a human editor has likely layered polish
over the raw Slack source (em-dashes instead of hyphens, curly quotes
for apostrophes, a trimmed "the", a short UI-friendly subtitle).

The "authoritative-content" rules determine **semantic** content
(what's being said) — they do not override **editorial polish** (how
it's being said). For each field:

- If the only difference between the existing JSON text and the
  Slack-derived text is stylistic — punctuation, curly vs. straight
  quotes, spacing, a redundant article, minor word order — **prefer
  the existing JSON**. Re-writing polished copy on every sync is a
  regression, not a feature.
- If the Slack source contains genuinely new information (a new
  date, a changed venue, an added agenda bullet, a speaker
  correction), **the Slack version wins** — that's the whole point
  of re-syncing.
- When unsure whether a difference is semantic or stylistic, treat
  it as stylistic and preserve existing.

This is the inverse asymmetry of CREATE mode, where Slack is the
only input and nothing needs preserving.

Core fields to produce:

- `slug` (from user or channel name)
- `title`, `subtitle`
- `date` (human-readable), `time` (with timezone)
- `location` (full address including street, city, country)
- `fullDescription[]` (paragraphs from the speaker-authored copy)
- `speakers[]` (name, title, company, bio, LinkedIn, image)
- `sponsors.main[]` (with logo path — must exist under `/img/sponsors/`)
- `specialSections[]` (agenda + why-attend)
- `registrationUrl` (public base URL only — strip `?accesscode=…` and
  never use a private invite/checkout link; see the "Never copy internal
  codes or private links" rule above)
- `category`, `status`, `isFeatured`

### Step 5 — Classify and plan image downloads

See `references/image-conventions.md` for the heuristic. Produce a
concrete plan like:

```
Cover:    event-aut-linkedin-15-may-2026-cover.png
  ← file F0AUCJSPCQM (IMG_1509.jpg, 109 kB), shared in #38 with text
    "Attaching the poster he has shared to use"

Speaker:  event-aut-linkedin-15-may-2026-stuart-little.jpg
  ← file F0AU0HQC8UF (IMG_1508.jpg, 40 kB), shared in #38 with text
    "Pic - Attached"
```

If classification is ambiguous (two candidate covers, no clear
speaker image), stop and ask the user to point to the right one.

### Step 6 — Present the dry-run plan

Before touching disk or git, show the user a structured plan:

```
Slug          : event-aut-linkedin-15-may-2026
Mode          : CREATE (new entry) | UPDATE (slug already exists)
Downloads     : 2 images + 1 docx (already extracted)
JSON changes  : <inline diff summary>
Image targets : <list of write paths>
Redactions    : <any internal codes / private links found in Slack and
                 deliberately left out — or "none">
```

Always include the `Redactions` line: list every access/promo code or
private invite link you found in the channel and kept out of the data
(or state "none"). This makes the omission visible and lets the user
correct you if something you treated as internal is actually public.

Wait for the user to say "apply", "commit", or similar. If they
want to tweak anything (wrong image classification, prefer a
different bio wording), do it and re-present the plan.

**No-op short-circuit**: in UPDATE mode, if the computed JSON patch
is empty, no images need (re-)downloading, and no orphans need
removing, skip the full plan and emit a single line:

```
UPDATE no-op — <slug> already in sync with #<channel>
```

Then stop. There's nothing for the user to apply or veto, and a
full plan just adds noise.

### Step 7 — Apply

When the user approves:

1. Download the images (Bearer-auth via `download-file.ts`) to
   their final paths under `public/img/events/`.
2. Patch `lib/data/json/events-custom.json`. Preserve existing
   entries exactly — only touch the target event. Use `id =
   max(existing) + 1` for creates; keep the existing `id` for
   updates. If the patch changes any image path (extension change,
   filename change, slug change), `git rm` the old file so an
   orphan doesn't linger — the CI gate only catches broken
   references forward, not stale files left behind.
3. Run the CI gate:
   ```
   npx tsx scripts/verify-image-paths.ts
   ```
   If it fails, roll back all downloads, revert the JSON patch,
   and tell the user what broke. Never commit with the gate red.
4. **Record state** so the next run stays incremental. Feed the fetch payload
   (which carries the new watermark + thread state) to `update-state.ts`, and
   **always pass `--digest`** — a few sentences sedimenting what you now
   understand about this channel's event(s) + any open items. The digest is
   carried back next run (as `_meta.priorDigest` and the discovery `↳ digest:`
   line) so the model re-orients from it instead of re-reading the channel:
   ```
   # event mapping (repeat --slug/--event-id for a multi-event channel)
   npx tsx .claude/skills/sync-event-from-slack/scripts/update-state.ts \
     --from /tmp/channel.json --mapping event --slug <slug> --event-id <id> \
     --digest "<what this event is; what's published; what's still open>"

   # or, when a channel turns out to carry no site event / is deliberately skipped
   npx tsx .claude/skills/sync-event-from-slack/scripts/update-state.ts \
     --from /tmp/channel.json --mapping skip --reason "<why>" \
     --digest "<why skipped; what would change that>"
   npx tsx .claude/skills/sync-event-from-slack/scripts/update-state.ts \
     --from /tmp/channel.json --mapping none
   ```
   A good digest names the event, its date/venue, what is already published, the
   redaction landmines (codes/private links to keep out), and the next open item.
   Omitting `--digest` keeps the prior one; `--digest ""` clears it. Pass long
   text via `--digest-file <path>` if it's unwieldy on the command line.
   `update-state.ts` recomputes the event fingerprint from `events-custom.json`,
   so run it **after** the JSON patch. Commit `state/sync-state.json` alongside
   the event change — it is the memory that makes future syncs cheap.

### Step 8 — Commit

Ask the user to pick one, with sensible defaults:

- **PR** (default for new events): create branch `event-sync/<slug>`,
  push, `gh pr create`. Follow Conventional Commits —
  `feat(events): add <slug>` for creates, `fix(events): update <slug>
  from slack` for updates.
- **Direct to main** (default for small updates to an existing
  event when the user is maintaining fast iteration): commit on
  current branch (should be `main`) and push.

In both cases include a commit trailer:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### Step 9 — Report back

Summarize:

- What was created/changed (field-level)
- Image files written
- Git action taken (commit SHA or PR URL)
- Live detail page URL the visitor will see:
  `https://shesharp.org.nz/events/<slug>`
- Any warnings (missing sponsor logo, ambiguous classification
  you resolved by asking the user, etc.)

## Common failure modes and how to recover

**`not_in_channel` on `conversations.history`** — the Collector bot
isn't in the channel. For a **public** channel, self-join:
`npx tsx .../discover-channels.ts --join` (uses `channels:join`), then
retry. For a **private** channel the bot can't self-join — ask the user
to run `/invite @She Sharp Event Collector` in it.

**`channel_not_found`** — channel name typo, or bot can't see private
channels it isn't in. Verify with the user.

**Ambiguous image classification** — multiple poster candidates with
no pinned hint. List candidates with thumbnails (permalink) and ask
the user to pick.

**Speaker name doesn't match any Slack user ID** — this is normal.
Speakers are usually guests, not workspace members. Use the name
from the docx bio.

**`verify-image-paths.ts` fails** — a path in the JSON references a
file that wasn't downloaded, or an extension mismatch. Roll back
the JSON patch before the user sees a broken state.

**`files.filetype` is `jpeg` not `jpg`** — normalize the target
filename to `.jpg`. Do not re-encode the file.

## State & incremental notes

- **Thread subtlety:** a new reply on an *old* thread does not move the top-level
  watermark. `--state` catches it via per-thread `replyCount`/`latestReplyTs` in
  the manifest — so always fetch with `--state` for known channels, not a bare
  `--since <ts>` that only filters top-level.
- **General-channel auto-scan:** discovery reads only messages past each general
  channel's watermark and surfaces a channel only when its event-signal score
  clears the threshold. Scanned-but-quiet channels still advance their watermark,
  so they aren't re-scanned. A flagged general channel is a *candidate* — confirm
  the event and slug with the user before CREATE.
- **Skip stickiness:** a `skip` mapping stays skipped until new activity arrives
  (then it shows `skip→review`). Record *why* you skipped in `--reason`.
- **Fingerprint drift:** if someone edits `events-custom.json` by hand, discovery
  shows the channel `fingerprint-stale`. Re-sync or re-run `update-state.ts` to
  re-baseline.
- **Never hand-edit `state/sync-state.json`** — always go through `update-state.ts`
  so ordering stays deterministic and the fingerprint is recomputed correctly.

## What this skill does *not* do

- Publish the event anywhere else (no Humanitix, no LinkedIn push).
- Send notifications. Slack remains the discussion surface; this
  skill only reads.
- Delete or archive past events.
- Rewrite existing sponsor logos or team data.
- Interact with any Slack app other than the Collector.

Anything outside this boundary is a separate task.
