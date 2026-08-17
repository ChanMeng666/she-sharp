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
| Derived | Counts, tag vocabulary, crosswalk, checksums | `lib/data/json/mailchimp/` | Yes |
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
  tag-rules.json    AUTHORED   how a tag string becomes a kind
  crosswalk.json    AUTHORED   each `Event:` tag → a site event slug
```

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
2025: 322, 2026: 41. It is recruitment per year, **not list size in that year**,
and the difference cannot be recovered: an unsubscribe records when someone left,
never which cohort they joined in. 599 contacts have no `OPTIN_TIME` at all and
appear in no year.

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
   list somebody pasted into Mailchimp, not a scanned check-in.
   **`lib/data/humanitix.ts` is authoritative for who turned up.** The two
   archives describe overlapping people and answer different questions.

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
   people reading mail. Nothing in this export measures whether anyone opened
   anything — that lives in the account-level ZIP, which has not arrived.

### What this archive does *not* evidence

- **Reach.** 3,689 contacts is not an audience of 3,689, and 1,560 subscribers
  is a list size, not a readership.
- **Attendance.** Use the Humanitix archive.
- **Membership or community size.** A tagged address is not a member, and the
  repo's `users` table is a different population again.
- **Engagement of any kind**, until the account ZIP lands.

## Running it

```bash
npx tsx scripts/mailchimp/manifest.ts      --export 2026-08-17 --append
npx tsx scripts/mailchimp/manifest.ts      --export 2026-08-17            # re-hash
npx tsx scripts/mailchimp/verify-export.ts --export 2026-08-17
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17 --check    # diff only
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17
npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17 --check    # must be empty
npx tsx lib/data/mailchimp.test.ts
npx tsx scripts/mailchimp/propose-crosswalk.ts                            # drafts to tmp/
```

The last `--check` is the determinism test: a second check immediately after a
build must report no changes, or the builder is emitting a timestamp or an
unsorted map.

### What runs where

`manifest`, `verify-export` and `build-archive` need the vault and therefore
**never run on CI**. `lib/data/mailchimp.test.ts` reads only committed JSON and
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
Mailchimp to Resend". The other half is the import itself, which has **not** been
run. What is already done:

- The 2,129 non-subscribers are in the suppression register, so
  `normalize-recipients.ts` — which consults it on every import — cannot re-add
  them. This had to land *before* any import, or the diff would report a clean
  suppression bucket that was a lie.

What the import session still needs to know:

- **Consent** is route 1 of `consent-rules.md` (the website newsletter sign-up,
  linked from 16 places on the site for years). Record
  `--consent-source "Mailchimp audience 'She#' — website newsletter sign-up; per-contact OPTIN_TIME preserved in the 2026-08-17 export archive"`
  and `--consent-date 2026-08-17`. Per-contact opt-in dates stay recoverable
  from the archived CSV.
- **`--for-import` will not drop rows here.** It filters on an opt-in column
  only when one is mapped, and the Mailchimp export has none, because the file
  *is* the opt-in.
- **`--column-map` is mandatory** — the export uses `Email Address`,
  `First Name`, `Last Name`.
- **Decide the segment name first.** The target today is `RESEND_NEWSLETTER_SEGMENT_ID`,
  named "Newsletter Pilot" — the name 1,560 real subscribers would land under.
  Resend has no segment update endpoint, so renaming means delete and recreate,
  which drops membership.

## Known gaps and open items

| Item | Status |
|---|---|
| Account-level ZIP (campaign statistics, templates, audience history) | Triggered 2026-08-17, **not yet arrived**. One export per 24 hours. Recorded as `claimedExported: true, present: false` |
| Per-campaign per-recipient opens/clicks (209 campaigns) | Deliberately skipped — 209 manual exports. Blocks the "recent openers" sub-segment the migration runbook wants for the first send |
| Automations, signup-form designs, landing pages | **Not in any Mailchimp export.** Must be screenshotted before the account is closed |
| Mailchimp credentials | `SECURITY/credentials-to-rotate.md` Tier 1 #1 in the private repo — password plus a 2FA QR pinned in Slack. Unrotated. This archive raises what that costs |
| The subscribe funnel | Still Mailchimp's. `EMAIL_AUTHENTICATION.md` item 8b |

## Related

- `docs/deployment/EMAIL_AUTHENTICATION.md` — the migration runbook this feeds
- `docs/development/EMAIL_OPERATIONS.md` — how mail is actually sent
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the gate on
  every send, which nothing in this archive overrides
- `docs/development/HUMANITIX_ARCHIVE.md` — the same pattern, the same people,
  a different question
- `she-sharp-slack-archive/mailchimp/README.md` — the raw files and their rules
