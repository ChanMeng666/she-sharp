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

| Role | Pattern | Example |
|---|---|---|
| Cover poster | `event-<slug>-cover.<ext>` | `event-aut-linkedin-15-may-2026-cover.png` |
| Speaker photo | `event-<slug>-<kebab-speaker-name>.<ext>` | `event-aut-linkedin-15-may-2026-stuart-little.jpg` |
| Sponsor-specific asset (rare) | `event-<slug>-<sponsor>.<ext>` | `event-aut-linkedin-15-may-2026-aut.png` |

The skill already receives `<slug>` from the user. Speaker-name kebab-case
should match the speaker's full name (first + last), lowercased with hyphens
and any diacritics stripped — e.g., `Stuart Little` → `stuart-little`,
`Sofía García` → `sofia-garcia`.

## Extension preservation

Use the original extension from Slack's `files.filetype` field (`png` stays
`png`, `jpg` stays `jpg`). Do not re-encode. If the filetype is `jpeg`,
normalize to `.jpg`.

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

## Forbidden image sources

- Do **not** pull images from `scripts/` scratch areas or temp paths.
- Do **not** re-use images from other events' slugs. Every event gets its
  own assets even if visually similar.
- Do **not** embed external URLs (Canva links, CDN links) in the JSON —
  always download, rename, and commit.
