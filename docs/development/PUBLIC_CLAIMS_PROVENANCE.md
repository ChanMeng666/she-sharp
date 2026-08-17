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
| `/sponsors/corporate-sponsorship` | "70–90 attendees per event" | **SOURCED** — and now from a complete count rather than a sample. The Humanitix account export of 2026-08-17 gives the full 2020–2026 series below: the seven-year mean is 83 registrations per event, and every year except 2021 and 2026 sits inside 70–90 or above it. The earlier evidence in this row (2022: 631 tickets across 7–9 events; 2025: 555 across seven) was close but taken from partial data — the export counts 733 across 8 in 2022 and 618 across 8 in 2025 |
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
- **The Humanitix archive is not the event register.** It covers **57 of the
  97 event records**. The other 40 are pre-2020, ticketed elsewhere (the 2025
  AI Hackathon Festival, 98 registrations), or never ticketed at all (every
  expo). Counting events from the archive under-reports; count them from
  `lib/data/events.ts`.
- **A check-in count of zero usually means nobody scanned.** 26 of the 62
  ticketed instances ran no check-in, all of 2020 and 2021 among them. An
  organisation-wide check-in rate computed over all of them lands at roughly
  half the true figure. `checkInDataPresent` in
  `lib/data/json/humanitix/events.json` is the field that says which.

### The registration series, 2020–2026

From `lib/data/json/humanitix/aggregates.json` (export 2026-08-17). **SOURCED.**
The check-in rate is over the instances that ran a check-in, never over all of
them.

| Year | Events | Registered | Checked in | Mean per event | Check-in rate |
|---|---|---|---|---|---|
| 2020 | 10 | 739 | — | 74 | not recorded |
| 2021 | 6 | 333 | — | 56 | not recorded |
| 2022 | 8 | 733 | 108 | 92 | 49% |
| 2023 | 10 | 1,025 | 656 | 103 | 70% |
| 2024 | 9 | 1,138 | 725 | 126 | 64% |
| 2025 | 8 | 618 | 429 | 77 | 69% |
| 2026 | 11 | 570 | 349 | 52 | 69% |
| **Total** | **62** | **5,156** | **2,268** | **83** | — |

Also newly SOURCED from the same export: per-event registrations from 2020 and
check-ins from 2023; net earnings ($26,051.22 across the seven years); **2,919
unique ticket buyers**; the repeat-registration distribution; the ticket-type
and audience-segment mix; and the count of organisations represented.

**None of that evidences anything else.** `members.current` (3,500),
`sponsors.current` (50), the entire mentorship block,
`impact.careerTransitions` (500), `impact.workshopAttendees` (5,000) and the
`/about` timeline remain exactly as UNSOURCED as they were. This needs saying
out loud, because a 5,156-ticket archive is precisely the artefact somebody
will reach for to justify "5,000+ women empowered" — and **5,156 tickets held
by 2,919 people is not 5,000 people.**

Method and caveats in full: `docs/development/HUMANITIX_ARCHIVE.md`.

## Known problem, unresolved

**The 2023 MYOB "Kickstart Your Career in Tech" event is published under the
wrong date.** The site says 12 April 2023; Humanitix records 28 April, and the
export settles it — ticket sales ran from 24 March to 28 April, with the final
order placed on the event day itself, so orders continued for 16 days past the
date the site publishes. The registration counts agree exactly at 86, which is
what confirms these are the same event. Recorded in
`lib/data/json/humanitix/crosswalk.json` with status `held`; not corrected,
because changing a published event date is a different act from correcting an
attendance figure.

**A 2025 figure that survived scrutiny.** The 2025 impact report PDF states 716
registered attendees across 9 events, and the Humanitix export shows only 618
across 8. The difference is not an error: the 2025 AI Hackathon Festival (98
registrations) was not ticketed on Humanitix. 618 + 98 = 716, and 8 + 1 = 9.
Recorded here because the discrepancy looks damning until the missing event is
found, and the next person to check will find it the same way.

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
  terms of service and the volunteer code of conduct.

## Settled from the Charities Register

Read off `register.charities.govt.nz/Charity/CC57025` on 2026-08-07, which
resolves three things the organisation's own records could not agree on. Held
in `lib/config/footer.ts` → `charityInfo`.

| Fact | Value |
|---|---|
| Legal name | **She Sharp** — two words |
| Status | **Registered**, nationwide |
| Registered since | **4 June 2019** |
| Registration number | CC57025 |
| NZBN | 9429047458970 |

- **She Sharp is a registered charity.** A 2024 sponsorship draft described it
  as a "non-charitable organisation"; that was simply wrong. The archive also
  carries "She Sharp Charitable Trust" from supplier paperwork — the registered
  legal name is "She Sharp".
- **The name is two words.** A 2016 meeting resolved to use "SheSharp" as one
  word, but the entity was never registered that way, and a 2023 brand
  guideline independently landed on "She Sharp". Prose should use "She Sharp";
  "She#" is the visual mark, not the name.
- **The founder's "2019 from memory" was right**, and the exact date is now on
  record. Note that founding (2014) and charity registration (2019) are
  eighteen months and one legal step apart — `foundingDate` in the
  Organization schema is the former and must not be changed to the latter.
- The register also lists a **postal address that is a private residence**. It
  is deliberately not reproduced in this codebase.

## Related

- `lib/data/stats.ts` — inline tags on every figure
- `lib/data/sponsors.ts` + `lib/data/sponsors.test.ts` — sponsor tiers and the
  logo-usage restrictions
- `lib/data/testimonials.ts` — the editorial rules for quoting real people
- `docs/development/SITE_DATA_HISTORY.md` — why so much historical event data
  is incomplete
