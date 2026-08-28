# Resend CLI — roster management

Practical notes for managing She Sharp's contacts, segments and topics with the
`resend` CLI (`resend-cli v2.8.1`). Every command here has been run against the
live account; the flags are from the CLI's own `--help`, not from memory.

Confirm authentication first with `resend whoami` — it prints
`"authenticated": true`, the profile, a masked key and the permission level. A
`full_access` key can write; a `sending_access` key cannot manage contacts.

## The three objects, and how they relate

**Contacts are global.** Since the 2025 migration they are not scoped to
anything — one record per email address for the whole team. `resend contacts
--help` states it outright: *"Contacts are global entities (not audience-scoped
since the 2025 migration)."* Both a UUID and an email address are accepted as
the id in every subcommand.

**Segments replaced Audiences.** A segment is a named group of contacts, and a
broadcast targets a `segment_id`. A contact can belong to several. There is **no
segments update endpoint** — to rename one you delete and recreate it, which
drops the membership, so name segments carefully the first time.

**Topics are per-subscription preferences.** A contact opts in or out of each
topic independently. A broadcast can target a `topic_id` so only opted-in
contacts receive it; contacts with no explicit record inherit the topic's
`default_subscription`.

The two opt-out mechanisms are not the same thing: `--unsubscribed` on a contact
is a **team-wide** opt-out from all broadcasts, while a topic `opt_out` silences
that one topic only.

She Sharp's live objects (Resend team **shesharp**, owned by
`website@shesharp.org.nz`; re-verified 2026-08-28 after the account move):

| Object | Name | ID |
|---|---|---|
| Segment | Newsletter | `95d452f5-2eed-4ad4-b18e-5ff5a89a576b` |
| Segment | General (team default — empty, nothing uses it) | `9d195cb7-f7fc-49e0-9b88-e47c1741e720` |
| Topic | Monthly Newsletter | `08e59693-29dc-4556-8357-866dea047c6f` |

**Every id above changed on 2026-08-28**, when the domain and the sending setup
moved from the maintainer's personal Resend team to the She Sharp–owned one.
Segments and topics do not travel with a domain claim, so these were recreated;
the team holds **0 contacts** and nothing has been imported.

Re-read them rather than trusting this table:

```powershell
resend segments list --json
resend topics list --json
```

## Reading the roster

```powershell
resend contacts list --limit 100 --json
resend contacts get someone@example.com --json
resend contacts segments someone@example.com
resend contacts topics someone@example.com
resend segments contacts 95d452f5-2eed-4ad4-b18e-5ff5a89a576b --limit 100 --json
```

**`--limit` defaults to 10 and caps at 100.** This is the single most common way
to get a wrong answer from this CLI: run `resend contacts list --json` on a list
of 400 and you will confidently report 10. Page with `--after <contact-id>`
until `has_more` is `false`:

```json
{"object":"list","has_more":false,"data":[{"id":"…","email":"…","unsubscribed":false}]}
```

`diff-roster.ts` in this skill does that paging for you and masks the addresses.

## Importing a CSV

The import is **asynchronous**: `create` returns an id immediately and processes
the file in the background.

```powershell
resend contacts imports create --file .\tmp\csv\attendees.local.csv `
  --column-map '{"email":"E-Mail Address","firstName":"Given Name","lastName":"Family Name"}' `
  --on-conflict skip `
  --segment-id 95d452f5-2eed-4ad4-b18e-5ff5a89a576b `
  --topics '[{"id":"08e59693-29dc-4556-8357-866dea047c6f","subscription":"opt_in"}]'
```

Returns `{"object":"contact_import","id":"<id>"}`. Then poll
`resend contacts imports get <id> --json` until `status` is terminal. Statuses
are `queued`, `in_progress`, `completed`, `failed` (the same set
`imports list --status` accepts). A finished import carries counts:

```json
{"object":"contact_import","id":"…","status":"completed",
 "counts":{"total":1200,"created":800,"updated":300,"skipped":75,"failed":25}}
```

Poll every few seconds; a small file completes almost immediately. **Never
assume completion** — an import that fails silently looks exactly like one that
was never checked.

### `--column-map`

Without it, columns are matched **case-sensitively** against the lowercase names
`email` (required), `first_name`, `last_name`. A header of `Email` or
`First Name` fails. Since no real ticketing export uses those exact headers,
**always pass `--column-map`**.

The JSON maps contact field → CSV header (field on the left, your column on the
right — the direction people get backwards). Supported keys: `email`,
`firstName`, `lastName`, `unsubscribed`, and `properties` for custom columns:

```json
{"email":"E-Mail Address","firstName":"Given Name",
 "properties":{"org":{"column":"Organisation","type":"string"}}}
```

Properties are readable in broadcast templates via triple-brace interpolation
(`{{{ORG|there}}}`); `firstName`/`lastName` are aliases stored as `FIRST_NAME` /
`LAST_NAME`. In PowerShell, single-quote the JSON so `$` and `"` survive.

### `--on-conflict upsert` vs `skip`

`upsert` (the default) updates contacts that already exist; `skip` leaves them
untouched.

**Prefer `skip` for attendee imports.** `upsert` will happily overwrite an
existing contact's fields — including resurrecting someone who unsubscribed,
because the attendee CSV has no idea they did. Use `upsert` only when the file
is deliberately a correction (fixing misspelled names on contacts you know are
current), and only after `diff-roster.ts` shows an empty `unsubscribed` bucket.

### There is no batch undo

Nothing rolls an import back. The only remedy is one delete per contact —
`resend contacts delete someone@example.com --yes` (`--yes` is **required** in
non-interactive mode). Deleting 300 mistakenly imported contacts means 300
calls, which is why the plan-then-confirm flow in `SKILL.md` exists.

## Subscription state and segment membership

```powershell
# Team-wide opt-out (what an unsubscribe link sets)
resend contacts update someone@example.com --unsubscribed

# Per-topic — replaces ONLY the topics named in the array
resend contacts update-topics someone@example.com `
  --topics '[{"id":"08e59693-29dc-4556-8357-866dea047c6f","subscription":"opt_in"}]'

resend contacts add-segment someone@example.com --segment-id 95d452f5-2eed-4ad4-b18e-5ff5a89a576b
resend contacts remove-segment someone@example.com 95d452f5-2eed-4ad4-b18e-5ff5a89a576b
resend contacts segments someone@example.com
```

Note the asymmetry: `add-segment` takes the segment as `--segment-id`, while
`remove-segment` takes it as a **positional second argument**. Membership is
also settable at import time with `--segment-id` (repeatable).

**Never use these to re-subscribe someone who opted out.** Technically the CLI
will do it; see `consent-rules.md` for why you must not. The only legitimate
re-entry is the person using the website form.

## Creating objects

```powershell
resend segments create --name "Newsletter Subscribers" --json
resend topics create --name "Event Announcements" --default-subscription opt_out --json
resend contacts create --email someone@example.com --first-name Ada --json
```

Prefer `default-subscription opt_out` for any new topic: silence until someone
actively opts in is the behaviour you want to be wrong in.

## Error strings and what to do

Errors come back as `{"error":{"message":"…","code":"…"}}` on stderr with exit
code 1. Documented codes for imports: `auth_error`, `missing_file`,
`file_read_error`, `invalid_column_map`, `invalid_topics`, `create_error`.

| What you see | Cause | Fix |
|---|---|---|
| `resend: command not found` / `ENOENT` | CLI not on PATH | `npm i -g resend-cli`, then `resend login` |
| `auth_error` | No saved key, or a `sending_access` key | `resend login` with a `full_access` key; confirm with `resend whoami` |
| `missing_file` / `file_read_error` | Wrong path, or a Windows path mangled by quoting | Use an absolute path; single-quote it in PowerShell |
| `invalid_column_map` | Malformed JSON, or a header that isn't in the CSV | Echo the header row and compare byte-for-byte, including trailing spaces |
| Import `completed` with `created: 0`, `failed: <all>` | No `--column-map` and headers aren't lowercase `email` | Re-run with `--column-map` |
| `invalid_topics` | Topic JSON isn't `[{"id":"…","subscription":"opt_in"}]` | Check the array shape and that `id` is a real topic UUID |
| `confirmation_required` on delete | Non-interactive without `--yes` | Add `--yes` |
| Import stuck `queued` / `in_progress` | Normal for a large file | Keep polling `imports get`; check `imports list --status failed` before re-uploading — a second upload double-imports |
| Contact count looks far too low | `--limit` defaulted to 10 | Page with `--after` until `has_more` is false |

## Things the CLI will not tell you

- **Why** a contact is on the list — Resend stores the contact, not the consent.
  That is what `state/roster.json` and its `--consent` statement are for.
- Whether an address is on the hashed suppression register — that is local
  (`npx tsx scripts/email/suppression.ts check <email>`).
- Whether importing is *allowed*. The CLI is a tool, not a gate; the gate is
  `references/consent-rules.md`.
