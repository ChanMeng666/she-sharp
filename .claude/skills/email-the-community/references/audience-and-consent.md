# Who a community announcement may go to

The full four-tier consent model lives in
`.claude/skills/update-mailing-list/references/consent-rules.md`. **Read that
first** — it is the shared baseline for every She Sharp email skill, and this
file does not repeat it. What follows is only what changes when the email in
your hands is a *one-off announcement to the whole community*.

## The one-line version

**Tier 0 only.** A broadcast goes to a Resend segment, and a Resend segment is
the only place She Sharp records that someone asked to hear from us. Everything
else — event registrants, mentors, mentees, donors, people who wrote in,
platform accounts — is Tier 1–3 and is out of scope for this skill entirely.

If the user wants those people reached, there are exactly two legitimate paths:

1. They are invited to subscribe (a one-line opt-in link inside mail they *did*
   ask for), and the campaign later goes to Tier 0. This is `update-mailing-list`.
2. The mail is re-scoped as fulfilment of the thing they actually signed up for
   — joining instructions for the event they registered for. This is
   `send-event-emails`.

There is no third path, and "just this once" is not one.

## Why a database query can never be the recipient list

The She Sharp database has **no marketing-consent column**. Not a missing
feature to route around — it means the information that would make a query into
a mailing list was never collected. `SELECT email FROM event_registrations`
returns people who wanted a seat at one event in one room on one evening.

Beyond consent, a hand-assembled recipient list also has no unsubscribe. Resend
attaches one-click opt-out to **broadcasts**, keyed to segment and topic
membership. A loop of `resend emails send` calls produces marketing mail that
nobody can get off — which is both the definition of spam and the fastest way to
burn the `shesharp.org.nz` sending domain that every transactional email
(password resets, mentorship notifications, receipts) depends on.

`lib/email/audience.ts` encodes this as `assertSendAllowed({ category, tier })`,
which throws on `marketing` + tier ≥ 1. It is a backstop, not a substitute for
thinking: it can tell you a Tier 2 list may not receive a campaign, but only a
human can tell you which tier a list actually belongs to.

## Segment vs topic — they answer different questions

| | Segment | Topic |
|---|---|---|
| Question | **Who receives this send?** | **What are they unsubscribing from?** |
| Flag | `--segment-id` (required) | `--topic-id` (optional, but always pass it) |
| Effect of omitting | The CLI refuses — `missing_segment` | The send works, but the opt-out has no granularity |

Omitting `--topic-id` means one annoyed reader has to leave *everything* rather
than just this kind of mail. Always set it.

**Live account state** (Resend team **shesharp**, owned by
`website@shesharp.org.nz`; verified 2026-08-28, after the account move):

| Thing | Name | ID |
|---|---|---|
| Segment | `Newsletter` | `95d452f5-2eed-4ad4-b18e-5ff5a89a576b` |
| Segment | `General` (team default — empty, unused) | `9d195cb7-f7fc-49e0-9b88-e47c1741e720` |
| Topic | `Monthly Newsletter` (`opt_in`, private) | `08e59693-29dc-4556-8357-866dea047c6f` |

Every id changed on 2026-08-28: segments and topics do not travel with a Resend
domain claim, so they were recreated in the new team. Re-check with
`resend segments list --json` and `resend topics list --json` rather than
trusting this table — it is a snapshot, not the authority.

## Every broadcast carries `{{{RESEND_UNSUBSCRIBE_URL}}}`

Non-negotiable, and enforced twice: `emails/announcement.tsx` emits the tag in
`broadcast` mode, and the `unsubscribe` gate in `lib/email/gates.ts` fails any
`category: "marketing"` render that lacks it.

The gate is exempt in `preview` mode only — the preview render swaps the tag for
an inert `#` on purpose so a reviewer can open the file. **A green preview is
therefore not evidence the real send has an unsubscribe link.** Always gate the
`--mode broadcast` render before creating anything.

If the `unsubscribe` gate fires, the usual cause is `engine: "layout"` —
the transactional layout has no opt-out footer. Switch to `engine: "react"`.

## The list is currently empty

`resend contacts list --json` returns **0** contacts. The Resend team was
replaced on 2026-08-28 and nothing has been imported into the new one — not even
a test address. A broadcast today reaches nobody.

The real list — about **1,560 subscribers** — is still in Mailchimp, and the
monthly newsletter still goes out from there.

That is not a reason to send to a database query instead. It is a reason to run
`/update-mailing-list` first — that skill is this skill's hard prerequisite.

**Stop and ask when the segment holds fewer than 5 contacts.** Below that, the
send is a rehearsal, and the user should know that before approving it, not
after. Say it plainly and give three options — run the list skill first, send
anyway as a rehearsal, or stop. Do not pick for them, and do not quietly send to
a list of one as though it were a campaign.

## Timing

The community is in New Zealand. `--scheduled-at "in 1 hour"` resolves against
the machine's clock, so state the intended **NZ local** time in the plan block
and let the user correct it.

- **Best:** Tuesday–Thursday, 9–11am or 1–3pm NZ time.
- **Avoid:** Friday afternoon (read Monday, if ever), weekends, and anything
  after 8pm — a phone buzzing at 11pm reads as spam regardless of content.
- **Never** schedule a "register by Friday" announcement for Thursday evening.
  Give people a working day to act.

Also check whether the monthly newsletter is due (`lib/newsletter/schedule.ts`
sends on the **last Thursday**). Two She Sharp emails in one week is how a
healthy list starts unsubscribing.

## This skill never writes to Resend contacts

It reads `segments list`, `topics list` and `contacts list`. It creates and
sends broadcasts. It **never** runs `contacts create`, `contacts update`,
`contacts delete` or `contacts imports`, and never edits a segment or topic.

*Why:* the Resend contact list is the organisation's only record of consent.
One skill owns writing to it (`update-mailing-list`), with its own approval gate
and its own diff step. A campaign skill that could also quietly add a contact
would make it impossible to answer "when did this person opt in, and who added
them?" — and that question is exactly the one that gets asked when something
goes wrong.

If a recipient needs adding, removing or suppressing, say so and hand over.
