# The Resend CLI, for a community announcement

**Read the first section before anything else on this page.** The rest of this
file used to document `resend broadcasts`, which is no longer how She Sharp
sends to its mailing list. What survives here is the part that still applies:
the batch commands, the logs, and the errors you will actually meet.

Flags below were confirmed against the installed `resend` CLI with `--help` on
2026-08-29.

## We do not use `resend broadcasts` for this any more

A broadcast targets a **Resend segment** — a list of contacts Resend holds — and
Resend attaches the one-click unsubscribe. That was the mechanism until the
newsletter moved off it.

It moved because the segment *was* the consent record. As long as "who may we
email?" was answered by an account we do not own, She Sharp had no record of its
own subscribers, could not say when any of them opted in, and could not move
platform without losing all of it. Consent now lives in the
`newsletter_subscribers` table in She Sharp's database, and mail goes out as a
**batch**: one rendered message per person, each carrying a signed unsubscribe
link this repo can verify.

So, for a community announcement:

- **Do not run `resend broadcasts create` / `send` / `get` / `delete`.**
- **Do not look up a segment id or a topic id.** There is nothing in them; the
  newsletter segment and topic were deleted from the account on 2026-08-29.
- **`{{{RESEND_UNSUBSCRIBE_URL}}}` is gone.** Nothing emits it, and
  `lib/email/gates.ts` no longer permits it. Templates emit
  `UNSUBSCRIBE_URL_PLACEHOLDER` and `build-batch.ts` substitutes a signed
  per-recipient URL.
- **`{{{contact.first_name|there}}}` cannot be used on this path either.** Merge
  tags are a feature of broadcasts against Resend-held contacts; the batch
  endpoint substitutes nothing, so `build-batch.ts` refuses any message where one
  survives rather than delivering literal braces.

`resend broadcasts` still exists as a command. It is simply not this skill's
mechanism, and there is no segment for it to send to.

## The two commands this skill actually runs

### `resend emails send` — the test send (Step 5)

One recipient, one message, and the only one of the two that supports
`--dry-run`.

```powershell
resend emails send `
  --from "She Sharp <newsletter@shesharp.org.nz>" `
  --to "<the address the user named>" `
  --reply-to "info@shesharp.org.nz" `
  --subject "[TEST] Mentoring applications are open again" `
  --html-file "tmp/emails/announce-mentoring-round-open.broadcast.html" `
  --text-file "tmp/emails/announce-mentoring-round-open.broadcast.txt" `
  --dry-run
```

`--dry-run` prints `{"dryRun":true,"request":{…}}` and calls nothing. Check the
request, then re-run without it.

This sends the rendered file **as it sits on disk**, so the unsubscribe
placeholder `%%SHESHARP_UNSUBSCRIBE_URL%%` appears in the footer as literal
text. That is expected: only `build-batch.ts` fills it in, per person. The test
send is for layout, copy and links — not for proving the opt-out works.

### `resend emails batch` — the real send (Step 8)

```powershell
resend emails batch --file "tmp/emails/batch-<key>-<stage>-1.json" `
  --idempotency-key <the key build-batch printed> `
  --batch-validation strict
```

| Flag | What it does |
|---|---|
| `--file <path>` | A JSON **array** of email objects. `build-batch.ts` writes these; never hand-write one |
| `--idempotency-key <key>` | De-duplicates the whole request. Re-running the same chunk after a failure cannot deliver twice |
| `--batch-validation strict` | Default, and always pass it explicitly. Resend rejects the **whole** chunk if any single message is invalid, rather than half-delivering it |

Facts that shape the skill's Step 8:

- **100 messages per request, an API hard limit.** `build-batch.ts` chunks to
  100 and prints one command per chunk.
- **No `--dry-run` on `batch`.** The preflight is what `build-batch.ts` already
  did: every message rendered locally, the first put through the strict gates.
  To eyeball one, open the chunk file and read its `"html"`.
- **`scheduled_at` is unsupported per-email.** There is no scheduled state and
  no cancellation window on this path. It goes when you run it.
- **`attachments` are unsupported too.** Link to a page instead.
- Output is `[{"id":"…"},{"id":"…"}]`, one id per message, in order.
- Keep ~600ms between chunks. **That is a margin, not the limit.** Resend allows
  **10 requests/second per team**, raisable on request, and the figure is the
  same on every plan — this line said "the free tier allows about 2/second"
  until 2026-08-30, which was wrong twice over, because the account has been on
  Transactional **Pro** since 2026-08-28. Keep the pacing anyway: the limit is
  per *team*, so a full-list send shares it with the live site's transactional
  mail, and 600ms costs about ten seconds across sixteen chunks.

## After the send — `resend logs`

```powershell
resend logs list --limit 25 --json      # newest API calls; no request bodies
resend logs get <log-id>                # one call, full request + response
resend logs open                        # opens the dashboard log view
```

`logs list` pages with `--after` / `--before` cursors and caps at 100. Use it to
prove *what was called and when* — it is the audit trail when the ledger and
Resend disagree, and it is how you find out which chunks went out if a run died
halfway.

## Errors you will actually meet

| String | Cause | Fix |
|---|---|---|
| `missing_file` | No `--file` on `emails batch` | Point at the chunk file `build-batch.ts` wrote |
| `file_read_error` | Path typo, or a relative path from the wrong cwd | Run from the repo root |
| `invalid_json` / `invalid_format` | The chunk file was hand-edited | Rebuild it with `build-batch.ts`; do not repair it by hand |
| `auth_error` | No or expired API key | `resend login`, or set `RESEND_API_KEY` |
| `batch_error` | The API rejected the batch | Read the message; usually an unverified `from` domain or a message that failed strict validation |
| `429` mid-loop | The team's 10 requests/second was exceeded — at 600ms pacing that means something else was calling the API too | Stop, wait ten seconds, re-run the failed chunk — never one that succeeded |

Global flags on every subcommand: `--api-key <key>`, `-p/--profile <name>`,
`--json` (auto-enabled when stdout is piped), `-q/--quiet`.

## The two errors that come before the CLI

Neither of these is a Resend error — they come from `build-batch.ts`, before
anything is written, and both are the unsubscribe link failing:

```
Error: EMAIL_UNSUBSCRIBE_SECRET is not set, so no unsubscribe token can be signed.
Error: BASE_URL is "http://localhost:3000", which cannot be used for a marketing batch.
```

`build-batch.ts` reads both from the **shell**, not from `.env`. Set them in the
same PowerShell window and build again:

```powershell
$env:BASE_URL = "https://www.shesharp.org.nz"
$env:EMAIL_UNSUBSCRIBE_SECRET = "<the production value>"
```
