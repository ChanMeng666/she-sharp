# Reconciling the database against `#contact-form-notifications`

Why this skill reads two sources for the same thing, how the join works, and
what each mismatch means. Read this when `reconcile-inbox.ts` reports anything
other than a clean `matched` row.

## Why two sources

`app/api/contact/route.ts` → `lib/forms/contact-service.ts` does three things
when someone submits the form: insert a `contact_form_submissions` row, write an
activity log, then post a Slack notification. **Only the insert is transactional.**
The Slack post is wrapped in a `try/catch` that swallows failures, and
`lib/slack/service.ts` returns early when no webhook is configured. So:

- The **database is authoritative**. Every real submission is a row.
- **Slack is the human's field of view.** It is where the team already reads
  enquiries, where someone may have replied in a thread, and it is what a
  colleague means when they say "the message from Tuesday".

Replying from the database alone would double-reply to enquiries a teammate
already answered in a Slack thread. Replying from Slack alone would miss
submissions whose notification never landed, and would have no primary key to
mark as handled. Hence both.

## What Slack actually contains

Notifications are Block Kit, posted through an incoming webhook with only a
`blocks` array — there is no top-level `text`, so `message.text` is empty or a
fallback. Everything has to be parsed out of the blocks:

```
blocks[0]  header   "New Contact Form Submission"
blocks[1]  section  fields[]:  "*Name:*\n<name>"
                               "*Email:*\n<email>"
                               "*Organisation:*\n<org>"   (only when supplied)
blocks[2]  section  "*Message:*\n<body>"
blocks[3]  context  "Submission #<id> · contact form"     (NEW — see below)
blocks[4]  divider
```

Two parsing traps:

1. **Slack linkifies email addresses.** The stored field text is
   `<mailto:jane@example.com|jane@example.com>`, not the bare address. Strip the
   general `<url|label>` form before comparing.
2. **Long messages.** The contact form accepts 5000 characters but a Slack
   section block caps around 3000, so a very long enquiry can arrive truncated.
   Never treat the Slack copy of the message as complete — quote from the
   database row.

## The `context` block, and why the fuzzy path stays forever

`lib/slack/service.ts` now appends a context block carrying the database primary
key and which form produced the row (`contact form` or `sponsor enquiry`). When
present, the join is exact: parse `Submission #(\d+)` and match on id.

**Every message posted before that change has no context block.** They are still
in the channel, still unanswered, and still need to be reconciled. The fuzzy
fallback is therefore permanent — do not delete it as "legacy" once the change
ships. It is also the only path available if the webhook is ever replaced.

## The fuzzy join

For rows the exact join did not claim:

1. Candidate Slack messages are those whose parsed email equals the row's email,
   compared lowercased and trimmed.
2. The Slack timestamp must fall in `[submittedAt − 60s, submittedAt + 15min]`.
   The lower bound absorbs clock skew between the app server and Slack; the
   upper bound absorbs webhook retries and Slack ingestion lag.
3. If more than one candidate survives, prefer the smallest `|Δt|` **and**
   require the first 40 characters of the message to match. The 40-character
   test is what separates a genuine duplicate submission from the same person
   writing twice about different things.
4. Still more than one? The row goes to `ambiguous` and is **excluded from
   `pending`**. This is deliberate: an automated pass must not be able to act on
   a bad match, and the cost of asking a human is a single question.

## Reading the four outcomes

| Outcome | Meaning | What to do |
|---|---|---|
| `matched` | Database row joined to a Slack message | Normal path. Reply, mark handled, post the note on that thread. |
| `db-only` | Row exists, no Slack counterpart | The webhook failed, or the submission predates the Slack integration. Reply and mark as normal — just skip the thread note. Nothing is wrong. |
| `slack-only` | Slack notification with no unhandled row behind it | Usually the row is already handled (`reviewed_at` set) and simply isn't in the pending set. Occasionally it means the insert failed. **Do not send anything.** Report it and let the user check. |
| `ambiguous` | Two or more plausible Slack messages for one row | Show the candidates with their timestamps and let the user pick, or reply without a thread note. Never guess. |

## `hasHumanReply`

For any Slack message with `reply_count > 0`, the skill fetches
`conversations.replies` once and checks whether any replier is a human rather
than a bot. When true, the row is annotated `[already answered in Slack thread]`.

Treat that as a strong signal, not a verdict. A teammate may have replied *in
Slack* — "I'll email them" — without actually emailing anyone. Read the thread
before deciding, and if the thread shows a real answer was sent, mark the row
handled with `--outcome no-reply-needed --reason "answered by <who> in Slack
thread"` rather than sending a second reply.

## Rate limits and cost

`conversations.history` is Tier 3 (roughly 50 requests/minute). The fetch script
pages with a short sleep between calls and only pulls thread replies for
messages that have any. A full pass over the channel costs a handful of calls;
there is no need to cache aggressively, but `.cache/contact-notifications.json`
is written so a second run in the same session can reuse it.

`--no-slack` skips the Slack side entirely. Every row becomes `db-only`, no
thread notes are posted, and the skill still works. Use it when the token is
missing, the workspace is unreachable, or you only need to clear test rows.

## What state is for

`state/inbox-state.json` is a **run log, not the source of truth**. The
authoritative "already handled" marker is `reviewed_at IS NOT NULL` in the
database, because that survives a fresh clone, a different machine, and a
teammate doing the work by hand.

The state file exists so a later session can re-orient quickly: which
submissions this tooling has touched, what was sent, and how far up the channel
the last Slack read got. Write it after a successful send; never read it to
decide whether to send.
