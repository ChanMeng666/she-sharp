# Who a community announcement may go to

The full four-tier consent model lives in
`.claude/skills/update-mailing-list/references/consent-rules.md`. **Read that
first** — it is the shared baseline for every She Sharp email skill, and this
file does not repeat it. What follows is only what changes when the email in
your hands is a *one-off announcement to the whole community*.

## The one-line version

**Tier 0 only.** Tier 0 is a row in the **`newsletter_subscribers` table with
status `subscribed`**, and that table is the only place She Sharp records that
someone asked to hear from us. Everything else — event registrants, mentors,
mentees, donors, people who wrote in, platform accounts — is Tier 1–3 and is out
of scope for this skill entirely.

If the user wants those people reached, there are exactly two legitimate paths:

1. They are invited to subscribe (a one-line link to
   `https://www.shesharp.org.nz/newsletter/subscribe` inside mail they *did* ask
   for), and the campaign later goes to Tier 0. This is `update-mailing-list`.
2. The mail is re-scoped as fulfilment of the thing they actually signed up for
   — joining instructions for the event they registered for. This is
   `send-event-emails`.

There is no third path, and "just this once" is not one.

## Where Tier 0 lives now

**It used to be membership of a Resend segment. It is not any more.** The
newsletter moved off Resend broadcasts, and with it the consent record moved out
of Resend and into She Sharp's own database. Nothing in this skill reads a
segment, a topic, or `resend contacts list` — those describe the system this
replaced.

Someone becomes Tier 0 by **double opt-in**, and only that way:

1. They enter their address at `/newsletter/subscribe`.
2. A confirmation email arrives.
3. They press the button in it, which lands on `/newsletter/confirm`.
4. Only then does their row move from `pending` to `subscribed`.

A `pending` row is **not** consent — it is somebody who typed an address and
never came back, or somebody else's address typed by a stranger. The whole point
of the confirmation step is that the second case cannot become a subscriber.
`recipients-from-db.ts` reads `subscribed` rows and nothing else, which is what
makes `tier: 0` an honest claim rather than a convenient one.

Two suppression registers are applied on top, both by
`recipients-from-db.ts`: the runtime `email_optouts` table (one-click
unsubscribes, bounces and spam complaints captured by the Resend webhook) and the
committed hash register in `lib/data/json/email-suppression-hashes.json`. A
later confirmation can bring somebody back — except after a complaint, which is
permanent.

## Why a database query can never be the recipient list

The `newsletter_subscribers` table is the *only* table that carries marketing
consent. No other table has a marketing-consent column. Not a missing feature to
route around — it means the information that would make a query into a mailing
list was never collected. `SELECT email FROM event_registrations` returns people
who wanted a seat at one event in one room on one evening.

Beyond consent, a hand-assembled recipient list also has no unsubscribe. On this
path the opt-out is a **signed, per-recipient URL** that `build-batch.ts` bakes
into every message and every `List-Unsubscribe` header, derived from the address
and `EMAIL_UNSUBSCRIBE_SECRET`. A loop of `resend emails send` calls produces
marketing mail that nobody can get off — which is both the definition of spam and
the fastest way to burn the `shesharp.org.nz` sending domain that every
transactional email (password resets, mentorship notifications, receipts)
depends on.

`lib/email/audience.ts` encodes this as `assertSendAllowed({ category, tier })`,
which `build-batch.ts` calls before it renders anything. It is a backstop, not a
substitute for thinking: it can tell you a Tier 2 list may not receive a
campaign, but only a human can tell you which tier a list actually belongs to.

## The three refusals that protect the opt-out link

`build-batch.ts` will not build a `marketing` batch when any of these is true.
Each one is the unsubscribe link failing in a different way, so **none of them is
worked around** — fix the cause and build again.

| Refusal | What would have shipped |
|---|---|
| `EMAIL_UNSUBSCRIBE_SECRET` is unset | No token can be signed, so no `List-Unsubscribe` headers — a send nobody can escape |
| `BASE_URL` is localhost, or not `https://` | Every opt-out link resolves to the recipient's own machine. This is the failure that put `localhost:3000` into 25 real mentor invitations on 2026-03-19 |
| A `{{{…}}}` placeholder survives into a message | The batch endpoint substitutes nothing, so it arrives as literal braces |

Note that `build-batch.ts` reads those two variables from the **shell**, not from
`.env`. That is deliberate: the values that decide whether a whole list can
unsubscribe have to be stated on purpose.

## Every message carries a working unsubscribe link

Enforced in three places, and all three matter:

1. `emails/announcement.tsx` emits `UNSUBSCRIBE_URL_PLACEHOLDER` in the footer
   when rendering in `broadcast` mode.
2. The `unsubscribe` gate in `lib/email/gates.ts` fails any
   `category: "marketing"` render that has no opt-out link at all.
3. `build-batch.ts` swaps the placeholder for that person's signed URL, and
   throws rather than shipping a message where the swap did not happen.

The gate is exempt in `preview` mode — the preview render swaps the link for an
inert `#` on purpose so a reviewer can open the file. **A green preview is
therefore not evidence the real send has a working unsubscribe link.** Nor is the
Step 5 test send, which ships the raw rendered file and shows
`%%SHESHARP_UNSUBSCRIBE_URL%%` literally. The evidence is opening a built chunk
file and reading a real `https://www.shesharp.org.nz/api/email/unsubscribe?t=…`
out of it.

If the `unsubscribe` gate fires, the usual cause is `engine: "layout"` —
the transactional layout has no opt-out footer. Switch to `engine: "react"`.

## The list is currently empty

`newsletter_subscribers` holds **nobody**. The double opt-in flow is live, but
nothing has been imported into it and nothing has been sent from it.

The real list — about **1,560 subscribers** — is still in Mailchimp, and **the
monthly newsletter still goes out from there.** The Resend segment and topic
that used to hold Tier 0 still exist in the account, hold nothing, and are
pending deletion; do not read a count off them.

That is not a reason to send to a database query instead. It is a reason to run
`/update-mailing-list` first — that skill is this skill's hard prerequisite.

**Stop and ask when fewer than 5 people will be mailed.** Below that, the send is
a rehearsal, and the user should know that before approving it, not after. Say it
plainly and give three options — run the list skill first, send anyway as a
rehearsal, or stop. Do not pick for them, and do not quietly send to a list of
one as though it were a campaign.

## Timing

The community is in New Zealand, and **a batch has no scheduler** — it goes out
when someone runs the command. So the timing decision is "when do we run it",
and the answer belongs in the plan block.

- **Best:** Tuesday–Thursday, 9–11am or 1–3pm NZ time.
- **Avoid:** Friday afternoon (read Monday, if ever), weekends, and anything
  after 8pm — a phone buzzing at 11pm reads as spam regardless of content.
- **Never** send a "register by Friday" announcement on Thursday evening. Give
  people a working day to act.

Also check whether the monthly newsletter is due (`lib/newsletter/schedule.ts`
sends on the **last Thursday**). Two She Sharp emails in one week is how a
healthy list starts unsubscribing.

## This skill never writes to the subscriber list

It reads `newsletter_subscribers` through `recipients-from-db.ts` and
`inspect-subscribers.ts`. It renders, builds and sends a batch. It **never**
subscribes, unsubscribes, imports or suppresses anybody, and never edits a row.

*Why:* that table is the organisation's only record of consent. One skill owns
writing to it (`update-mailing-list`), with its own approval gate and its own
diff step. A campaign skill that could also quietly add a subscriber would make
it impossible to answer "when did this person opt in, and who added them?" — and
that question is exactly the one that gets asked when something goes wrong.

If a recipient needs adding, removing or suppressing, say so and hand over.
