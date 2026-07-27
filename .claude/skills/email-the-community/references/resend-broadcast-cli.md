# Resend broadcasts — the CLI lifecycle

Everything below was confirmed by running `--help` against the installed
`resend` CLI on 2026-07-27, and by a real `--dry-run` against She Sharp's live
segment. Where something could not be verified without creating a broadcast, it
says so.

A broadcast is the only way to send marketing mail: it targets a **segment**
(not addresses), and Resend attaches the one-click unsubscribe. Individual
`resend emails send` calls cannot do either.

## The state machine

```
        create                 send --scheduled-at            (the slot arrives)
  ∅ ──────────────► draft ──────────────────────► scheduled ─────────────────► sent
       (no --send)    │                              │                           │
                      │ update / delete              │ delete = CANCEL           │ nothing.
                      ▼                              ▼                           ▼
                   still nothing delivered      still nothing delivered      IRREVERSIBLE
```

| State | Can edit? | Can cancel? | What the audience has |
|---|---|---|---|
| `draft` | Yes — `broadcasts update` | Yes — `broadcasts delete` | Nothing |
| `scheduled` | No | **Yes — `broadcasts delete` cancels delivery** | Nothing |
| `sent` | No | **No. There is no recall.** | The email |

`broadcasts get --json` reports `status` as `draft | queued | sent` (per the
CLI's documented output shape). A scheduled broadcast is expected to read as
`queued` with a non-null `scheduled_at` — treat "queued + scheduled_at set" and
"scheduled" as the same thing. *(Not verified live; verified only against the
CLI's help text.)*

## `create` and `send` do different jobs

**`broadcasts create` builds the thing. `broadcasts send` delivers it.** Keeping
them apart is the entire safety margin of this skill.

```powershell
# Required: --from, --subject, --segment-id, and one body source
resend broadcasts create `
  --from "She Sharp <hello@shesharp.org.nz>" `
  --subject "Mentoring applications are open again" `
  --preview-text "Six months, one mentor, and a room of women in tech behind you." `
  --name "announce-mentoring-round-open" `
  --reply-to "mentoring@shesharp.org.nz" `
  --segment-id c0041ec5-8653-46ec-ac6f-ff577b11714d `
  --topic-id 301e1e64-1d0f-482a-9089-436499623ff8 `
  --html-file "tmp/emails/announce-mentoring-round-open.broadcast.html" `
  --text-file "tmp/emails/announce-mentoring-round-open.broadcast.txt"
```

Body sources (pick at least one): `--html`, `--html-file` (`-` = stdin),
`--text`, `--text-file`, `--react-email <tsx>`. This skill always uses
`--html-file` + `--text-file`, because the file on disk is the artefact the
gates already checked.

**`create --send` sends immediately.** Never pass it. Omit `--send` and you get
a draft you can inspect. `--scheduled-at` on `create` is *ignored* unless
`--send` is also present, which makes "I meant to schedule it" a silent instant
send — one more reason to schedule with `send`, not `create`.

```powershell
resend broadcasts send <id> --scheduled-at "in 1 hour"
```

`--scheduled-at` accepts **ISO 8601** (`2026-08-05T11:52:01Z`) or **natural
language** (`"in 1 hour"`, `"tomorrow at 9am ET"`). Omit it entirely and the
broadcast goes out now.

**Default to a slot at least an hour out.** A scheduled broadcast can be
cancelled; a sent one cannot. That hour is the only window in which a typo, a
wrong segment, or a "wait, the date is wrong" is still free.

## Inspecting a draft before you schedule it

```powershell
resend broadcasts get <id> --json
```

`get` returns the full payload including the HTML body; `list` deliberately
returns summary objects **without** `html`/`text`/`from`/`subject`, so never
review from `list`. Check, in this order:

- `segment_id` — matches the segment you named in the plan block. Wrong segment
  is the mistake that cannot be undone.
- `topic_id` — set, so the unsubscribe applies to the right topic.
- `from`, `subject`, `name`, `reply_to` — no `[TEST]` or `DRAFT` residue.
- `preview_text` — the inbox preheader. *(Not listed in the CLI's documented
  `get` output shape; if it is absent from the response, confirm it instead from
  the `create --dry-run` request JSON, where it definitely appears.)*
- `html` — non-empty, and contains `{{{RESEND_UNSUBSCRIBE_URL}}}`.
- `status` — `draft`. `scheduled_at` / `sent_at` — both `null`.

## `--dry-run` prints the request and calls nothing

```powershell
resend broadcasts create … --dry-run
```

Output is `{"dryRun":true,"request":{…}}`. The request object uses **camelCase**
(`segmentId`, `topicId`, `replyTo`, `previewText`) even though `get` returns
snake_case — do not read anything into that, it is the CLI's own shape.

Verified 2026-07-27 against the live Newsletter Pilot segment; the keys present
were `from, html, name, previewText, replyTo, segmentId, subject, text, topicId`.

## `--preview-text` works here, unlike the REST wrapper

`lib/newsletter/resend-api.ts:284` accepts a `previewText` argument and then
**silently drops it** (`void opts.previewText`) because the REST body had no
`preview_text` field when that wrapper was written. The CLI does not have that
limitation: `--preview-text` lands in the request as `previewText`.

So a broadcast created through this skill can carry a real inbox preheader,
while the monthly newsletter has to embed its preheader inside the HTML. Do not
"fix" the wrapper from this skill; just know the two paths differ.

## Merge tags

Only two are permitted, and `lib/email/gates.ts` fails the render on anything
else:

- `{{{contact.first_name|there}}}` — first name, with a fallback after the pipe.
- `{{{RESEND_UNSUBSCRIBE_URL}}}` — mandatory in every marketing broadcast.

**Triple braces.** `{{…}}` is not template syntax to Resend and ships to inboxes
as literal braces; the `merge-tags` gate fails on any stray double brace.

The CLI help advertises `{{{FIRST_NAME|Friend}}}`. **Use the repo's form**
(`contact.first_name`) — it is what `emails/announcement.tsx` and
`emails/newsletter.tsx` emit, what the gates allow, and what the shipped monthly
newsletter has been sending. A render using `FIRST_NAME` will fail the gate.

Merge tags are substituted at **broadcast** delivery. In a `resend emails send`
test they arrive as literal text — that is expected, not a bug.

## After the send — `resend logs`

```powershell
resend logs list --limit 25 --json      # newest API calls; no request bodies
resend logs get <log-id>                # one call, full request + response
resend logs open                        # opens the dashboard log view
```

`logs list` pages with `--after` / `--before` cursors and caps at 100. Use it to
prove *what was called and when* — it is the audit trail when the ledger and
Resend disagree.

## Errors you will actually meet

| String | Cause | Fix |
|---|---|---|
| `missing_segment` | No `--segment-id` | Get it from `resend segments list --json` |
| `missing_body` | No `--html*`/`--text*`/`--react-email` | Point at the rendered files |
| `missing_from` / `missing_subject` | Flag omitted | Add it |
| `file_read_error` | Path typo, or a relative path from the wrong cwd | Run from the repo root |
| `auth_error` | No/expired API key | `resend login`, or set `RESEND_API_KEY` |
| `invalid_options` | Contradictory flags (e.g. `--scheduled-at` with no `--send` on `create`) | Re-read the flag's scope |
| `send_error` on a dashboard broadcast | **Broadcasts created in the Resend dashboard cannot be sent via the API.** | Recreate it with `broadcasts create` |
| `create_error` | API rejected the payload | Read the message; usually an unverified `from` domain |

Deleting non-interactively needs confirmation: `resend broadcasts delete <id> --yes`.

Global flags on every subcommand: `--api-key <key>`, `-p/--profile <name>`,
`--json` (auto-enabled when stdout is piped), `-q/--quiet`.
