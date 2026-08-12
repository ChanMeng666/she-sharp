# State, discovery, and incremental reads

This skill keeps a memory of what it has already read so it never re-ingests a
whole channel, and so the channel↔event linkage (which can't be recovered from
names — slugs differ from channel names) survives between runs.

## The manifest — `state/sync-state.json` (committed)

Keyed by **channel id** (stable across renames). One entry per channel:

```jsonc
{
  "version": 1,
  "channels": {
    "C0B7K8BFN30": {
      "name": "event-myob-ai-in-practice-30july-2026",
      "type": "event",                       // "event" | "general"
      "mapping": {
        "kind": "event",
        "events": [ { "slug": "she-sharp-and-myob-working-smarter", "eventId": 95 } ]
        //  one channel can feed several events → array
        //  | { "kind": "skip", "reason": "…" }   (sticky: stays skipped until new activity)
        //  | { "kind": "none" }                  (scanned, no site event)
      },
      "watermarkTs": "1780954764.500039",    // latest top-level ts already processed
      "threads": { "1780900000.000100": { "replyCount": 4, "latestReplyTs": "1780950000.0001" } },
      "fingerprint": "sha256:…",             // hash of the mapped event(s) salient fields
      "lastSyncedAt": "2026-06-09T…Z",
      "lastSyncedCommit": "",
      "digest": "What was understood last sync + open items.",  // optional; the sediment
      "digestAt": "2026-06-22T…Z"
    }
  }
}
```

Always written via `scripts/update-state.ts` (atomic, deterministically ordered)
— never hand-edit it, or git diffs and the no-op short-circuit drift.

**Omitting `--mapping` inherits the existing mapping.** Recording a read is not a
statement about mapping, so a plain `update-state.ts --from <payload>` on an
already-mapped channel leaves its events / reason / always-read alone. It used to
default to `none` and silently delete them. `--mapping none` still clears, and
`shouldInheritMapping()` in `state-lib.ts` is the single implementation of that
question, with assertions in `state-lib.test.ts`.

**The manifest cannot tell you what is missing from the manifest.** Every gate
built on it — `audit-read-state.ts`, and the coverage walk's target list —
iterates its key set, so a conversation that was never enumerated is invisible to
all of them at once. That is not a bug in any of them; it is the shape of the
question. `verify-coverage.ts --enumerate-only` asks the other question against
`conversations.list` with `exclude_archived: false`, in about seven seconds. Run
it every sync.

## Digest — the sediment that stops re-reading Slack

`digest` is a few sentences capturing what was **understood** about the channel's
event(s) last sync (state, what's published, redaction landmines, the next open
item). Set it with `update-state.ts --digest "…"`. It is omitted entirely when
empty, so channels never given one stay byte-stable.

Its payoff is on the *next* run: `fetch-channel.ts --state` returns it as
`_meta.priorDigest`, and discovery prints it as a `↳ digest:` line. The model
re-orients from one line instead of re-reading the channel — the watermark
already prevents re-fetching old messages; the digest prevents re-deriving their
*meaning*. Update it whenever the understanding changes.

## Watermark semantics (and the thread subtlety)

`watermarkTs` is the newest **top-level** message ts already processed. Incremental
reads return only messages with `ts > watermarkTs`.

**Subtlety:** a new reply on an *old* thread does **not** move the top-level
watermark — Slack leaves the parent in place. A naive `oldest` filter would miss
it. So the manifest also stores, per thread parent, its `replyCount` +
`latestReplyTs`. `fetch-channel.ts --since/--state` does a cheap full metadata
pass, detects parents whose `replyCount`/`latestReplyTs` grew, and pulls **only
the new replies** for those threads. New top-level messages get their full thread.

### What this got wrong until 5 August 2026

Three bugs, one root cause — nobody had written down what a read position *means*:

1. **The triage peeked at one message.** `conversations.history limit: 1` returns
   the newest parent, and a reply never moves a parent. A channel whose only new
   content was thread replies was reported quiet, hidden behind `--all`, and
   advanced past. It now reads a page of 200 and compares every parent's
   `reply_count`/`latest_reply` against the manifest.
2. **A never-recorded thread was skipped, not caught.** A message posted with no
   replies is never written to `threads`, so the first reply it ever gets lands
   on a parent the manifest has never heard of. The delta test required a prior
   record, so that case — the most common one — was invisible.
3. **The read receipt described what existed, not what was delivered.**
   `_meta.threadState` was built from the full history before the emit loop, so
   `update-state.ts` recorded threads nobody had been shown as read. This is the
   one that turned a miss into a permanent loss: the next run had nothing to
   find.

Cost: the event owner's thirteen-item review of a presentation deck, unread for a
day, three days before it was projected. Found only because a human pasted the
permalink.

**The two rules, now in `state-lib.ts` with `state-lib.test.ts` asserting them:**

- `threadHasUnread(current, known)` — **an absent `known` means zero replies
  seen, not "skip"**, and `latestReplyTs` is checked as well as `replyCount` (a
  thread that gains one reply and loses another holds its count).
- `mergeThreadState(parents, delivered, prior)` — **a delivered thread advances;
  an undelivered one keeps what it had.** Never widen this to "current state of
  everything": it is the difference between a bug that gets caught next run and
  one that erases its own evidence.

Both the triage and the fetch call the same two functions. They diverged in the
first place because each had its own copy of the question.

## Fingerprint — the no-op short-circuit

`fingerprint` is a sha256 over the mapped event(s) salient fields in
`events-custom.json` (title, date, description, speakers, sponsors, sections,
registration, status, … — excludes `attendees`/`checkedIn`). If a re-sync would
produce the same event, the fingerprint is unchanged and the channel is a no-op:
no bodies are read into context. If `events-custom.json` was edited out-of-band,
discovery flags the channel `fingerprint-stale`.

## Discovery triage contract — `scripts/discover-channels.ts`

Run **first** every sync. Prints a compact table (rows, never message bodies) and
writes the full machine triage to `.cache/triage.json`. Each row's `action`:

| action | meaning |
|---|---|
| `no-op` | nothing new past the watermark — skip |
| `incremental` | mapped event with new content → sync the delta |
| `incremental (thread replies)` | same, but **nothing new at the top level** — the new content is inside a thread. Checking the channel by eye will show no new message; open the thread |
| `create?` | unmapped/`none` channel with new content → maybe a new event (needs a slug) |
| `create? (general-signal)` | a general channel whose new messages scored ≥ threshold for event content (evidence line shown) |
| `exists? (≈slug @source)` | a page already exists for this channel in a **non-skill** source → map as `skip`/own it, don't create a duplicate |
| `join+sync` | event channel the bot isn't in → `--join`, then sync |
| `skip` / `skip→review (new msgs)` | settled skip; the latter has new activity worth a glance |
| `fingerprint-stale` | the event was edited in the repo since last sync |
| `stale-status (slug: status)` | mapped event whose date has passed but status is still future → run the post-event gallery pass |
| `archived` | unreadable; ignored |

Settled states (`no-op*`, `archived`, `skip`) are hidden by default; pass `--all`
to see them. `--propose` suggests fuzzy event matches for unmapped event channels
(backfill aid only — verify before trusting; names and slugs diverge). `--join`
self-joins public event channels the bot isn't in (`channels:join` scope).

## Events live in more than one file (the `exists?` guard)

The public `/events` listing merges the skill-managed `events-custom.json` with
scraped/legacy sources (`shesharp_events_v3.json`, …). Only `events-custom.json`
is skill-managed; a slug can already have a live page in another file. Discovery
cross-checks **all** published sources (`state-lib.ts` `loadPublishedEvents()`),
so an unmapped event channel whose page already exists elsewhere is flagged
`exists?` rather than `create?`. This is what prevents the "the 2025 event is
missing, let's create it" duplicate — the event wasn't missing, it just wasn't in
the file the skill writes.

General channels are auto-scanned: only messages past the watermark are read —
**plus the unread replies on any thread that grew**, capped at
`GROWN_THREAD_PEEK_CAP` parents per channel — and only channels scoring ≥ the
signal threshold surface, so chatter never reaches Claude. Scoring used to see
top-level text only, which meant a channel whose entire event conversation
happened inside one thread scored zero.

A scanned-but-quiet channel advances its watermark **and records the grown
threads it scored**, so it isn't re-scanned next run. Note the asymmetry with
`fetch-channel.ts`, which records only what it *delivered* to the model: triage
records what it *scored*. That is a weaker guarantee, and it is why a quiet DM is
not the same thing as a DM the model has read.

## Token economics

- Discovery = one small table → Claude learns the whole workspace in one read.
- `--since`/`--state` → only **new** messages enter context after the first sync.
- Fingerprint no-op → unchanged channels cost ≈0 Claude tokens.
- Digest (`priorDigest`) → re-orient from one sentence, not a re-read of the channel.
- In-script signal detection → only event-looking general channels surface.
- `.cache/` (gitignored) dedups full fetches within a session.

Slack API calls are cheap and stay out of Claude's context; the scripts do the
metadata legwork so Claude only ever reads deltas.
