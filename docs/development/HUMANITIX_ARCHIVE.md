# The Humanitix ticketing archive

She Sharp has sold tickets through **Humanitix** since 2020. On 2026-08-17 the
whole account was exported from Humanitix → Reports at account level, filtered
to all events: 18 CSVs covering **62 (event, date) instances**, **5,156 valid
tickets**, 77 cancelled ones, 4,145 completed orders and $26,051.22 in net
earnings. (Seventeen were taken in the first pass; the Event summary was found
missing afterwards and re-exported the same day.)

That export is the only complete record of who has come to a She Sharp event,
and it arrived as a folder in one person's Downloads. This document describes
where it now lives, what was derived from it, and — more important — the seven
ways a number taken from it can be wrong.

---

## The three tiers

| Tier | Where | Committed? | Holds |
|---|---|---|---|
| Raw | `private/humanitix/<export-id>/` | **No** — `/private/` is gitignored | The 17 CSVs, byte for byte as Humanitix produced them |
| Derived | `lib/data/json/humanitix/` | Yes | Aggregates only. No name, address, code or answer |
| Access | `lib/data/humanitix.ts` | Yes | The typed reader, and the normalisation everything shares |

### Why the raw data is not in git

The attendee export carries every registrant's name, email and mobile, plus 32
street addresses, 14 dates of birth, and the free-text answers to the dietary,
accessibility and photo-consent questions. The access-code report carries **124
live codes**, each of which grants free or discounted entry.

On 2026-06-11 three such codes reached `lib/data/json/events-custom.json` and
had to be rotated, with a history rewrite. A leaked code cannot be un-leaked by
a later edit. So: the raw exports never enter version control, and **no code
value appears anywhere in this repository — not in a data file, not in this
document, not in a commit message.**

### The vault here is a cache. The master copy is elsewhere.

`git` does not back up `/private/`, and `git clean -xdf` deletes it — so the
copy in this repository is a convenience, not the archive of record.

**The master copy lives in the private `she-sharp-slack-archive` repository,
under `humanitix/<export-id>/`.** That is the same repository holding the
verbatim Slack transcripts, and it was chosen for three reasons: it is already
the one place the organisation's unredacted record is allowed to be kept, it is
version-controlled and backed up on GitHub, and its `.gitattributes` sets
`* -text`, so files stay byte-for-byte identical through any checkout — which is
what keeps the recorded sha256 meaningful.

Scripts resolve the vault from `HUMANITIX_VAULT_DIR` first:

```bash
export HUMANITIX_VAULT_DIR=".../she-sharp-slack-archive/humanitix/2026-08-17"
```

Either copy works, because every file's sha256 is in the committed manifest and
the two can be proved identical without either trusting the other.

Do **not** put the raw CSVs in Vercel Blob, Cloudinary, or any store the
application can read. The whole design rests on the running application having
no path to a real address.

---

## What is committed

```
lib/data/json/humanitix/
  manifest.json        GENERATED · provenance for every raw file, append-only
  events.json          GENERATED · the 62 instances, with Event ID and venue
  aggregates.json      GENERATED · totals, years, segments, people, organisations
  crosswalk.json       AUTHORED  · instance → site event slug
  segments.json        AUTHORED  · 112 ticket-type strings → 14 audience segments
  organisations.json   AUTHORED  · employer-string aliases
```

**GENERATED files are rebuilt wholesale and must never be hand-edited.**
**AUTHORED files are judgements and the builder never writes them.** That split
is the point: a regeneration must not be able to overwrite a decision a person
made. In particular, `events.json` carries no `siteSlug` — the mapping lives
only in `crosswalk.json`.

`manifest.json` records, per raw file, its report type, export timestamp,
sha256, row and column count, PII class, and what it is authoritative for. It
exists so provenance stays auditable **when the data is not present**, which is
the normal case and always the case on CI.

---

## Metric definitions

Every figure below is defined in terms of a named file and field. The caveats
are not decoration: each one is a way the number has already been, or could
easily be, misread.

### registered

Ticket rows in the attendee export, excluding the 77 cancelled. **This is what
`attendees` means on a site event record** — the convention decided in April
2026 and recorded in `docs/development/CONTENT_RULES.md`.

- It counts **tickets, not people**. 5,156 tickets belong to 2,919 people.
- It includes She Sharp's own shared booking mailbox.
- It is registrations, not attendance. Roughly 30% of registrations do not
  turn up.

### checkedIn

Rows whose `Checked in` column reads `Checked in`. **Read `checkInDataPresent`
first, always.**

- **26 of the 62 instances never ran a check-in**, all of 2020 and 2021 among
  them. Their `checkedIn` is 0 because nobody scanned, not because nobody came.
  `checkInDataPresent` is `false` on exactly those, and `checkedIn` on a site
  record is `null` rather than `0` for the same reason.
- A slightly larger set of rows (2,289 against 2,268) carries a check-in
  *timestamp* without the flag — 21 people across 10 events who were scanned in
  and then scanned out again. The archive counts **the flag**, because that is
  the definition the site's own published figures match to the digit and
  therefore what the organisation has been reporting since 2020.
- Humanitix's own Event summary agrees with that flag count on 61 of 62
  instances. The one exception is AI Enviro Hack, where Humanitix says 81 and
  the archive says 80: there is exactly one **cancelled** ticket in the entire
  archive that was scanned, and it belongs to that event. The archive counts
  check-ins on valid tickets only.
- One instance is discarded as an artefact: Girls Night Out @Xero, Nov 2020,
  recorded a single scan out of 75. The lowest genuine check-in operation
  anywhere in the archive scanned 24.3%. Instances scanning under 5% are treated
  as not-recorded and listed in `aggregates.checkInCoverage.discardedAsArtefact`.

### checkInRate

`checkedIn ÷ registered`, **defined only where `checkInDataPresent`**. A rate
computed across all 62 instances is wrong by construction and lands at roughly
half the true figure. The archive reports `null`, not `0`, for 2020 and 2021.

The rate has been strikingly stable since 2023: 69.9%, 63.7%, 69.4%, 69.1%.

### earnings

`Your earnings` — **net to She Sharp after Humanitix fees**. Not gross, not
revenue, not what attendees paid. Donations are a separate line and the two are
only added in `totals.earnings.total`.

Humanitix's own earnings report counts a cancelled ticket's earnings, so the
archive does too: $25,090 from valid tickets plus $90 from cancelled ones is
what reconciles to the $25,180 both the earnings report and the order report
state.

### uniquePeople

Distinct normalised email address, preferring the attendee's own and falling
back to the buyer's. **2,919**, after excluding one identity.

- The excluded identity is She Sharp's shared booking mailbox. It looks like the
  archive's most devoted attendee — 47 tickets across seven events — but those
  47 tickets carry **38 different attendee names**, because staff booked on
  colleagues' behalf. The people behind them are unrecoverable and are simply
  absent from the distribution.
- One person with two addresses counts twice. A shared household address counts
  once.
- **2,919 unique ticket buyers is not 3,500 members and never validates it.**
  See the warning below.

### repeatDistribution

How many people registered for 1, 2, 3 … instances. This is repeat
**registration**. It becomes repeat *attendance* only when restricted to the 36
instances that recorded check-ins — i.e. 2023 onward. That distinction is
exactly the trap behind the unresolved "18 returning attendees in Dunedin" claim
flagged in `PUBLIC_CLAIMS_PROVENANCE.md`.

### segment mix

The 112 free-text ticket-type strings collapsed to 14 segments by
`segments.json`. Every string must match a rule; the builder fails and lists any
it cannot classify, so `other` is a choice somebody makes rather than a bucket
things fall into.

**`segment: "session"` is 15.8% of all tickets and is not an audience category.**
Those are named session and workshop slots — "Thursday 14th May featuring …",
"Workshop \"Build your own AI Powered Web App\"", "Tickets - March 2026". They
say *when* somebody came, not *who they are*. A segment mix presented as an
audience breakdown must exclude them or say what they are.

### organisations

Distinct canonical employers among the 4,094 rows that answered the
Company/Organisation question.

- The string is typed freehand at checkout and **never verified**.
- **Six attendees typed their own name into the employer box.** Those rows are
  counted (`rowsPersonalName`) and then excluded: a person is not an
  organisation, and the funder report prints this list by name. Detected by
  matching the employer string against the registrant names actually present in
  the export, so it is a test rather than something somebody has to notice —
  `isPersonalName()` in `lib/data/humanitix.ts`, asserted by invariant 14e.
- `NA` (47 rows), `-`, `Student`, `Self` and `Unemployed` are not organisations.
  They are listed in `organisations.json.nullish` and resolve to nothing.
- `She Sharp` (267), `SheSharp` (86) and `She#` (37) are one organisation; the
  split is a checkout typo. It carries `kind: "self"` so the organisation's own
  ambassadors can be excluded from an "employers represented" count.
- Only organisations with 5 or more tickets appear in the ranking, so a
  one-person employer string cannot identify an individual.

### marketingOptIn

224 orders / 187 unique addresses, **all between July 2020 and May 2022**. The
checkout field stopped being used after that.

**This is a historical record, not a sending list.** Whether a four-to-six-year-
old checkout tick is still a permission is decided by
`.claude/skills/update-mailing-list/references/consent-rules.md`, not by this
archive. Registering for an event is not subscribing.

---

## Seven ways to get a number wrong

1. **"Since 2014."** Humanitix holds nothing before 2020. Any long-run series
   drawn from this archive is missing its first six years.
2. **"All our events."** The archive covers **57 of the site's 97 event
   records**. Forty have no Humanitix data: everything pre-2020, the 2025 AI
   Hackathon Festival (ticketed elsewhere, 98 registrations), and every expo,
   which is never ticketed at all. Counting events from this archive
   under-reports.
3. **A check-in rate over everything.** See `checkInDataPresent` above.
4. **Tickets read as people.** 5,156 tickets, 2,919 people.
5. **A series read session by session.** The site models the two 2020
   STORYTELLERS series as one record each and publishes the **sum** —
   220 + 9 + 40 = 269 and 30 + 7 = 37, both exactly right. Compared session by
   session they look like errors, and "fixing" them would break two correct
   numbers. `crosswalk.json.series` carries `rule: "sum"` and a test asserts it.
6. **An employer that is a person.** Six registrants typed their own name into
   the Company/Organisation box. Suppressed here, but anyone reading the raw
   export directly will count them as organisations and can publish somebody by
   name.
7. **A Humanitix Event ID that is not one.** One value, `JWEASJXE`, is attached
   to **twelve unrelated events across 2021–22** — an account-level identifier
   Humanitix wrote into that column for that era. Joining on it raw returns
   twelve events and no warning.

   The rule is about NAMES, not rows. An id covering several rows is normal: a
   Humanitix event that ran on several dates is one event with one id, which is
   exactly what the two 2020 STORYTELLERS series are (`4XC3M1WP`, `8PUP9RV2`).
   An id covering several event *names* is not an event id, and is discarded.
   That leaves **50 of 62** instances with an id; the twelve `JWEASJXE` covered
   carry `null`, which is the honest answer.

### What this archive does *not* evidence

It is a record of ticketed event attendance and nothing else. It says nothing
about, and must never be used to support:

- `members.current` (3,500) or `sponsors.current` (50)
- anything in the mentorship block
- `impact.careerTransitions` (500) or `impact.workshopAttendees` (5,000)
- the `/about` membership timeline

That last one deserves stating plainly, because a 5,156-ticket archive is
exactly what somebody will reach for to justify "5,000+ women empowered".
**5,156 tickets held by 2,919 people is not 5,000 people.**

---

## Running it

```bash
# Record provenance for a new export dropped into private/humanitix/<id>/
npx tsx scripts/humanitix/manifest.ts --export 2026-08-17 --append
npx tsx scripts/humanitix/manifest.ts --export 2026-08-17            # verify hashes

# Prove the export reconciles against itself before building anything from it
npx tsx scripts/humanitix/verify-export.ts --export 2026-08-17

# Rebuild the derived archive
npx tsx scripts/humanitix/build-archive.ts --export 2026-08-17 --check   # what would change
npx tsx scripts/humanitix/build-archive.ts --export 2026-08-17

# Hold it to its own invariants (this is what CI runs)
npx tsx lib/data/humanitix.test.ts

# Land figures on the site's event records. Three separate acts, three opt-ins.
npx tsx scripts/data/apply-humanitix-attendance.ts                        # dry run, gaps only
npx tsx scripts/data/apply-humanitix-attendance.ts --apply                # fill what was never recorded
npx tsx scripts/data/apply-humanitix-attendance.ts --apply --corrections  # overwrite what is wrong
npx tsx scripts/data/apply-humanitix-attendance.ts --apply --unscanned    # placeholder 0 -> null

# Paste-ready Typst for the funder report (prints to tmp/, never edits report/)
npx tsx scripts/humanitix/report-metrics.ts
npx tsx scripts/humanitix/top-employers.ts
```

### What was landed on 2026-08-17

| Change | Records |
|---|---|
| Registrations filled where the site had none | 3 |
| Registrations corrected against the export | 4 |
| Check-in counts corrected | 2 |
| Placeholder `checkedIn: 0` turned into `null` on events that ran no check-in | 19 |
| Published event date corrected | 1 |

The last row is the largest and the least visible. `checkedIn` renders nowhere
today, so a wrong 0 costs nothing until something reads it — which is exactly
what happened when the May 2026 HER WAKA cohort's 0 reached the funder report
and had to be flagged by hand as **THE DANGEROUS ONE**. There were nineteen more
of those.

### Re-importing a later export

Humanitix reports are cumulative: a newer export is a superset and **supersedes**
the previous one. The derived files are a pure function of (vault, authored
files), so they are regenerated whole. **There is never a merge.**

Five assertions make a re-run safe rather than merely possible:

1. Every file's sha256 must match the manifest before a row is parsed.
2. Every ticket-type string must match a `segments.json` rule; an unclassified
   one is named and fatal.
3. Every instance must appear in `crosswalk.json`; a new event fails the build
   rather than being skipped.
4. `--check` reproduces the committed bytes exactly when nothing has changed.
5. The manifest is append-only, so an old export's provenance survives its vault.

### What runs where

`verify-export.ts` needs the vault, so **it never runs on CI**. Invoked without
one it exits non-zero; `--allow-missing-vault` makes it print `SKIP` and exit 0,
which has to be asked for — a verify script that passes with nothing to verify is
worse than no verify script.

`lib/data/humanitix.test.ts` reads only the committed JSON — no vault, no
network — and runs in CI alongside the image-path checks. It holds the archive
to its own totals, requires every mapped slug to resolve through
`lib/data/events.ts`, and refuses to let an address or a code-shaped value reach
`lib/data/json/humanitix/`.

---

## Why this is not in the database

`lib/db/schema/events.ts` declares `eventRegistrations.userId` as a `notNull`
foreign key to `users`. Loading 5,156 tickets would mean fabricating ~2,919
`users` rows, which would flow into auth, `user_memberships`, the admin UI, and
every `SELECT email FROM event_registrations` — precisely the query
`consent-rules.md` says cannot produce a mailing list. `events.createdBy` is
`notNull` too, and the site's event archive is JSON rather than database rows, so
there are no event records to attach registrations to.

Three things would have to exist before that decision is worth revisiting:

1. A runtime feature that genuinely needs per-person history.
2. A retention rule for the table, modelled on
   `lib/forms/event-feedback-retention.ts` (anonymise rather than delete;
   Privacy Act 2020 IPP 9).
3. A written decision, against `consent-rules.md`, about what a row in that
   table does and does not permit.

Until then the archive is aggregate-only, and no per-person record is committed.

---

## Known gaps and open items

| Item | Status |
|---|---|
| **Event summary report was missing** from the first export even though the operator's note ticked it as taken. | **Closed 2026-08-18** — re-exported and imported. It supplies the Event ID, organiser and venue for every event, and independently confirms sold and checked-in per instance. The gap entry is kept rather than deleted, because the discrepancy between what an export session believes it captured and what it captured is the thing worth remembering. |
| **Twelve 2021–22 instances have no Humanitix Event ID.** Their only identifier is the account-level `JWEASJXE`. | Not fixable from an export — Humanitix itself never recorded a distinct id for them. They carry `null`. |
| **The 2023 MYOB event was published under the wrong date** — 12 April against Humanitix's 28 April. | **Corrected 2026-08-18** by `scripts/data/fix-myob-2023-event-date.ts`. Three sources agreed on 28 April: the Event summary, ticket sales running to 28 April with the final order on the day itself, and the record's own `detailPageData.dateTime` ("Fri, 28 Apr 2023" — and 12 April was a Wednesday). A scrape artefact: listing and detail page disagreed and the scraper took the listing. |
| **`checkedIn` is rendered nowhere.** No component reads it. If one is ever added it must read `checkInDataPresent` first — 26 of 62 instances would otherwise render a hard `0`. | Field is in `events.json` for exactly that reason. |
| **Seat fill is 42%** (5,107 sold against 12,078 capacity). A real number, and an unflattering one. | In `aggregates.json`. Whether it belongs in a funder report is an organisational decision, not a data one. |
| **The access-code report's event attribution looks offset.** | Not relied on. Only the distinct-code count and use count are derived from it. |

---

## Related

- `docs/development/CONTENT_RULES.md` — the counting conventions this archive
  follows, including `attendees` = registrations
- `docs/development/PUBLIC_CLAIMS_PROVENANCE.md` — the SOURCED/UNSOURCED ledger
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the only
  gate on sending anything to anyone
- `report/data/report-data.typ` — the funder report's single swap surface
