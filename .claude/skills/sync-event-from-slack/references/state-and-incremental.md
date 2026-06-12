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
      "lastSyncedCommit": ""
    }
  }
}
```

Always written via `scripts/update-state.ts` (atomic, deterministically ordered)
— never hand-edit it, or git diffs and the no-op short-circuit drift.

## Watermark semantics (and the thread subtlety)

`watermarkTs` is the newest **top-level** message ts already processed. Incremental
reads return only messages with `ts > watermarkTs`.

**Subtlety:** a new reply on an *old* thread does **not** move the top-level
watermark — Slack leaves the parent in place. A naive `oldest` filter would miss
it. So the manifest also stores, per thread parent, its `replyCount` +
`latestReplyTs`. `fetch-channel.ts --since/--state` does a cheap full metadata
pass, detects parents whose `replyCount`/`latestReplyTs` grew, and pulls **only
the new replies** for those threads. New top-level messages get their full thread.

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
| `create?` | unmapped/`none` channel with new content → maybe a new event (needs a slug) |
| `create? (general-signal)` | a general channel whose new messages scored ≥ threshold for event content (evidence line shown) |
| `join+sync` | event channel the bot isn't in → `--join`, then sync |
| `skip` / `skip→review (new msgs)` | settled skip; the latter has new activity worth a glance |
| `fingerprint-stale` | the event was edited in the repo since last sync |
| `archived` | unreadable; ignored |

Settled states (`no-op*`, `archived`, `skip`) are hidden by default; pass `--all`
to see them. `--propose` suggests fuzzy event matches for unmapped event channels
(backfill aid only — verify before trusting; names and slugs diverge). `--join`
self-joins public event channels the bot isn't in (`channels:join` scope).

General channels are auto-scanned: only messages past the watermark are read, and
only channels scoring ≥ the signal threshold surface — chatter never reaches
Claude. A scanned-but-quiet channel still advances its watermark so it isn't
re-scanned next run.

## Token economics

- Discovery = one small table → Claude learns the whole workspace in one read.
- `--since`/`--state` → only **new** messages enter context after the first sync.
- Fingerprint no-op → unchanged channels cost ≈0 Claude tokens.
- In-script signal detection → only event-looking general channels surface.
- `.cache/` (gitignored) dedups full fetches within a session.

Slack API calls are cheap and stay out of Claude's context; the scripts do the
metadata legwork so Claude only ever reads deltas.
