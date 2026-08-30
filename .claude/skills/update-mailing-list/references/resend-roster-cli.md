# The roster is no longer in Resend — read this before running a `resend contacts` command

**Superseded 2026-08-29.** This file used to be the working manual for managing
She Sharp's mailing list with `resend contacts`, `resend segments` and
`resend topics`. Those commands still work, and running them against this
account will still produce confident, well-formatted output. **That output is no
longer the mailing list**, and reporting it as such is now the most likely way to
give someone a wrong answer about who She Sharp may email.

## What replaced it

The marketing consent record is the **`newsletter_subscribers` table** in this
project's own Postgres database. A row with `status = 'subscribed'` is a
subscriber; nothing else is. `references/consent-rules.md` is the rule, and
`SKILL.md` is the procedure.

| You want to | Use |
|---|---|
| Read the list | `npx tsx scripts/email/inspect-subscribers.ts --limit 50` |
| Look one person up, with their consent provenance | `npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com` |
| See every address list She Sharp holds, by tier | `npx tsx scripts/email/audience-report.ts` |
| Check the do-not-contact registers | `npx tsx scripts/email/suppression.ts check someone@example.com` |
| Stop mailing someone | `npx tsx scripts/email/suppression.ts add someone@example.com --reason "asked to be removed"` |
| See whether the stores have drifted apart | `npx tsx scripts/email/suppression.ts reconcile` |
| Build a send's recipient list | `npx tsx scripts/email/recipients-from-db.ts --key <k>` |

Every one of those masks addresses (`j****@gmail.com`) or prints truncated
hashes, so the output is safe to paste into a PR or Slack.

This skill's own `scripts/diff-roster.ts` went with the rest, deleted 2026-08-30:
it diffed a recipient file against the Resend roster, and the last two rows of
that table answer what it used to answer. `scripts/roster-state.ts` stays — it
logs which *files* have been imported, by sha256, and never touched Resend.

`audience-report.ts` still accepts `--include-resend` and will still report a
Tier 0 count from Resend. **That number is zero and means nothing.** Quote the
database instead.

## The Resend objects are gone

They were recreated on 2026-08-28 when the domain and sending setup moved to the
She Sharp–owned Resend team (**shesharp**, owned by `website@shesharp.org.nz`),
and **deleted on 2026-08-29** — segment `95d452f5…` and topic `08e59693…`, both
holding nobody at the time, with their two env vars taken off Vercel production
in the same change. Nothing in this repo reads a Resend segment or topic any
more. This section used to say the deletion was still waiting on the maintainer;
it is not. `consent-rules.md` records the same fact as a consent statement:
nothing in Resend is the consent record, the `newsletter_subscribers` table is.

| Object | Name | ID |
|---|---|---|
| Segment | Newsletter | `95d452f5-2eed-4ad4-b18e-5ff5a89a576b` |
| Segment | General (team default) | `9d195cb7-f7fc-49e0-9b88-e47c1741e720` |
| Topic | Monthly Newsletter | `08e59693-29dc-4556-8357-866dea047c6f` |

They are listed here so that finding them in a Vercel env var is not mistaken for
evidence that the migration did not happen. As of 2026-08-29 the **code** that
read them is deleted — `lib/newsletter/resend-api.ts` and the two
`scripts/newsletter/` scripts that imported it are gone, and
`RESEND_NEWSLETTER_SEGMENT_ID` / `RESEND_NEWSLETTER_TOPIC_ID` are out of
`.env.example`. Nothing in this repo can reach a segment or a topic any more.
Those two variables are **still set on Vercel production**, awaiting the same
approval as the objects themselves.

Do not import contacts into them. Do not add anyone to them "so both are in
sync" — two consent records that can disagree is precisely the situation the
migration removed.

## Resend is still the sender

None of this makes the CLI obsolete in general. Resend remains the transactional
and bulk **sending** provider, and the send path is unchanged:

```powershell
resend whoami
resend emails batch --file "<batch file>" --idempotency-key <key> --batch-validation strict
```

Those batch files are built by `scripts/email/build-batch.ts` and
`scripts/newsletter/build-newsletter-batch.ts`, which print the exact commands
to run. `resend emails batch` has **no `--dry-run`** (only `resend emails send`
does), so the file it is handed is the send. Sending is not this skill's job —
see `email-the-community` and `monthly-newsletter`.

The webhook at `app/api/webhooks/resend/route.ts` is also still live and still
matters: it is what turns a bounce or a spam complaint into a `bounced` or
`complained` status on the subscriber row, and a row in `email_optouts`.

## Why the move happened

Three reasons, all of which are also reasons not to drift back:

1. **The consent record belongs to She Sharp.** In Resend it lived inside a
   vendor's segment membership, readable only through their API, and it moved
   teams once already. In `newsletter_subscribers` it is ours, queryable, and
   backed up with everything else.
2. **Resend stores the contact, not the consent.** It could never answer "why is
   this person on our list?" — the question `consent-rules.md` exists to make
   answerable. The table stores `source`, `consentSource`, `consentDate`,
   `confirmedAt`, and the IP and user agent for website sign-ups.
3. **Double opt-in needs a `pending` state that Resend has no shape for.** A
   contact is in a segment or it is not. A row can be `pending` for a week and
   then expire, which is exactly what an unclicked confirmation link should do.

## The two traps worth carrying over

They were the most common ways to get a wrong answer from the CLI, and the
database versions rhyme:

- **`--limit` defaulted to 10.** Running `resend contacts list --json` on a list
  of 400 confidently reported 10. `inspect-subscribers.ts --limit` defaults to
  **20** and its closing count is the number of rows *shown*, not the size of
  the list. Raise it past the row count before quoting a number.
- **A contact import had no undo, and `--on-conflict upsert` silently
  resurrected people who had unsubscribed.** There is still no undo. The
  Mailchimp carry-over (`scripts/email/import-mailchimp-subscribers.ts`, run once
  on 2026-08-29, 1,545 rows) answers `upsert` by consulting both suppression
  registers before writing — 15 of the 1,560 rows it read were held back on
  exactly those grounds — and by defaulting to a dry run, so the write takes a
  spelled-out `--apply`. The standing rule is in code either way:
  `selectMailable()` lets a *later confirmation* beat an earlier suppression, and
  lets nothing at all beat a complaint. **There is still no general CSV
  importer** — that script reads the Mailchimp `subscribed` export and refuses
  anything else.
