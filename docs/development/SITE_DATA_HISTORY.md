# Why the historical site data looks the way it does

Background, not rules. If you have just found something odd in the event data
and are about to go looking for the recent change that broke it, read this
first — most of it has been that way since 2023 and the cause is a migration,
not a regression.

## The 2023 migration lost data, and it was known at the time

She Sharp moved from WordPress to Webflow in 2023 **without first working out
how the old site's data would come across**. The founder later called it "a
huge mistake". Two things followed: the domain could not be changed for a
period, and no offline WordPress backup was available to restore from.

The bulk of the website team's work in the second half of 2023 was re-entering
every event from 2014 to 2022 by hand. That is why so many historical records
carry only a title, a date and one paragraph.

**Practical consequence:** patchy fields on pre-2023 events are the residue of
that migration. They are not recent breakage, and there is usually nothing to
"restore" — the source is gone.

## The current site was scraped from the Webflow site, and the scrape has tells

Everything in `lib/data/json/shesharp_events_v3.json` came from crawling the
Webflow site. Known artefacts, all since corrected but worth recognising if
you see the pattern elsewhere:

- **`registrationUrl` on all 84 events was the charity-register link** — the
  scraper picked up the page footer instead of the ticket button. The real
  link had been captured separately as `humanitixUrl`.
- **`detailPageData.status` was `"upcoming"` on all 84**, including events from
  2014. Nothing on the site reads it; `lib/data/events.ts` decides upcoming vs
  past from the date.
- **`detailPageData.date` and `.time` are empty on nearly every record.** The
  real values are in `dateTime` / `startTime` / `endTime` / `timezone`, and
  `deriveEventTime()` in `lib/data/events.ts` already falls back to them. Do
  not "fix" the empty fields; the fallback is the design.
- **Section headings were flattened into body text**, sometimes duplicated,
  with links concatenated onto the end of the sentence before them. The Xero
  workshop-prep block was the clearest case.

A manual comparison in 2026 put the scrape at roughly 99% complete. Photos —
mostly group shots — were the main gap and were filled by hand; a little copy
was found missing in June 2026. The crawler was not re-run. If someone raises
"the data is incomplete" again, this is the answer.

## Some old pages could not be crawled at all

In May 2026 a list of Webflow event pages that would not open was handed over
for investigation. Several approaches were tried and the root cause was never
found. A separate record describes 10–15 event pages erroring, all from past
years, with a week spent on it before the conclusion that the old site's
content no longer needed fixing.

**This means the corresponding events on the current site are permanently
short of content.** Not a missed crawl — the source is unreachable.

There is still a window: the Webflow subscription was auto-renewed through to
roughly mid-2027, and the site holds 582 CMS items. Downgrading to the free
plan caps it at 50 items, which would destroy the rest. Anyone wanting to
recover this material should do it before that subscription lapses, and should
check whether auto-renew was ever actually turned off — a decision was taken
to turn it off and no record confirms it happened.

## Two counting conventions that look like bugs

- **`attendees` holds REGISTRATIONS, not attendance.** `checkedIn` is
  attendance. Decided in April 2026: registrations are the larger number and
  match how the organisation has reported since 2020. The field name is
  misleading; the convention is deliberate.
- **Expo and trade-show appearances have no headcount, by design.** She Sharp
  has never counted people at a booth. This is why those appearances live on
  `/community` rather than in the event data — see
  `lib/data/community-appearances.ts`.

Also: **Humanitix only holds events from 2020 onward.** Anything earlier has
no exportable registration data and never will.

## Related

- `docs/development/PUBLIC_CLAIMS_PROVENANCE.md` — which published figures have
  a record behind them
- `scripts/data/fix-v3-registration-and-status.ts` — the sweep that repaired
  the two systemic scrape artefacts
- `CLAUDE.md` → "Working with site content and data" — the rules, as opposed to
  this background
