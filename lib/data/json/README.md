# `lib/data/json/` — which file is authoritative for what

Every file here is imported at build time by an adapter in `lib/data/` (or, for
the archives, by a `lib/data/*.ts` module of the same name). Nothing is fetched
at runtime.

## The one fact everyone gets wrong

`shesharp_events_v3.json` and `events-custom.json` are **two halves of one
merged event list**. The merge is `mergeEvents()` in `lib/data/events.ts`:

1. Start from the 84 scraped events, in file order.
2. Index them by `slug`, and separately by normalised
   `detailPageData.humanitixUrl` (lowercased, query/hash and trailing slash stripped).
3. For each of the 13 custom events, resolve a target: **the Humanitix-URL match
   wins**, and only if there is none does the custom entry's own `slug` decide.
4. A match **replaces the scraped entry in place** — whole-object replacement,
   never a field-level merge, and the array position is kept. No match appends.

So **custom always wins**, and a custom entry can rename a historical event's
slug while keeping its position, purely by carrying the same Humanitix URL.
Today all 13 append (84 + 13 = the 97 pages `getAllEvents()` returns), so the
override path is real but unexercised — do not assume a custom entry is additive.
Editing the scraped file is never the way to fix an event: add or override it in
`events-custom.json`. (Trap: `getAllEvents()` and friends read a second pass,
`normalizedEventsV3`, which repairs title/time for verified Humanitix events;
the exported `eventsV3` is the **un**-normalised merge.)

## The files

| File | Size | Holds | Written by | Safe to edit by hand? |
| --- | --- | --- | --- | --- |
| `shesharp_events_v3.json` | 788K | 84 historical events scraped from the Webflow site, 2026-01-24 | the original scraper; since then only one-off scripts in `scripts/data/` | **No.** Override in `events-custom.json` instead |
| `events-custom.json` | 160K | A `template` plus 13 current/overriding events | `/sync-event-from-slack`; `scripts/data/*.ts` corrections | **Yes** — this is the edit target |
| `email-suppression-hashes.json` | 380K | 2,129 sha256 hashes of do-not-contact addresses, no PII | `scripts/email/suppression.ts` (`add`/`add-file`/`remove`/`sync`) | No — use the CLI |
| `hackathon-shared-facts.json` | 12K | 25 facts about the **Aotearoa AI Hackathon Festival 2026**, byte-identical to a copy in the event-QA repo | Hand | Yes, but a value change is a **cross-repo** change; CI runs `scripts/check-hackathon-facts.ts` |
| `shesharp_podcasts_with_local_images.json` | 20K | 15 She Sharp Bytes episodes: titles, Spotify ids, cover `url`/`srcset` | Scraped 2026-01-19 | Prefer not; read by `lib/data/spotify-podcasts.ts` |
| `shesharp_news_press_with_local_images.json` | 16K | 7 press items: title, date, cover, external link | Scraped 2026-01-19 | Prefer not; read by `lib/data/news-press.ts` |
| `humanitix/` | 284K | Ticketing aggregates 2020→ (6 files) | `scripts/humanitix/build-archive.ts` + `manifest.ts` | No — regenerate from the vault |
| `mailchimp/` | 132K | Audience counts and tag vocabulary 2019→ (5 files) | `scripts/mailchimp/build-archive.ts` + `manifest.ts` | No — regenerate from the vault |
| `newsletter-issues/` | 36K | One `YYYY-MM.json` per monthly issue | `/monthly-newsletter`; read by `lib/newsletter/issues-registry.ts` | Yes, via the skill |

`shesharp_*_with_local_images` names record a one-time migration step (images
were pulled off Webflow into `public/img/legacy-site/`), not the content. They are
podcast and press listings; every record still carries both the remote `url` it
came from and a stale `localPath` that no code reads.

## Two traps

- **Bare-filename greps return two unrelated subsystems.** `humanitix/` and
  `mailchimp/` each contain their own `aggregates.json`, `crosswalk.json` and
  `manifest.json`; `scripts/humanitix/` and `scripts/mailchimp/` each contain
  `build-archive.ts`, `csv.ts`, `manifest.ts`, `propose-crosswalk.ts`, `vault.ts`
  and `verify-export.ts`. Always grep with the directory in the path.
- **These files are CRLF and format-sensitive.** Write them through
  `readEventJson`/`writeEventJson` in `scripts/data/json-format.ts`, which
  refuses to write unless it can reproduce the original byte for byte.
  `shesharp_events_v3.json` cannot be round-tripped at all and must be edited as
  text — see `scripts/data/fix-v3-registration-and-status.ts`.

## Deeper docs

`docs/development/ADD_EVENTS.md` · `docs/development/SITE_DATA_HISTORY.md` ·
`docs/development/HUMANITIX_ARCHIVE.md` · `docs/development/MAILCHIMP_ARCHIVE.md`
