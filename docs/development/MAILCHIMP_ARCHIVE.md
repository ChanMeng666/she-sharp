# The Mailchimp audience archive

She Sharp's newsletter went out from Mailchimp from July 2019 until the move to
Resend. On 17 August 2026 the audience `She#` was exported by hand, in the five
files Mailchimp produces: one per subscription status, plus archived contacts.

**3,689 contacts. 1,560 of them are the mailing list. The other 2,129 left,
hard-bounced, or never subscribed at all.** Keeping those two numbers apart is
most of what this archive is for.

The export also carries 229 tags recording which event each person came through,
which makes it the only per-person record of how the organisation's reach was
built — and, because every row is somebody's contact details, a file that can
never be committed.

## The three tiers

| Tier | What | Where | Committed? |
|---|---|---|---|
| Raw | The five CSVs, verbatim | `she-sharp-slack-archive/mailchimp/2026-08-17/` (master), `private/mailchimp/2026-08-17/` (cache) | **Never** |
| Raw | The five API responses, verbatim | `private/mailchimp/2026-08-27-api/` | **Never** |
| Derived | Counts, tag vocabulary, crosswalk, campaign statistics, checksums | `lib/data/json/mailchimp/` | Yes |
| Access | Typed reader | `lib/data/mailchimp.ts`, `types/mailchimp.ts` | Yes |

### Why the raw data is not in git

Every row of every input file is a real person: name, employer, and for many of
them a phone number, a street address, and **the IP address they signed up
from**. An IP plus a timestamp is a location record for the moment somebody
joined a women-in-tech mailing list, which is not information any of them
thought they were giving.

There is no redacted version worth having. A Humanitix export has columns you
can drop; a Mailchimp audience export *is* the addresses. So the split is
absolute: raw data never enters this repository, and what is committed contains
no address, no IP, no phone number, and no per-contact identifier.

`.gitignore` already covered it — `/private/` was added for the Humanitix vault
and needed no change.

### The vault here is a cache. The master copy is elsewhere.

`private/` is gitignored, so git does not back it up and `git clean -xdf`
deletes it. The archive of record is the private `she-sharp-slack-archive`
repository under `mailchimp/<export-id>/`, which is where the organisation's
unredacted record is allowed to live. Point the scripts at either:

```bash
export MAILCHIMP_VAULT_DIR="D:/github_repository/she-sharp-slack-archive/mailchimp/2026-08-17"
npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17
```

Every file's sha256 is in the committed manifest, so the two copies can be
proved identical without either trusting the other.

## What is committed

```
lib/data/json/mailchimp/
  manifest.json     GENERATED  provenance: per-file sha256, rows, columns, PII class, known gaps
  aggregates.json   GENERATED  every count in this document
  tags.json         GENERATED  all 243 tag strings with per-status counts and a kind
  campaigns.json    GENERATED  180 sends with opens/clicks/bounces, plus the list-size series
  tag-rules.json    AUTHORED   how a tag string becomes a kind
  crosswalk.json    AUTHORED   each `Event:` tag → a site event slug
```

`campaigns.json` comes from the **API pull**, not the CSV export, and is built
by `scripts/mailchimp/build-campaigns.ts` — a separate script from
`build-archive.ts` because its `--export` names a different kind of thing
(`2026-08-27-api`, not `2026-08-17`), and one flag meaning two things is how a
build succeeds against data it was never pointed at.

It is the one committed file carrying **free text**: each campaign's `title` and
`subjectLine`. Both are already public — every subject line here is on the
account's own archive at `us3.campaign-archive.com` — and the builder re-runs
the CI leak guard's own email and IP patterns over both before writing, failing
the build on a hit and naming the campaign id rather than the string. No
`from_name` and no `reply_to` is ever mapped: those carry the organisation's
mailboxes, and `lib/mailchimp/client.ts` already refuses to project them.

**GENERATED files are rebuilt wholesale and must never be hand-edited.**
AUTHORED files are judgements, and the builder never writes them — a
regeneration must not be able to overwrite a decision a person made.

There is **no per-contact file**, in any tier, by construction. The Humanitix
archive commits `events.json` because its unit of record is an event; Mailchimp's
unit of record is a person, so the only committable artefact is a count.

## Metric definitions

**contacts — 3,689.** Distinct addresses across the four status files. The files
are a partition: Mailchimp gives a contact exactly one status, and
`verify-export.ts` asserts no address appears in two.

**contactsPerMailchimpUi — 3,145.** What Mailchimp's own dashboard reports. It
excludes the 544 `cleaned`. See trap 2.

**subscribed — 1,560.** The only figure that is a mailing list.

**suppressed — 2,129.** `unsubscribed` (803) + `nonsubscribed` (782) +
`cleaned` (544). All 2,129 are recorded as sha256 hashes in
`lib/data/json/email-suppression-hashes.json`.

**byOptinYear.** Contacts whose `OPTIN_TIME` falls in that year, across every
status — 2019: 297, 2020: 346, 2021: 323, 2022: 594, 2023: 820, 2024: 347,
2025: 322, 2026: 41. It is recruitment per year, **not list size in that year**.
599 contacts have no `OPTIN_TIME` at all and appear in no year.

**The CSV still cannot produce list size in a past year** — an unsubscribe
records when somebody left, never which cohort they joined in, so the two
numbers cannot be reconciled inside this file. But the series itself is not
lost: Mailchimp kept a monthly snapshot server-side, and
`GET /lists/{id}/growth-history` returns it. It is committed as
`campaigns.json` → `growth[]` and read through `listSizeByMonth()`. See
**growth** below.

**growth.** 86 months, July 2019 to August 2026, gapless. **`subscribed` is a
STOCK — subscribed members at the END of that month, not that month's
additions**, which is the opposite of what the field name suggests and the
single most likely way to mis-read this series. It is therefore **not
monotonic**: 157 in July 2019, 1,093 by December 2022, 1,573 by December 2023,
1,716 by December 2025, a peak of **1,742 in November 2025**, and **1,555 in
August 2026**. The list has been shrinking through 2026.

Mailchimp's documented growth fields — `existing`, `imports`, `optins` — are
**hard zero in all 86 months** of this account and are deliberately not
committed. A committed zero is worse than an absent field, because somebody
will chart it.

**domains / organisations.** Buckets of at least **5** contacts are named; below
that they are counted and suppressed, because a bucket of one is a person. 660
distinct domains, 568 of them below the floor. Employers resolve through the
**shared** registry in `lib/data/json/humanitix/organisations.json` — the same
freehand strings describe the same employers in both exports, and a second
registry would drift. Anything that turns out to be a registrant's own name is
dropped by `isPersonalName()`, the same guard the Humanitix archive uses.

**consentSignals.** Counts, never a verdict. Of the 1,560 subscribed: 861 carry
an `OPTIN_IP`, **0 carry a `CONFIRM_IP`**, and 1,431 have `OPTIN_TIME` equal to
`CONFIRM_TIME`. See trap 7.

**tags.** 243 distinct strings, of which **229 are real tags and 14 are
artefacts** of Mailchimp's own broken export (trap 6). Kinds: 106 `ticket-type`,
64 `event`, 32 `label`, 23 `campaign-segment`, 4 `cohort-year`.

**campaigns — 180 sent**, July 2019 to August 2026, **188,796 emails**, 71,493
unique opens (**37.9%**) and 5,256 unique clicks (2.8%). Not 209 and not 215:
`GET /lists` reports `campaignCount: 215`, which counts drafts and deleted
campaigns too, and the 209 in older notes here was a UI reading of the same
thing. Neither is a count of sends. Four campaigns went to fewer than **5**
people and are counted but never named — a two-person send is a description of
those two people, and in this account such sends are titled after them.

**opens after 2021.** Apple Mail Privacy Protection pre-fetches images, which
Mailchimp counts as an open, so an open rate cannot be compared across that
boundary. Every campaign carries `proxyExcludedUniqueOpens`, Mailchimp's own
correction: 62,531 against 71,493 overall, and **exactly equal to `uniqueOpens`
for every campaign sent before 2022**, because there was nothing to exclude
yet. That equality is the evidence of where the boundary falls.

**uniqueClicks counts PEOPLE.** It is Mailchimp's `unique_subscriber_clicks`,
not its `unique_clicks` — which counts unique clicks per *link* summed across
links, and so legitimately exceeds the recipient count (a two-person send here
reports 3 of them, and the account's one variate campaign reports 0 while 47
people clicked). Only a count of people may be divided by `emailsSent`.

## Eight ways to get a number wrong

Each of these is a claim the data will appear to support and does not.

1. **"3,689 subscribers."** No — **1,560**. 3,689 is every contact the account
   ever held, including 803 who unsubscribed and 544 whose address is dead. It
   is the size of a filing cabinet, not of an audience.

2. **"Mailchimp says 3,145 and the archive says 3,689, so one is wrong."** Both
   are right. The dashboard figure excludes `cleaned` contacts. 3,689 − 544 =
   3,145, exactly. `verify-export.ts` asserts this identity, because a mismatch
   means a partial download rather than a disagreement.

3. **"The mailing list has grown since 2014."** The earliest `OPTIN_TIME` in the
   export is **15 July 2019**. She Sharp was founded in 2014 and this record
   covers the last seven of those years. One tag, `Techweek 2018`, names an
   earlier occasion — it was applied retrospectively and is not evidence of a
   2018 subscriber.

4. **Contacts read as people.** Six contacts carry a `Secondary Email`, so at
   least six people appear twice. The organisation's own mailboxes are on its own
   list — the newsletter, events, people and industry addresses all subscribe.
   And a contact is not a member: `MEMBER_RATING` is 2 or below for 3,347 of the
   3,689, which is Mailchimp's way of saying it has seen little or no engagement.

5. **A `Ticket Type:` or `Event:` tag read as attendance.** It records a ticket
   somebody **bought**, not a scanned check-in.
   **`lib/data/humanitix.ts` is authoritative for who turned up.** The two
   archives describe overlapping people and answer different questions.

   Those tags are written by the **live Humanitix→Mailchimp integration**, which
   pushes each event's registrants into the `She#` audience and tags them — not
   by anybody pasting a ticket list into Mailchimp. This page said the pasting
   thing until 2026-08-30; `tag-rules.json` had the mechanism right first, and
   it is the file to believe. Humanitix documents the mapping itself: Store =
   "User account name + Currency", Product = "Event name + Event date", Product
   variant **and** Tag = "Ticket type", Tag = "Event name", Contact email =
   "Order email", FNAME/LNAME = the buyer's first and last name
   (<https://help.humanitix.com/en/articles/8888537-connect-to-mailchimp>).

   Confirmed live on 2026-08-30. Three contacts joined the audience on 27, 28
   and 28 August 2026 carrying both `Event: She Sharp & Les Mills: No Pain, All
   Gain - Getting fit for AI` and `Ticket Type: Tickets - Professionals` or
   `Ticket Type: Tickets - Students`, with `source: "Mahsa McCauley NZD"` — a
   person's name followed by the currency, which is Humanitix's documented
   `Store` mapping and nothing a human would type. The tags were there from the
   write: each contact's `last_changed` is within eleven seconds of its
   `timestamp_opt`, so nothing was added afterwards. The corroboration was
   already committed: `manifest.json`'s `ecommerce-stores` entry records three
   stores that are "artefacts of connected integrations rather than a shop: no
   platform, no domain, no orders, empty addresses, and `money_format` NZD",
   each named after a natural person.

   **`timestamp_opt` is when a person joined the list, not when a tag was
   applied**, and the two coincide above only because those three joined at
   checkout. Most contacts carrying an event tag joined years earlier and were
   tagged when they later bought a ticket. Never date a tag from an opt-in
   timestamp.

   One gap between the documentation and this account: Humanitix describes a
   bare event-name tag, while every `Event:` tag here carries the `Event: `
   prefix. The live writes above show the prefix is present on what the
   integration itself writes, so it is not a later hand-edit.

   **None of this softens the warning.** Knowing which system wrote the tag
   changes who to ask about it, not what it means: buying a ticket is still not
   turning up.

6. **`TAGS` split on commas.** The cell is a CSV document nested inside a CSV
   cell, and Mailchimp **truncates a tag at 100 characters without re-closing
   the quote** when the cut lands mid-tag. 45 of the 3,146 tagged contacts have
   a cell that is not valid CSV at all. A naive split shatters real tags —
   `Event: … A More Diverse, Inclusive & Sustainabl` becomes two — and inflates
   the vocabulary. `parseTagCell()` in `scripts/mailchimp/csv.ts` parses the
   grammar by hand and reports the malformation; the 14 resulting garbage
   strings are marked `kind: "fragment"` **by provenance**, not by pattern, so
   the classification self-heals if Mailchimp ever fixes the export.

7. **`CONFIRM_TIME` read as proof of double opt-in.** It equals `OPTIN_TIME` on
   1,431 of the 1,560, and `CONFIRM_IP` is empty for **every contact in the
   export**. That is the signature of a single opt-in, which Mailchimp records
   this way too. It does not make the consent invalid — but this export cannot
   be cited as evidence of confirmed double opt-in, and nothing here overrides
   `.claude/skills/update-mailing-list/references/consent-rules.md`.

8. **`LAST_CHANGED` read as engagement.** 1,441 of the 3,689 changed during 2025
   and 357 during 2026. That is the signature of a bulk tag operation, not of
   people reading mail. Nothing in the **CSV** export measures whether anyone
   opened anything. That evidence now exists, but it is in `campaigns.json`,
   from the API pull — and it is **per campaign**, never per person. It says
   500 people opened an email; it cannot say which 500, and nothing in this
   repository can.

### What this archive does *not* evidence

- **Reach.** 3,689 contacts is not an audience of 3,689, and 1,560 subscribers
  is a list size, not a readership.
- **Attendance.** Use the Humanitix archive.
- **Membership or community size.** A tagged address is not a member, and the
  repo's `users` table is a different population again.
- **Per-person engagement.** `campaigns.json` evidences engagement *per
  campaign* — sends, opens, clicks, bounces, unsubscribes. Who opened what is a
  separate per-campaign export that was never taken; see the known gaps.
- **Readership.** An open is a pixel load, and after 2021 often a machine's.
  Use `proxyExcludedUniqueOpens` and say which one you used.

## Running it

```bash
npx tsx scripts/mailchimp/manifest.ts      --export 2026-08-17 --append
npx tsx scripts/mailchimp/manifest.ts      --export 2026-08-17            # re-hash
npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17 --check    # diff only
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17 --check    # must be empty
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-27-api --check
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-27-api
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-27-api --check   # must be empty
npx tsx lib/data/mailchimp.test.ts
npx tsx scripts/mailchimp/propose-crosswalk.ts                            # drafts to tmp/
```

The last `--check` is the determinism test: a second check immediately after a
build must report no changes, or the builder is emitting a timestamp or an
unsorted map.

### What runs where

`manifest`, `verify-export`, `build-archive` and `build-campaigns` need the
vault and therefore **never run on CI**. `lib/data/mailchimp.test.ts` reads only committed JSON and
runs on every PR. `verify-export.ts --allow-missing-vault` exists but must be
asked for: a verify script that passes with nothing to verify is worse than no
verify script.

### Re-importing a later export

**A Mailchimp export is a snapshot, not a cumulative report.** This is the one
place the pattern differs from Humanitix, and getting it backwards loses data.
Someone `subscribed` today may be `unsubscribed` next time, and someone deleted
from the account vanishes from every future export. So a newer export **does not
supersede** this one — it supplements it. Add a new dated directory, never edit
or delete an old one, and let `manifest.json` accumulate `exports[]` entries.

Five assertions hold on a re-run: sha256 before parsing; the four status files
must partition the address space; the UI-count identity must still hold; every
tag must match a rule (fatal); every `Event:` tag must appear in the crosswalk
(fatal).

## Why this is not in the database

The same reason the Humanitix archive is not: the running application should have
no path to a real address. There is also nothing to serve — no page, route,
chatbot tool or report reads this archive today, by decision. It exists to be
read by people and cited with provenance.

The one thing that *did* cross into the running system is the suppression
register, and it crossed as 2,129 sha256 hashes carrying no address.

## The Resend migration

This archive is one half of the work in
`docs/deployment/EMAIL_AUTHENTICATION.md` §"Migrating the newsletter from
Mailchimp to Resend". **The other half — the import — ran on 2026-08-29**, and
this archive is what it read. What is done:

- The 2,129 non-subscribers went into the suppression register first, so no
  import could re-add them. This had to land *before* any import, or the diff
  would have reported a clean suppression bucket that was a lie.
- **The `subscribed` export was imported into `newsletter_subscribers`** by
  `scripts/email/import-mailchimp-subscribers.ts`: **1,560 rows read, 15 held
  back by the register, 0 malformed, 1,545 written**, each carrying
  `source = 'mailchimp-import'` and a real `confirmedAt` from `CONFIRM_TIME`.
  **Nothing has been sent** — the live newsletter still goes out from Mailchimp.

The archive's role in that import, worth keeping because it is the evidence
behind 1,545 rows of consent:

- **Consent** is route 1 of `consent-rules.md` (the website newsletter sign-up,
  linked from the site for years). Every imported row records
  `--consent-source "Mailchimp audience 'She#' — website newsletter sign-up; per-contact OPTIN_TIME preserved in the 2026-08-17 export archive"`.
  That sentence points *here*: per-contact `OPTIN_TIME` and `CONFIRM_TIME` stay
  recoverable only from the archived CSV, which is why this archive cannot be
  deleted once Mailchimp is cancelled.
- **The export's columns are the importer's contract** — it reads
  `Email Address`, `First Name`, `Last Name` and `CONFIRM_TIME` by name. Keep
  the files as exported; a re-shaped copy is not a substitute.
- **The register moved between the export and the import.**
  `suppression.ts pull-mailchimp` took it 2,129 → 2,138 (2026-08-27) → **2,144**
  immediately before the import, and six of the fifteen rows held back were
  people who had left in those twelve days. A frozen export is a snapshot of an
  afternoon; the list underneath it keeps moving.
- **No Resend segment was ever the destination — history only.** It was once an
  open decision (Resend has no segment update endpoint, so renaming means delete
  and recreate, which drops membership) and `RESEND_NEWSLETTER_SEGMENT_ID`
  pointed at a segment called "Newsletter Pilot". The 2026-08-28 account move
  recreated every segment and renamed it "Newsletter"; a day later the consent
  record moved into our own database, and that is where the 1,545 landed. The
  segment still exists in the Resend account and holds nobody. Do not read this
  paragraph as live configuration.

## What the API pull holds, and why the CSVs still matter

`2026-08-28-api/` is the maximal pull — 884 files across 47 endpoints plus **741
images**, taken because the account is being cancelled and anything not pulled
is gone. `2026-08-27-api/` was the first pass and is kept beside it; a Mailchimp
snapshot supplements, it never supersedes.

**The API does not replace the hand export**, and the first version of this
section said it did. The counts line up — `/lists/{id}/members?status=` returns
the same partition down to the five archived test rows, with `transactional`
being the API's name for the CSV's `nonsubscribed` — and so do the IPs, once you
know the names invert between the two surfaces:

| CSV column | API field | Populated |
|---|---|---|
| `OPTIN_IP` | `ip_opt` | 861 / 861 — per-address join across 1,551 contacts disagrees on **none** |
| `CONFIRM_IP` | `ip_signup` | 0 / 0 |
| `OPTIN_TIME` | `timestamp_opt` | 1,559 / 1,554 |
| `CONFIRM_TIME` | `timestamp_signup` | **1,560 / 129** |

Checking for signup IPs against `ip_signup` reads zero of 1,555 and looks
exactly like the API withholding them. It is not; it is the wrong field.

`CONFIRM_TIME` is the one that does not survive. The consent reading in this
document — confirm equals opt-in on 1,431 contacts while `CONFIRM_IP` is empty
on all of them, the signature of single rather than double opt-in — rests on a
column no pull can produce. **Keep exporting by hand.**

Left open rather than guessed at: `OPTIN_TIME` and `timestamp_opt` disagree on
the date for 220 of 1,551, most likely account-local against UTC. Unverified.

What it adds that no export produces:

| Tier | Holds | PII class |
|---|---|---|
| `content/` (180) | Every newsletter as it was sent — `html`, `plain_text`, `archive_html`. The only copy outside Mailchimp; the archive URLs die with the account | `person-identifying` |
| `engagement/` (180) | Per-send clicks-per-URL, delivery and opens per recipient domain, opens per country, shortlink referrers | `email-only` |
| `list-activity.json` | 2,054 days of daily sends/opens/clicks/subs/unsubs. `growth-history` is monthly; this is the resolution underneath | `aggregate` |
| `segments.json` | 237 objects: 214 `static` (a tag) + 23 `campaign_static` (a past send's frozen recipient set) | `aggregate` |
| `file-manager-files.json` | Inventory of the 677 gallery images. Metadata and URLs only | `none` |
| `assets/` (677) | The gallery images themselves, 547 MB, fetched by `fetch-assets.ts` | `none` |
| `campaign-images/` (64) | The images a body pulled in from outside the gallery, fetched by `campaign-images.ts` | `none` |
| `campaign-images.json` | The crosswalk — which file every image URL in every body resolves to. See below | `none` |
| `signup-forms.json` | The hosted form's header, contents, styles, URL — the wording people agreed to, as it stands today | `none` |

`content/` is `person-identifying` rather than `none` because a scan of all 180
found seven real addresses: five She Sharp role mailboxes, a partner's
recruitment address, and one named individual's personal address in the footer
of fourteen consecutive monthly issues. A five-campaign sample had suggested the
content was clean, which is why the scan runs over everything.

The vault stores **verbatim** payloads. A sha256 over a mapped object proves what
our mapper kept, not what Mailchimp said — and that distinction already cost this
archive 86 months of zeroes when `getGrowthHistory` was written from
documentation that lists three fields the us3 shard always sends as zero.

## The images, and the crosswalk that proves we have them

An HTML body full of dead `<img src>` is not an archive of a newsletter, and
`MAILCHIMP_CONFIG.archiveUrl` is a live hyperlink that stops resolving the day
the account closes. `fetch-assets.ts` downloaded the gallery; what nobody had was
the **join** between a campaign body's URL and a file on disk — the body says
`mcusercontent.com/<hash>/images/<uuid>.png` while the inventory says
`gallery.mailchimp.com/<hash>/images/<uuid>.png`. Until that join existed, "we
have the images" was a belief. `scripts/mailchimp/campaign-images.ts` measures
it and fetches what is missing:

| | |
|---|---|
| Image URLs across all 180 sent bodies | **545** (4,304 references) |
| Already in `assets/` | **460**, covering 442 of the 677 gallery files |
| Fetched into `campaign-images/` | **84 URLs → 64 distinct objects** |
| **Already lost** | **1** |
| Gallery files no surviving campaign references | 235 |

Four things worth knowing before quoting any of that:

1. **The corpus is a union of two scans, because neither is complete.** URLs
   ending in an image extension: 544. URLs in an image attribute (`src`,
   `background`, `srcset`): 544. They are not the same 544 — the union is 545.
   `plain_text` yields **zero**, which is recorded as a finding rather than
   assumed.
2. **`dim.mcusercontent.com` has two shapes and only one is an image.**
   `/cs/<hash>/images/<uuid>.png` is a gallery original at a size; `/https/<url>`
   is a proxy in front of somebody else's CDN. Not decoding the second reports 43
   lost She Sharp photographs that are Facebook and Instagram icons.
3. **Three images sit on a Mailchimp host and are NOT in the gallery** — video
   thumbnails under `video_thumbnails_new/`. That is a fact about the inventory:
   `file-manager-files.json` is not a complete list of the account's images, so
   downloading the gallery was never the same thing as having the newsletters'
   images.
4. **One image is already gone** — a Google user-content URL in the 2020-09-16
   issue, HTTP 403 with and without a browser User-Agent. It carries no file
   extension, which is why an extension-only scan never saw it. It is recorded in
   `KNOWN_LOSSES` in the script with its evidence, and the script **fails** if it
   ever starts resolving again.

Every image is recorded in `manifest.json` with its sha256, as `format: "binary"`
rows on the `2026-08-28-api` entry — 741 of them, 548 MB. Those rows carry
`sourceHost` and **never a URL**: four of the images are Slack emoji whose
filenames end `1f49c@2x.png`, and this archive's own leak guard reads an `@`
between word characters as an email address. The URLs live in the vault's
`campaign-images.json`, which is never committed.

```bash
MAILCHIMP_VAULT_DIR=…/she-sharp-slack-archive/mailchimp/2026-08-28-api \
  npx tsx scripts/mailchimp/campaign-images.ts --export 2026-08-28-api
npx tsx scripts/mailchimp/manifest.ts --export 2026-08-28-api --assets
npx tsx scripts/mailchimp/manifest.ts --export 2026-08-28-api --verify-assets
```

`--assets` **merges**; it never goes through `--append`, which is the CSV builder
and would overwrite the whole API entry with `files: []`. Verify skips the
binaries unless asked, because re-hashing 548 MB on every run is how a check
stops being run.

## Known gaps and open items

| Item | Status |
|---|---|
| Account-level ZIP (campaign statistics, templates, audience history) | **Closed 2026-08-27 — but not by the ZIP.** The API supplied the campaign statistics and the audience-size history directly, and they are committed as `campaigns.json`. Recorded in `manifest.json` as `closedBy: "2026-08-27-api"`. **Templates and landing-page content are still missing** — the API does not carry them and the ZIP is still the only source |
| Per-campaign per-recipient opens/clicks (180 campaigns) | Still open. Deliberately skipped — one manual export per campaign. Blocks the "recent openers" sub-segment the migration runbook wants for the first send. (The gap entry says 209, the count believed at the time; 180 is the number of campaigns actually sent) |
| Automations, signup-form designs, landing pages | **Not in any Mailchimp export.** Must be screenshotted before the account is closed |
| Mailchimp credentials | `SECURITY/credentials-to-rotate.md` Tier 1 #1 in the private repo — password plus a 2FA QR pinned in Slack. Unrotated. This archive raises what that costs |
| The subscribe funnel | Still Mailchimp's. `EMAIL_AUTHENTICATION.md` item 8b |

## Closing the account

The founder will cancel the Mailchimp subscription once Resend takes over.
**`docs/deployment/MAILCHIMP_DECOMMISSION.md` is the list to work through first**
— it is written to be handed to somebody who does not work in this codebase, and
three of its items cannot be undone: the hand-export of what no API reaches
(`CONFIRM_TIME`, templates, landing pages, automations, per-recipient activity),
the final `suppression.ts pull-mailchimp`, and the choice to *pause or downgrade*
rather than delete. Nothing in this archive replaces that export: what is
committed here is a summary of the account, not the account.

## Related

- `docs/deployment/MAILCHIMP_DECOMMISSION.md` — what must happen before the
  account is closed, and what is lost if it is deleted instead of paused
- `docs/deployment/EMAIL_AUTHENTICATION.md` — the migration runbook this feeds
- `docs/development/EMAIL_OPERATIONS.md` — how mail is actually sent
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the gate on
  every send, which nothing in this archive overrides
- `docs/development/HUMANITIX_ARCHIVE.md` — the same pattern, the same people,
  a different question
- `she-sharp-slack-archive/mailchimp/README.md` — the raw files and their rules
