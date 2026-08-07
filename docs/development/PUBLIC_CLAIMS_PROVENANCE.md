# Public claims and where they come from

Every number and factual claim She Sharp publishes about itself, and whether a
record exists behind it. Written after a 2026 stock-take of the organisation's
Slack archive, which found three mutually contradictory sets of headline
figures issued within a fortnight of each other — including a longer time span
reporting *fewer* members than a shorter one.

This file is a maintenance aid. Nothing in it reaches the browser.

## The distinction that matters

**SOURCED** — traceable to a record: the event register, a Humanitix export, a
run sheet, or a dated figure in the organisation's own archive.

**UNSOURCED** — no record anywhere. It is presentational copy. Keeping it on
She Sharp's own marketing pages is a deliberate call by the maintainers.

The line to hold is not "delete everything unsourced". It is:

> An unsourced figure may appear in She Sharp's own marketing copy. It must not
> be lifted into a funding application, a sponsorship deck, an impact report or
> anything else a third party may rely on without first finding a source.

A charity's marketing puffery and its representations to funders are different
categories of claim, and the same number can be fine in one and a problem in
the other.

## Figures currently published

Tagged inline in `lib/data/stats.ts`; summarised here.

| Where it renders | Figure | Status |
|---|---|---|
| Homepage, About | `events.total` "95+ Events Since 2014" | **SOURCED** — derived by `getEventsHeldCount()` from the event register, not hand-typed |
| Homepage, About | `members.current` 3,500+ | UNSOURCED as an exact figure. The archive has 3,673+ and 3,767+ from the same fortnight (the second covering a *shorter* period), and the founder separately put it "over 3,000" |
| Homepage, About | `sponsors.current` 50+ | UNSOURCED. The archive's own counts are 33+ and 23 industry partners; the cumulative logo wall holds 39 organisations |
| Homepage | `impact.careerTransitions` 500+ "Career Success Stories" | UNSOURCED. Nothing tracks career outcomes |
| `/mentorship` | 120 mentors / 350 mentees / 85% success / 90% skill improvement / 6× and 5× promotion | UNSOURCED, all of it. The 2026 cycle's own registers record **23 mentors, 9 mentees, 0 active pairings**. No survey producing a success rate or a promotion multiple has ever been run |
| `/about` | membership timeline 2014–2024 and milestone list | UNSOURCED. No membership series exists before 2022. "Global Expansion" in 2024 corresponds to nothing; the real 2024 milestone was the 10th anniversary |
| `/sponsors/corporate-sponsorship` | "70–90 attendees per event" | **SOURCED** — 2022 sold 631 tickets across 7–9 events; the seven 2025 events averaged 79 registrations (555 total, 383 checked in). Corrected from "95+", which was above the top of the measured range |
| `/donate` | "$50 provides workshop materials for 5 students", etc. | UNSOURCED. Nothing in the records costs a workshop kit, a student place or a mentorship pairing. Illustrative, not a costing |

Two metrics are routinely confused and must not be merged:

- **`members.current`** — community members / followers. The founder has
  clarified this traces back to a coffee group of twenty.
- **`impact.workshopAttendees`** (5,000) — the 10th-anniversary line
  "empowering 5,000+ women". A cumulative reach figure, not a membership count.

And the mailing list is a third thing again: roughly 1,300 Mailchimp
subscribers at the end of 2022, about 1.6k recipients through 2023.

## Counting conventions

- **`attendees` in the event data holds the REGISTRATION count, not
  attendance.** `checkedIn` is the attendance figure. Decided in April 2026 —
  registrations are the larger number and are consistent with how the
  organisation has reported since 2020. The field name is misleading; the
  convention is not.
- **Expo and trade-show appearances have no attendance figure at all.** The
  organisation has never counted heads at a booth. A null there is correct, not
  missing data.
- **Humanitix only holds events from 2020 onwards.** Anything earlier has no
  exportable registration data.

## Known problem, unresolved

**The 2025 impact report PDF states that the HCLTech Dunedin event had 18
returning attendees.** That was She Sharp's *first* event in Dunedin, so the
figure cannot be right. The PDF is published at `/resources#impact-reports` and
is a funder-facing document, which puts it on the wrong side of the line above.
Nobody has re-checked it. Flagged 2026-08; not corrected here because the PDF
is not generated from this repository.

## Claims that are absent and probably should not be

- **Donee organisation status.** She Sharp is a registered donee organisation,
  which means a company's or individual's donation may qualify for a tax
  credit. The archive records this being treated as essential in sponsorship
  conversations. Neither `/donate` nor `/sponsors/corporate-sponsorship`
  mentions it. Not added here because tax wording should come from someone
  authorised to give it, not be drafted by whoever edits the page.
- **She Sharp is not GST-registered** (confirmed February 2026). Any invoicing,
  sponsorship or donation page that implies otherwise is wrong.
- **Charity registration number CC57025** is correctly shown in the footer, the
  terms of service and the volunteer code of conduct. The *year* of
  registration is not stated anywhere and should not be until someone reads it
  off the Charities Register — the only figure in the archive is the founder's
  "2019 from memory", alongside a trust deed finalised in April 2019 and donee
  status confirmed in October 2019.

## Related

- `lib/data/stats.ts` — inline tags on every figure
- `lib/data/sponsors.ts` + `lib/data/sponsors.test.ts` — sponsor tiers and the
  logo-usage restrictions
- `lib/data/testimonials.ts` — the editorial rules for quoting real people
- `docs/development/SITE_DATA_HISTORY.md` — why so much historical event data
  is incomplete
