# The three email platforms — what each holds, and where the migration stands

**Written 2026-08-30. The newsletter cutover happened on 2026-08-31 and this file
was updated for it.** She Sharp's email runs across three platforms that were
never designed to work together: **Mailchimp**, which sent the newsletter until
July 2026 and still sends event campaigns by hand; **Resend**, which took the
newsletter over on 2026-08-31 and has now sent exactly one issue from this repo;
and **Humanitix**, which is a ticketing product that also turns out to be a mail
system, complete with its own campaigns, its own opt-in and its own unsubscriber
list. A person arriving cold reads about one, assumes it is the whole picture,
and gets the state of the migration wrong.

**The cutover, in one paragraph.** On **2026-08-31** the August 2026 issue went
to **1,549 recipients** — every `status = 'subscribed'` row in
`newsletter_subscribers` after both suppression registers, with no drift — in
**16 chunks** (15×100 + 49) through Resend's transactional batch API, under
`--batch-validation strict`, one idempotency key per chunk, **0 failures**. The
approval chain (stage 1 test, stage 2 review round, stage 3 the founder's
approval) is on the record in
`.claude/skills/monthly-newsletter/state/issues.json`.

**First delivery reading, ~20 minutes after the send** (Resend `GET /emails`,
paged over all 1,549): **1,536 delivered, 7 bounced, 1 delayed, 5 still in
flight, 0 complaints.** That is a **0.45% bounce rate against a 2% arm** and
**0% complaints against a 0.10% arm** — both well inside the thresholds in
[`../deployment/EMAIL_AUTHENTICATION.md`](../deployment/EMAIL_AUTHENTICATION.md)
§15. **Read it as provisional, not final**: bounces and complaints arrive for
hours and sometimes days afterwards, and a complaint in particular is a human
pressing a button in their own time. The authoritative running figure is
`email_events`, fed by the Svix webhook, not this paragraph.

**A good first reading does not retire the ramp.** The send went to the whole
list at once when three places in this repo asked for it to be ramped; that it
came out fine is one sample, not evidence the rule was wrong. **And the Mailchimp account is untouched**: it has
not been paused, downgraded or closed. See
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md).

This file is the **state-and-history layer**: an inventory of what each platform
holds, which parts are live, what has been decided and when, the handful of
places data crosses between them, and an honest list of what nobody has managed
to establish. It exists so that "where are we?" has one answer instead of eight.

## This file does not contain the rules

Four other documents are authoritative, and each is the *only* place its subject
is written down. Two copies of a rule is how one goes stale, so where this file
is tempted to explain a rule it links instead. If this file and one of these ever
disagree, **the other one is right**.

| Question | Authority |
|---|---|
| **May we email this person?** | [`.claude/skills/update-mailing-list/references/consent-rules.md`](../../.claude/skills/update-mailing-list/references/consent-rules.md) — the four audience tiers, the four consent routes, the two ways the list may grow |
| **Which system sends which mail?** | [`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md) — subscribers from this repo through Resend, one event's registrants from Humanitix, and the decision table |
| **How do we stop paying Mailchimp?** | [`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md) — the bilingual runbook, in order, with the export step first |
| **Why self-host the newsletter at all?** | [`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) — the costed decision of 2026-08-28, and AWS SES as a future option |

Operational detail — the four sending streams, the webhook, the unsubscribe
token — is in [`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md). The two platform API
integrations are in [`PLATFORM_APIS.md`](PLATFORM_APIS.md).

## A note on numbers

**Every figure below carries the date it was taken, and none of them is current.**
The Mailchimp audience is still live and still accepting sign-ups, so it moves
daily. For the live subscriber count there is one command and it is not this file:

```bash
npx tsx scripts/email/suppression.ts reconcile
```

Where a figure came from a query, the query is named so it can be re-run. The
last section lists every measurement in this file and how to repeat it.

---

## The three platforms at a glance

| | **Mailchimp** | **Resend** | **Humanitix** |
|---|---|---|---|
| Role today | Sent the newsletter until **July 2026**; still sends event campaigns composed by hand in its console | **Sends the newsletter** — first issue 2026-08-31; also sends transactional mail | Sells tickets; **also sends registrant mail** |
| Role when Mailchimp is finally stopped | data archive only | sends everything from this repo | unchanged — keeps sending registrant mail |
| Cost | paid monthly, being cancelled | Transactional Pro, $20/month, **kept** | free on the NZ charity rate |
| Consent record | its own audience | **`newsletter_subscribers` in our Neon database** | per-order opt-in flag |
| Driven from code? | read-only pulls, local tooling only | yes, the send path | reads only; **its mail features have no API at all** |
| Opt-out register | its own | `email_optouts` + the committed hash register | a third, **event-scoped**, console-only |

The single most-misread fact: **all three are still sending mail today** — the
newsletter cutover of 2026-08-31 moved one stream, not the account — and once
Mailchimp is finally stopped **two** still will. Retiring Mailchimp is not a
consolidation onto one platform — it is a consolidation onto two, deliberately.

---

## Resend — the destination

**Plan.** Transactional **Pro, $20/month**, in the She Sharp-owned `shesharp`
team since 2026-08-28. Marketing stays on Free and is not used at all. Account
ids, the webhook, and the domain-claim history are in
[`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md) § "The Resend account".

**The paid upgrade is done, and it was the organisation that did it.** Mahsa put
the `shesharp` team on Pro; the maintainer confirmed on **2026-08-30** that the
account is on the Pro plan. So "we are waiting on the upgrade" is no longer a
true sentence anywhere, and neither is "Resend is on the free tier" — a claim
that survived in four rate-limit comments until the same day, where it was wrong
about the plan *and* about the number (Resend's documented limit is 10
requests/second per team, on every plan). **What the upgrade removes is a quota
blocker, and nothing else.** It did not by itself make the cutover done — that
took a further day, and the send on **2026-08-31** is what made it done. Read any
sentence that pairs "Pro" with "ready" as two separate facts.

**The newsletter is now the entire case for Pro.** Until 2026-08-30 there was a
second argument — event fulfilment mail, which could exceed Resend's Free
100-per-day cap. That argument is gone: `/send-event-emails` was retired and that
mail moved to Humanitix, which does not touch the Resend quota
([`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) §1, updated for this).
**The maintainer decided on 2026-08-30 not to downgrade**, and the send of
2026-08-31 settled it in the other direction as well: the plan is no longer
paying for a capability nothing uses — 1,549 messages went through it. Treat
"why are we paying for this?" as answered, not open.

### `newsletter_subscribers` — the consent record

This table, not any vendor's list, is the organisation's marketing-consent
record. What makes a row mailable is `consent-rules.md`'s business, not this
file's. What the table *contains* is:

**Measured 2026-08-30**, via `suppression.ts reconcile` and a direct
`GROUP BY` over the table:

- **1,549 mailable.**
- **Every row is `status = 'subscribed'`.** There are currently **no** `pending`,
  `unsubscribed`, `bounced` or `complained` rows at all — a state worth naming,
  because code that handles those statuses has never been exercised against real
  data.
- **Every row has `source = 'mailchimp-import'`.** The table has grown by exactly
  one mechanism so far.
- **1,545 carry a real `confirmedAt`**, taken from the 2026-08-17 export's
  `CONFIRM_TIME` column. **4 carry `null`** — imported from the Mailchimp
  Marketing API on 2026-08-30, which does not supply a usable `CONFIRM_TIME`
  (see "Two columns, and which one survives an API pull" below).
- **`source` does not separate those two groups.** Both say `mailchimp-import`.
  What separates them is the null `confirmedAt` and the `consentSource` sentence,
  which names the API pull and its date in full. If you need "which rows came
  from the API?", query `confirmed_at IS NULL`, not `source`.

**This list has now been sent to, once.** On **2026-08-31** the August 2026
newsletter went to all **1,549** mailable rows in 16 batch chunks with 0
failures — the first broadcast in the table's history, and the moment a populated
list became a cutover. Before that date the only traffic was test sends to the
maintainer's own address (`email_events` held **6 rows for 1 distinct person** on
2026-08-30), which is why every document in this repo said "nothing has been
sent" up to 2026-08-30; those sentences are historical now, not current.
**One send is not a routine.** Nothing beyond the August issue has gone out from
this table. The first delivery reading is in the header section above — 1,536
delivered and 7 bounced about twenty minutes in — and it is **provisional**: the
running figure lives in `email_events`, fed by the Svix webhook, not here.

### How the list was actually acquired

**Measured 2026-08-30**, offline, from the two vault exports and the two API
pulls. No address was written to disk; every identity is a `hashEmail()` digest.
The population was reconstructed exactly as `import-mailchimp-subscribers.ts`
builds it — the deduped valid rows of the 2026-08-17 `subscribed` export minus
the suppression register (1,545), plus the four the API delta added (4) — and it
comes to **1,549**, the same figure the table gives. That agreement is what makes
the offline tiering usable as a statement about the table.

Each person is counted **once**, in the strongest tier they qualify for:

| Tier | What it means | People | Share |
|---|---|---:|---:|
| **T1** | Self-service sign-up in Mailchimp — `source` is `Embed Form` or `Hosted Signup Form` | **198** | 12.8% |
| **T2** | A separate confirmation act — the export's `CONFIRM_TIME` differs from its `OPTIN_TIME` | **128** | 8.3% |
| **T3** | Ticked the Humanitix checkout opt-in (consent route 2), and not already T1/T2 | **55** | 3.6% |
| **T4** | **Bought a ticket and never ticked anything** | **752** | 48.5% |
| **T5** | **Provenance unrecoverable** — `Import` 354, `API - Generic` 60, `Unknown` 1, `Admin Add` 1 | **416** | 26.9% |
| | | **1,549** | |

**T4 is not a coincidence of two datasets overlapping.** `source` is a near
perfect classifier here: **887** of the 1,549 carry
`source: "Mahsa McCauley NZD"`, **886** of those are Humanitix ticket buyers, and
**no contact from any other source is a buyer at all**. That string is a Mailchimp
**ecommerce store** — the Humanitix integration's endpoint — so for the 752 in T4
the recorded provenance is *"the integration wrote them in"*, and nothing else.
Inside T4, `CONFIRM_TIME == OPTIN_TIME` on **all 752**: not one has a separate
confirmation.

**Three limits, which must travel with those numbers.**

1. **This does not prove the 1,168 in T4+T5 lack consent.** They may have
   subscribed separately, before or after the ticket. The Mailchimp **CSV**
   export carries no `SOURCE` column at all; only the API members dump does, and
   only since the key was created on 2026-08-27.
2. **`source` records the first write and is never rewritten.** A buyer the
   integration wrote in during 2021 who later used the website form still reads
   `Mahsa McCauley NZD`. The tiering therefore scores the *weakest* plausible
   story for anyone who has more than one, and the zero overlap between
   `Embed Form` and the buyer set is that effect, not evidence that no buyer ever
   signed up.
3. **The evidence that would establish their consent does not exist either.**
   There is no per-contact activity history in the export and none in the API. So
   the honest position is not "these people did not consent" but "we cannot
   answer the question `consent-rules.md` requires us to answer" — which, for a
   send, is the same operational answer.

**What follows.** The tiering existed so that a ramped first send could be
ordered by tier rather than by row order: T1 + T2 + T3 is **381** people with a
nameable consent story, and `--restrict-to-hashes` on both recipient builders
already takes a hash list. **The first send did not use it.** On 2026-08-31 the
August issue went to all **1,549** at once, which is a fact to record rather than
a rule that was broken — no document ever required the ramp, and the founder
approved the full list. The mechanism is still there for a future send that wants
it. Nothing here justifies deleting rows — weak provenance is not proof that
consent is absent, and the suppression file is one-way.

**Re-take it with** the four sources named above and a set union in a scratch
script; do not put addresses on disk. The reconstruction, not the database, is
what makes it repeatable offline.

### The other two tables, and the committed register

Measured 2026-08-30:

| | Rows | Note |
|---|---|---|
| `email_events` | **6**, for **1 distinct person** | Test sends only — **as at 2026-08-30, the day before the cutover**. The 2026-08-31 broadcast to 1,549 people has not been re-counted here; re-take it before quoting, and expect the webhook to have written delivery, bounce and complaint rows since |
| `email_optouts` | **10** | Runtime opt-outs, written by the webhook and the one-click endpoint. **9 of the 10 are She Sharp's own mailboxes** — hard bounces from `probe-mailboxes.ts`, which `suppression.ts sync` deliberately refuses to fold into the committed register. Only **one** is a real contact, and `sync --dry-run` on 2026-08-30 reported it as **not yet in the register**: one entry of undrifted drift, waiting for somebody to run `sync` |
| `lib/data/json/email-suppression-hashes.json` | **2,144** hashes | Committed, hash-only, and the reason 15 rows were held back at import |

Both registers are do-not-contact lists and neither is a record of consent —
`consent-rules.md` is explicit about that and about why they are not inverses of
the subscriber table.

### The send path

```
scripts/email/recipients-from-db.ts        → reads the table, applies both registers
   ├─ scripts/newsletter/build-newsletter-batch.ts   the monthly newsletter
   └─ scripts/email/build-batch.ts                   any other announcement
a human runs `resend emails batch`         → the only step that puts mail in inboxes
```

**There are two batch builders and picking the wrong one is a real mistake.**
The newsletter is a React Email template driven by a validated issue file, not a
`MessageSpec`, so `composeMessage` has nothing to compose;
`build-newsletter-batch.ts` reuses `build-batch.ts`'s idempotency key, hash
ledger, manifest shape and chunk-file naming and swaps only the renderer. A
one-off announcement (`/email-the-community`, `/promote-event`) goes through
`build-batch.ts` directly.

Since 2026-08-30 the path can also be narrowed to an engagement cohort with
`--restrict-to-hashes`, which only ever removes rows
(`scripts/email/normalize-recipients.ts`). **Neither builder sends.** They write
files and print the commands; approving an issue does not send it, and every
batch command is run by a person.

---

## Mailchimp — the incumbent, being cancelled but not closed

**It is no longer the newsletter's sender, and it is not switched off either.**
Two separate facts, and conflating them is the trap this section now exists to
prevent. **The July 2026 issue — `She Sharp Newsletter - July 2026`, sent
2026-07-31 — was the last newsletter ever sent from Mailchimp** (stated by the
maintainer on 2026-08-31, and consistent with `campaigns.json`). But Mailchimp
has sent *event* campaigns since, composed by hand in its console: the archive's
last two are the Les Mills EDMs of 2026-08-18 and 2026-08-22. So "Mailchimp still
sends" is true of event mail and false of the newsletter, and a sentence that
says only "Mailchimp is the live sender" is now wrong.

**The account is still paid, still live and still holds the audience.** Nothing
about the 2026-08-31 cutover paused, downgraded or closed it — that is a separate,
founder-only job in
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md),
and its ordering precondition ("the last Mailchimp send must precede the
downgrade") is the one thing the cutover *did* change.

As at 2026-08-30 the account's own
`campaign_last_sent` was **2026-08-27 20:37 UTC** — the 28th, New Zealand time.
The same call reports `campaign_count: 217`, which is campaigns in **any**
status referencing this audience, drafts included; it is **not** a send count.
The send history is the committed archive's **180 sends**
([`MAILCHIMP_ARCHIVE.md`](MAILCHIMP_ARCHIVE.md)), and the two must not be quoted
against each other.

### There is exactly one audience, and that constrains everything

`getLists()` on 2026-08-30 returned **one** list: **`She#`**, id `31bd05e8eb`,
data centre `us3`. So every option that begins "point the integration at a
different audience" or "move the newsletter people into their own list" is
**not available**. Whatever writes into Mailchimp writes into the same list the
newsletter is sent from.

### What the audience holds

Read from `/lists/{id}` and `/lists/{id}/members?status=` on **2026-08-30**:

| Status | Count |
|---|---|
| `subscribed` | **1,552** |
| `unsubscribed` | 810 |
| `transactional` (the console calls these *non-subscribed*) | 790 |
| `cleaned` (hard-bounced) | 552 |
| `archived` | 5 |

The console's headline **"3,152 contacts"** is `1,552 + 810 + 790` — subscribed
plus unsubscribed plus non-subscribed, **excluding** the 552 cleaned and the 5
archived. That decomposition is worth keeping, because the account produces at
least three defensible "total contacts" figures and people quote them against
each other. `MAILCHIMP_ARCHIVE.md` § "Eight ways to get a number wrong" is the
place that argument is settled.

### The gap between Mailchimp and our table

**Measured 2026-08-30**, comparing sha256 hashes of Mailchimp's `subscribed`
members against `newsletter_subscribers`:

- **1,552 in Mailchimp** against **1,549 mailable here**.
- Our table is a strict **subset**: **0 people are in ours and not theirs**.
- The **3** in Mailchimp only all carry `source: "Mahsa McCauley NZD"` — the
  string Humanitix's integration writes.

Earlier the same day the gap was 7, of which 4 had `source: "Hosted Signup Form"`
(they subscribed themselves on Mailchimp's hosted form) and were imported that
afternoon.

**"Pending a route-2 import" was wrong, and this paragraph used to say it.**
Re-measured against the 2026-08-28 members dump the gap is **6**, and the six are
two different problems that the word "gap" hides:

| `source` | People | Humanitix orders | Ever ticked the checkout opt-in |
|---|---|---|---|
| `Mahsa McCauley NZD` | 3 | one each | **none — 0 on both the orders CSV and the API** |
| `Hosted Signup Form` | 1 | none | — |
| `Embed Form` | 1 | none | — |
| `API - Generic` | 1 | none | — |

The three Humanitix ones **cannot be imported**. That `source` is the ecommerce
store the integration writes through, not evidence that anybody ticked anything,
and the two order surfaces agree that none of them did. `consent-rules.md` § "If
you cannot pick one" gives the only answer available: the subscribe link.
Route 2 needs a tick; there is no tick.

The other three are the **opposite** case and are the stronger evidence in this
whole dataset: `Embed Form` and `Hosted Signup Form` are people who filled in a
Mailchimp form themselves, which is consent route 1. They have no Humanitix
orders at all and nothing to do with ticket buying. They belong to **crossing 3**
— a fresh export through `import-mailchimp-subscribers.ts` — not to route 2, and
they are the joiner gap below arriving in practice rather than in theory.

**A related question, now closed.** **188** distinct people ever ticked the
Humanitix checkout opt-in (CSV ∪ API). **89** of them are not in
`newsletter_subscribers` — and **all 89 are on the committed suppression
register**, with none outside it. So the apparently attractive backfill of
"people whose consent evidence is stronger than the list we hold" yields
**zero importable rows**, and `selectMailable()` refuses every one of them
correctly: they ticked in 2020–2022 and later unsubscribed or bounced, so the
later act wins. The remaining 99 are already in the table, which matches the
tiering's independently-derived `ever-ticked 99`.

**The asymmetry that produces this gap is structural, not an oversight.**
`suppression.ts pull-mailchimp` pulls people who *leave*. **Nothing pulls in
people who *join*.** The 2026-08-31 cutover did not close this gap — the six site
entry points have pointed at `/newsletter/subscribe` since 2026-08-29, but the
Mailchimp forms are still live and still accepting sign-ups, so anyone who joins
there is invisible to a send from our table. That is
now a numbered step — item 6 of **Step 8a** in `.claude/skills/monthly-newsletter/SKILL.md`
— and it is deliberately a *detection* step: it stops and reports, it does not
import.

**Closing it belongs to `/update-mailing-list`**, Step 6 § "Closing the joiner
gap", which carries the procedure and the order (`pull-mailchimp`, then the
import over a **fresh** `subscribed` export, then `reconcile`). That skill's
"do not re-run the importer" is about the frozen 2026-08-17 export and forbids
none of this; the two skills were briefly readable as contradicting each other
and no longer are.

**Do not remember any of these numbers.** Run the comparison. The audience's
`last_sub_date` on 2026-08-30 was **2026-08-28**, so it moves.

### Two columns, and which one survives an API pull

This matters because it decides whether an import may write `confirmedAt`, which
is the difference between recording a confirmation and inventing one.

**Measured 2026-08-30**, joining the 2026-08-17 vault export against a live API
pull across the 1,545 contacts present in both:

- **`timestamp_opt` *is* `OPTIN_TIME`.** Of the 1,545 shared contacts, **1,544
  have both values and every one differs by exactly the New Zealand offset —
  947 at +12h (NZST) and 597 at +13h (NZDT), with zero at any other offset.**
  The CSV is account-local time; the API is UTC. This retires the "unverified,
  likeliest explanation is account-local time" caveat in
  [`PLATFORM_APIS.md`](PLATFORM_APIS.md) § "Mailchimp — the counts match" — the
  explanation is now measured, not likely. The 1,545th contact has **no opt-in
  time on either side**; it reappears immediately below, and it is the same row
  both times.
- **`timestamp_signup` *is* `CONFIRM_TIME`.** The API populates it on **129** of
  the 1,545. On **128** of those the CSV's `CONFIRM_TIME` also differs from a
  populated `OPTIN_TIME` — the signature of confirmation as a separate act. The
  **129th is the contact with no `OPTIN_TIME` at all** (blank in the CSV, `null`
  in the API), so there is nothing for its `CONFIRM_TIME` to differ *from*; it
  still carries both a `CONFIRM_TIME` and a `timestamp_signup`.
- **Across all 129, the two agree to the New Zealand offset: 125 at +12h, 4 at
  +13h, zero at any other offset.**

> **Two counts, deliberately not merged.** 129 rows have `timestamp_signup`; 128
> rows have a `CONFIRM_TIME` that differs from a populated `OPTIN_TIME`. Writing
> either number as though it were both hides the one row that is in the first set
> and not the second. Restricting the offset table to the 128 gives 125/**3**
> rather than 125/**4** — same shape, one row apart, and it is that row.

**So the API does not withhold the column.** Mailchimp simply never recorded a
separate confirmation for the other **1,416**, where the CSV's `CONFIRM_TIME` is
a copy of `OPTIN_TIME` rather than evidence of a second act.

### Every imported `confirmedAt` is 12-13 hours late, and it changes nothing

**The defect.** `import-mailchimp-subscribers.ts` reads the export's stamps as
UTC — its header said so, and said most rows carry no `GMTOFF` as the reason.
They are **New Zealand local**. Measured 2026-08-30 against the API, which
returns UTC: `timestamp_opt` vs `OPTIN_TIME` differs by exactly **+12h on 950
rows and +13h on 600**, none at any other offset. So every one of the 1,545
stored `confirmedAt` values is **12-13 hours later than the instant it records**.

**Why that is not merely cosmetic in principle.** `selectMailable()` re-admits a
suppressed address when `confirmedAt > suppressedAt` — a later deliberate act
outranks an earlier suppression. A stored value that is too *late* can therefore
manufacture a re-admission that the true instant would not support, which is a
send to somebody who had opted out. That is the one thing this skew could break,
so it was measured rather than assumed.

**Measured 2026-08-30: zero rows are affected, and zero is structural.** Both
registers were checked, because `selectMailable()` reads both.

**The committed register (2,144 hashes).**

| | |
|---|---:|
| Export rows also on it | **15** — the same 15 the import held back |
| of those, a terminal reason (comparison never runs) | 0 |
| of the rest, `confirmedAt > suppressedAt` (would re-admit) | **0** |
| of those, within 13h of the suppression (flippable) | **0** |
| closest gap in either direction, across all 15 | **6,923 hours (~288 days)** |

The margin is **530x** the largest possible skew, and the reason is that the two
ranges do not overlap at all. Every committed register timestamp is at or after
**2026-08-17T13:55Z**; every export `CONFIRM_TIME` is at or before
**2026-08-17T06:35Z**. The register was built *from* that export, hours after it
was taken, so no imported confirmation can postdate a suppression by
construction. Every later `pull-mailchimp` pushes register timestamps further
forward, widening the gap rather than narrowing it.

**`email_optouts` (10 rows).** This one cannot be read from the vault, so it was
read with `suppression.ts sync --dry-run`, which writes nothing. **Nine of the
ten are She Sharp's own mailboxes** — hard bounces from
`scripts/email/probe-mailboxes.ts`, which the sync deliberately refuses to fold
into the register because they belong to the runtime table. The **tenth** is the
only real one (`e70b0e932b7b…`, `bounce`, 2026-08-28), and it **is not in the
2026-08-17 `subscribed` export at all**, so it was never imported and is not one
of the 1,549. Nothing on this register pairs with an imported `confirmedAt`
either.

**So the flip count is zero for a stronger reason than "it comes out the same
way": the comparison never runs for anybody.** `reconcile` says so independently
— *"No drift: every mailable subscriber is clear of both registers"* — against
`Runtime opt-outs: 10` and `Committed register: 2144`, with all 1,549 mailable.

**So this is not an emergency and nobody should re-open it as one.** It is also
not nothing:

- **Do not fix it by shifting the stored values.** Nothing depends on the 13
  hours, and a bulk `UPDATE` over 1,545 consent timestamps to correct an error
  that changes no decision is the larger risk.
- **The one way it could ever bite is a re-import.** A future run against a
  fresh Mailchimp export would write `CONFIRM_TIME`s from *after* 2026-08-17,
  which can land within 13h of a register entry. Fix the parse before that run,
  not before this sentence.
- **Website sign-ups are unaffected** — `confirmSubscription()` writes
  `new Date()`, which is a real instant.

The importer's header comment now says the stamps are NZ local and points here.

**Read that carefully before building an API-delta importer, because the obvious
summary of it is wrong.** The API is **not** strictly weaker than the CSV for
everybody: for the 129 it carries a real, correct confirmation timestamp, and an
importer could legitimately write `confirmedAt` from `timestamp_signup` **on
exactly those rows**. It is weaker only for the 1,416 the API leaves empty — and
because a delta pull cannot tell you in advance which group a new contact falls
into, the safe default stands: **an API-sourced import writes `confirmedAt` null,
and a fresh CSV export, not an API delta, is the way to close the joiner gap.**

The four rows imported from the API on 2026-08-30 were checked individually: all
four have `timestamp_signup: null`, so their null `confirmedAt` is **correct on
the facts as well as on the rule** — they fall in the 1,416 group. Their stored
`consentSource` sentence says the API "exposes no `CONFIRM_TIME` equivalent";
strictly it exposes one that is empty for them. **The rows are right and only the
general clause is loose, so this is not a reason to touch production data** — it
is recorded here so nobody reads that sentence as a statement about the API in
general. Whether to reword it is the maintainer's call.

### The archive page showed six months, not the archive — and the button is gone

`MAILCHIMP_CONFIG.archiveUrl` — the site's **"Open full archive"** button and the
**"Read past issues"** footer link on every page — returned **HTTP 200** with
exactly **20** `<li class="campaign">` entries across **17 distinct dates**,
oldest **14 February 2026** (fetched 2026-08-30, reproduced for this file).
Mailchimp's own help page says the archive "shows links to the 20 most recent
emails sent to your audience"
(<https://mailchimp.com/help/about-email-campaign-archives-and-pages/>).

The button was therefore **already wrong on a paid plan**, and always had been.
**Both renderings were deleted on 2026-08-30**, along with `archiveUrl` itself
and the `lib/data/newsletters.ts` it was the last field of: the footer link now
points at `/resources/newsletters`, and the button was removed rather than
repointed because that page *is* the archive now — all 179 sent campaigns are
committed to `lib/data/newsletter-archive/` and served from
`/resources/newsletters/<id>`. Recorded in
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md)
§4. **Do not re-litigate it here** — it is listed only so nobody discovers the
old defect a third time and files it as a cancellation casualty. It was not one.

### Cancelling: the one fact that constrains everything else

Stopping payment means **pause** or **downgrade to Free**. There is no third
button, and the Free plan holds sending above **250 contacts**. The `She#`
audience is an order of magnitude larger, so **downgrading ends Mailchimp sending
immediately while keeping the data.**

That fixes the order of the whole migration: **the last Mailchimp send comes
before the downgrade, and the exports come before both.** **That precondition is
now satisfied for the newsletter** — the July 2026 issue was the last one sent
from Mailchimp, and the August issue went from Resend on 2026-08-31 — so the
downgrade is **unblocked and is a live next action**, not a hypothetical. What
still has to be decided before pressing it is whether any further *event*
campaign will be composed in Mailchimp's console, because that mail would stop
too. Everything else —
which of pause or downgrade to pick, the one-per-lifetime downgrade, the **51**
live site links into Mailchimp, what to export first — is in
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md).
**Cancel is not delete**, and that file exists largely to keep those apart.

---

## Humanitix — ticketing, and an email system of its own

The surprise for anyone who has only read `PLATFORM_APIS.md`: Humanitix is not
just a data source. **It sends mail, holds a marketing opt-in, and keeps an
unsubscriber register**, and none of that is reachable from code.

### None of its email features has an API

**Verified 2026-08-30** against <https://api.humanitix.com/v1/documentation/json>:
the Public API is **v1.21.0** with **14 endpoints** and **106 schemas**. The
strings `campaign`, `unsubscri`, `notify`, `follower`, `send` and `host profile`
appear **zero times** in the entire OpenAPI document.

**So no key, no scope and no amount of code can drive Humanitix's email
features.** When a check on one of them is described as manual, that is not an
unwritten client — there is nothing to call. `consent-rules.md` relies on this.

### Email campaigns — free, in the console, and already in use

Humanitix's Email campaigns tool is in **habitual use**, composed by hand in the
console by the people who organise events. What it may be used for, quoted from
Humanitix's own help centre, is in
[`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md)
§ "What Humanitix sends" — registrants only, always from a Humanitix address,
and the tool stops 14 days after the event ends.

**Page 1 of the campaign list**, read from the console on 2026-08-30, spans
**November 2025 to August 2026**:

| Read from the list view | When |
|---|---|
| three HCLTech rows — two reminders and a thank-you | 19, 20 and 24 Nov 2025 |
| `2026 IWD x AcademyEX event` | 5 Mar 2026 |
| a Metlifecare "Own Your Energy" pair, plus its thank-you | 15, 16 and 23 Apr 2026 |
| `Thank You for Joining Us @ MYOB` | Thu 6 Aug 2026, 12:00pm NZST |
| `Reminder I - September 2026 Les …`, subject "Join Us Tomorrow" | **Draft** |

**That is page 1 alone, and the pagination control showed a next arrow** — so
there are more campaigns than these, and **no total should be quoted from this
table**. Several names are truncated by the UI (the Les Mills row above ends in
an ellipsis because the console does); they are not full titles.

The console also carries its own banner above the campaign list:

> Please note, Email Campaigns should never be used for Marketing and
> Promotional material. Email Campaigns should only be used to communicate
> service-level info related to a customer's purchase.

This is a **different string** from the help-centre wording quoted in
`EMAIL_RESPONSIBILITY_BOUNDARIES.md`, not a variant of it — the help centre says
campaigns "cannot be sent to external databases" and are "intended for
service-level comms related to the event an attendee has registered for". Two
sources saying the same thing in different words. The help-centre one is
linkable; this one is only visible to someone signed in. Either way it is the
same fulfilment-only line `lib/email/audience.ts` draws from our side.

> **Provenance — weaker than everything else in this file, and the only part of
> it you could not re-derive yourself.** Everything above in this document was
> re-measured against a live API or the database when it was written. This
> subsection and the next were **not**, and cannot be: there is no API, no export
> and no history view behind them. They come from **the maintainer driving the
> signed-in Humanitix console through browser automation on 2026-08-30**, and
> the figures were read off screenshots by eye. The banner is transcribed rather
> than captured byte-for-byte. Treat all of it as evidence that the tool is in
> habitual use — which is what it was collected to show — and **not** as a
> register of what has been sent. If a detail here matters to a decision, open
> the console and look.

**Decided 2026-08-30: this stays in Humanitix, by hand, and is not coming into
this codebase.** `/send-event-emails` was deleted for exactly that reason
(PR #224). The three reasons, and the two costs the decision knowingly accepts,
are in `EMAIL_RESPONSIBILITY_BOUNDARIES.md` § "Why the boundary is where it is".

### A third unsubscribe register, which is not a do-not-contact list

Console → Email campaigns → **Unsubscriber list**
(<https://console.humanitix.com/console/comms/email-campaigns-unsubscriptions>),
columns Email / Event / Unsubscribed at. Its own description on the page:

> Attendees/buyers who have chosen to unsubscribe from receiving your event
> communications will no longer receive emails sent through email campaigns
> **for the event**.

Read page by page from the console on **2026-08-30**, as at that date: **28
rows** over **21 distinct addresses**, spanning **2021-08 → 2026-06**, and **no
export control**. One row is She Sharp's own mailbox unsubscribing from a She
Sharp event.

> **This paragraph was wrong until 2026-08-30, and the way it was wrong is the
> point.** It said "roughly 20 rows and 13 distinct addresses, spanning 2021-08 →
> 2025-11 with nothing in 2026", on the strength of two screenshots and one
> observation: *"Clicking the next-page arrow did not change the view — evidence
> that this is the whole list."* There is a page 2. Requesting `?page=2`
> directly returns **8 more rows**, including the **two most recent, from
> 2026-04 and 2026-06**. A click that appears to do nothing is not evidence that
> there is nothing to show; it is a click that did not work.

That matters operationally rather than as a correction of counts.
`--event-unsubscribers-checked` on `import-optin-subscribers.ts` means "a human
has read that event's unsubscriber list", and a human who read only page 1 would
have missed the two 2026 rows — which belong to the academyEX IWD 2026 and
Metlifecare "Own Your Energy" events, exactly the recent events a route-2 import
would be about. **Page the list to the end, and check that the last page is
empty rather than that the arrow stopped responding.**

It is **event-scoped** — each row says "stop emailing me about *this event*" —
so it is deliberately **not** folded into our suppression register. What it is
narrowly good for, and the `--event-unsubscribers-checked` acknowledgement that
gates a route-2 import on it, is in `consent-rules.md` § "A third register".
Do not reason about it from here.

### The marketing opt-in is a built-in on the order, not a host question

**Verified 2026-08-30** in the OpenAPI document: `organiserMailListOptIn` appears
**exactly once across all 106 schemas**, as a `boolean` on **`Order`**. It is
absent from `Event` and from `Ticket`. It is **not** one of the host's
`additionalQuestions` (which are defined on `Event`/`EventDate` and land in
`additionalFields`) — it is a built-in, uneditable control worded *"Keep me
updated on the latest news, events, and exclusive offers from the event host"*.

Recorded per order; it reaches us as a "marketing opt-in" column in the console's
**reports → orders → Export CSV** (the orders report, not the attendees one).

### The 2022 question is closed: the switch was off, and the integration wrote everyone anyway

This section held an open question through two revisions. **It was settled on
2026-08-30** by opening the one file both revisions named as decisive and nobody
had read: the Humanitix console's **reports → orders → Export CSV**, sitting in
the vault since 2026-08-17 at
`private/humanitix/2026-08-17/order-report-(exported-2026-08-17@09.59.31).csv`.

**The `Marketing opt-in` column never lapsed.** 4,145 orders, 43 columns, **224
Yes / 3,921 No / zero blanks**, populated on every order right through to the
export date — and **0 Yes** across all 2,579 orders from 2023 onward. The
Humanitix API agrees from a different surface on a different date: over 4,169
orders, `organiserMailListOptIn === true` on **223** (2020: 137, 2021: 47,
2022: 38) plus **exactly one in 2026**, on **2026-08-26**, on the Les Mills event
`6a422a2d01e463796c170142`. **188 distinct people have ever ticked it**, and
before that 2026 row the last tick was **2022-05-30**. The full working, with the
per-year table and how to re-take it, is in
[`EVENT_LIFECYCLE_SOP.md`](EVENT_LIFECYCLE_SOP.md) § "Turn on the mailing-list
opt-in".

**So the writes were the integration, and they were not opt-ins.** Both readings
this section used to hold open were wrong, and the second was wrong in an
instructive way. `source: "Mahsa McCauley NZD"` **is** the Humanitix integration
— it is a Mailchimp **ecommerce store**, `id 5e328b71a912950007fd7f91_NZD`,
with its `email_address` still an `events@` mailbox on the **old `shesharp.co.nz`
domain**, read from the API vault's
`ecommerce-stores.json`; Humanitix documents the store name as *user account name
+ currency*. What made the writes continue after May 2022 was the integration's
**"Sync contacts who haven't opted-in"** setting, ON until it was switched off on
**2026-08-27**. A non-opted-in buyer was written into the `She#` audience as
`subscribed` all the same.

The state fact that belongs here is unchanged and still true: those writes did
**not** stop in 2022. Re-measured on 2026-08-30 across all four member statuses
by `timestamp_opt`: **663 with status `subscribed` after 2022-05**, spiking at
2023-10: 80, 2023-11: 73, 2024-06: 85, 2025-06: 62, 2025-10: 80, spread over
**41 of the 51 months** from 2022-06 to 2026-08 and still arriving in 2026
(2026-06: 2, 2026-07: 3, 2026-08: 5); **996** counting all four statuses.
**Crossing 1 below is live, not historical.**

**What this costs the list** is measured in "How the list was actually acquired"
below. **What follows operationally** is that the integration should be switched
off — the maintainer's decision as at 2026-08-30 — and that consent route 2 has
to be harvested per event instead:
[`../deployment/HUMANITIX_INTEGRATION_SHUTDOWN.md`](../deployment/HUMANITIX_INTEGRATION_SHUTDOWN.md).

### A free channel nobody has looked at: notify-followers

Humanitix offers a free, one-per-event **notify-followers** email when a public
event is published: a template mail with a "Get Tickets" link, to everybody
following the host profile linked to that event, **toggled on by default**. The
full description, sourced to Humanitix's help centre, is in
`EMAIL_RESPONSIBILITY_BOUNDARIES.md` § "One free channel that belongs to
neither". What is worth separating here is the measured from the inferred,
because this is the shakiest ground in the file.

**Measured.** A host profile named **"She Sharp" exists** — one entry under
Account → Hosts, read from the console on 2026-08-30. And via `GET /v1/events`,
re-run for this file: all **59** events carry the same non-null `organiserId`
`5e3388f9a912950007fda1c7`, including the 3 September 2026 Les Mills event
(`6a422a2d01e463796c170142`, published).

**Inferred, and not established.** That `organiserId` *is* the host-profile
link. It is consistent with one, but the API exposes no host-profile object at
all, so the field cannot be matched to the profile the feature requires. **The
honest line is that the prerequisite appears met**, not that it is met — and if
no profile is in fact linked, the whole question below is moot.

**Not established, in two different ways.** Whether the mail has ever been sent
was **deliberately** not tested: the judgement was that the control which would
reveal the toggle's state is the same one that fires the send, so looking costs a
send to real people. **That is a risk judgement, not something Humanitix
documents.** And follower counts are **not exposed by the API** (`follower`
returns zero hits in the OpenAPI document) — but nobody has checked whether the
**console** shows one. There is a help article, "Manage your host profile
followers", that nobody has read. So: *not exposed by the API, and not checked in
the console* — **not** "not available".

### The PII boundary is unchanged

`/v1/events/{id}/orders` and `/v1/events/{id}/tickets` exist in the API and carry
names, emails, mobiles, addresses and live access codes — the `Order` schema
alone lists `firstName`, `lastName`, `mobile`, `email` and `accessCode`.
**`lib/humanitix/client.ts` deliberately does not implement them.** It exports
`listEvents`, `getEvent`, `getCheckInCount` and `listTags`, and nothing else — a
function that does not exist under `lib/` cannot be imported from `app/` by
mistake. Scripts may call the attendee endpoints; nothing under `lib/` may.
Full reasoning: [`PLATFORM_APIS.md`](PLATFORM_APIS.md) § "The PII boundary".

---

## The four crossings

There are only four places data moves between platforms, and knowing which of
them the cutover ends is most of the value of this file. **Two of them survive
switching the Humanitix → Mailchimp integration off, and one of those is
routinely assumed not to.**

| # | From → To | Mechanism | Ends when |
|---|---|---|---|
| **1** | Humanitix checkout opt-in → **Mailchimp `She#`** | The live Humanitix→Mailchimp integration, writing `source: "Mahsa McCauley NZD"` | The integration is switched off |
| **2** | Humanitix checkout opt-in → **`newsletter_subscribers`** | Orders CSV → `normalize-recipients.ts --for-import` → `import-optin-subscribers.ts` | **Never** — it does not use the integration |
| **3** | Mailchimp → **`newsletter_subscribers`** | `import-mailchimp-subscribers.ts` over an export CSV, plus the 2026-08-30 API delta | **Not yet.** The newsletter moved on 2026-08-31, but Mailchimp's sign-up forms are still live, so this crossing has to keep running until they are closed |
| **4** | Mailchimp opt-outs → **the suppression register** | `suppression.ts pull-mailchimp` | **Not yet, and this one outlives the cutover.** Mailchimp still sends event campaigns, so an unsubscribe there is still real and still invisible to us until this is run |

**Crossing 2 is the one that gets confused with crossing 1.** They start at the
same tick-box on the same checkout page and end in different places by different
routes. Crossing 1 is an integration Humanitix runs; crossing 2 is a human
exporting a CSV and running two scripts. **Switching the integration off does not
end crossing 2**, and describing it as "the Humanitix opt-in path" as though it
were one thing gets this wrong — it was got wrong once already on 2026-08-30.
Crossing 2 is `consent-rules.md`'s **route 2**, and it is the only sanctioned way
a registrant becomes a subscriber; `EMAIL_RESPONSIBILITY_BOUNDARIES.md`
§ "The one sanctioned crossing" is the full description.

**Crossing 4 runs in one direction only.** It takes people *off* the send. There
is no crossing that takes people *on* automatically — closing the joiner gap is
a manual export, every month, until Mailchimp's sign-up forms are closed. The
2026-08-31 newsletter cutover did **not** end either crossing 3 or crossing 4;
both live on until the account itself is stopped. See "The gap between Mailchimp
and our table" above.

**What is deliberately not a crossing.** Humanitix's event-scoped unsubscriber
list is not merged into our register; registrant lists are never re-used as
mailing lists; and no query over the rest of the database produces a mailing
list. Each of those is a rule, not an oversight, and each has a home in
`consent-rules.md`.

---

## Decision log

Dated, with what each decision retired. Where a PR is named, the reasoning is in
its diff.

| Date | Decision | What it retired |
|---|---|---|
| **2026-08-28** | Keep **Resend Transactional Pro**; do **not** buy Marketing Pro; self-host the newsletter on the transactional batch API | Buying an ESP's marketing product; the assumption that the consent record lives at a vendor |
| **2026-08-28** | Move `shesharp.org.nz` into the She Sharp-owned Resend team via Domain Claim | The domain living in the maintainer's personal team |
| **2026-08-29** | The consent record is **our database**, not Resend | The Resend segment `95d452f5…` and topic `08e59693…` — both **deleted**, both held 0 contacts; their env vars removed from Vercel; `lib/newsletter/resend-api.ts` and two scripts deleted |
| **2026-08-29** | Import the 2026-08-17 Mailchimp export into `newsletter_subscribers` | The table being empty; 1,560 read, 15 held back by the suppression register, 1,545 written |
| **2026-08-30** | **Registrant mail stays in Humanitix**, composed by hand | `/send-event-emails` (PR #224) — it had never sent anything, its only input was a Humanitix CSV, and the team had done the job in Humanitix for a year |
| **2026-08-30** | The Humanitix event-scoped unsubscriber list is **not** folded into the suppression register; it gates a route-2 import instead | Over-suppressing someone permanently for muting one event years ago (PR #225) |
| **2026-08-30** | Route 2 gets a real tool: opt-in CSV → consent record | Improvising an `INSERT` for routes 2–4 (PR #223) |
| **2026-08-30** | The "checkout opt-in stopped in May 2022" claim is **withdrawn**, replaced by a measurement and an open question | A false statement in two docs (PR #223) |
| **2026-08-30** | Mailchimp is **cancelled, not closed**; the account and its data stay | The reading that cancellation means deletion (PR #229) |
| **2026-08-30** | Live subscriber counts are **not** hardcoded in prose | Stale numbers in eight documents (PR #226) |
| **2026-08-30** | **Do not downgrade Resend Pro** even though the newsletter is now its only justification | The "we could save $20" thread — answered, not open |
| **2026-08-30** | The 2022 checkout-opt-in question is **closed** from the orders CSV: the switch was off, and the integration wrote non-opted-in buyers in regardless | Two surviving readings, both wrong; and the belief that nothing in this repo could settle it |
| **2026-08-30** | **Switch the Humanitix → Mailchimp integration off now**, not at cancellation | `MAILCHIMP_CANCELLATION.md`'s "keep it while Mailchimp is still billing" |
| **2026-08-31** | **Cut over.** The August 2026 issue was broadcast from this repo through Resend's batch API to all **1,549** mailable rows — 16 chunks, `--batch-validation strict`, one idempotency key each, **0 failures** — after a three-stage approval chain ending in the founder's | Every sentence in this repo that said "nothing has ever been sent from `newsletter_subscribers`" or "the live newsletter still goes out from Mailchimp"; the July 2026 issue was the last newsletter Mailchimp ever sent |

**Still open, and now unblocked rather than blocking:** whether the Mailchimp
exit is a **pause** or a **downgrade**, and on what date. The precondition that
used to gate it — the last Mailchimp send preceding the downgrade — is satisfied
for the newsletter. What remains is a decision about *event* campaigns, which are
still composed in Mailchimp's console and would stop with it. The runbook is
written and is founder-only:
[`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md).

---

## What could not be established

Listed so that the next person spends their time on something else, and so that
nobody mistakes an open question for a settled one.

1. ~~**Whether the Humanitix checkout opt-in has been collecting since 2022.**~~
   **Closed 2026-08-30.** It has not: the orders CSV that this item said would
   settle it was already in the vault, and it reads **0 Yes** for every order
   from 2023 onward with no blank cells anywhere. The writes into Mailchimp were
   the integration syncing non-opted-in buyers. See § "The 2022 question is
   closed" above. **The lesson worth keeping is the one about where the answer
   was**: this item named the exact file, and the file had been sitting in
   `private/humanitix/2026-08-17/` for thirteen days. Before recording something
   as unestablished, check whether the thing that would establish it is already
   downloaded.

2. **Whether the notify-followers email has ever been sent** — and, before that,
   **whether a host profile is linked to our events at all.** A "She Sharp" host
   profile exists and every event carries an `organiserId`, but nothing ties that
   field to the profile, so the prerequisite only *appears* met. The send itself
   was deliberately not tested on the judgement that the control revealing the
   toggle also fires it. Somebody publishing the next event can read the toggle
   in the console at publish time — **nobody should press it to find out.**
   Cheapest next step: read the "Manage your host profile followers" help
   article and open the host profile, neither of which sends anything.

3. ~~**What happens to Mailchimp's hosted campaign pages after a downgrade.**~~
   **Made moot 2026-08-30, not answered.** Mailchimp still documents nothing
   about their fate on a downgraded plan; what changed is that the site no
   longer depends on the answer. The **51** live links that pointed at
   `mailchi.mp` and `us3.campaign-archive.com` — the 51 per-campaign card URLs
   counted in `MAILCHIMP_CANCELLATION.md` §4, not a second, rounder estimate of
   the same thing — are now **zero**: every card opens
   `/resources/newsletters/<id>` on this site, and
   `scripts/mailchimp/archive-guard.test.ts` fails CI if one is pointed back.
   The runbook's order still puts the export first, for the same reason it
   always did: it is the step that does not depend on the answer.

4. ~~**How much Humanitix email has actually been sent.**~~ **Established
   2026-08-30**: somebody paged through the console and wrote it down. **127
   campaigns**, six full pages of 20 plus seven on page 7, page 8 empty,
   spanning **2020-07-29 → 2026-08-06** with one September 2026 draft. Still no
   API, no export and no total in the UI, so re-taking it means paging again.
   The list is also the evidence that this mail is composed by hand: the
   campaign names carry typos that propagate across years through the console's
   Duplicate button, and two pairs were sent minutes apart.

5. **How many of the 790 Mailchimp `transactional` contacts have a defensible
   consent story.** They are excluded from every send today, which is the safe
   behaviour, so nobody has needed the answer. If someone ever proposes importing
   them, they must go through `consent-rules.md` from the top like anyone else.

---

## Re-taking every measurement in this file

| Claim | How |
|---|---|
| Subscriber count, opt-outs, register size | `npx tsx scripts/email/suppression.ts reconcile` |
| The 2026-08-31 send itself — chunks, recipient counts, idempotency keys, the approval chain | `.claude/skills/monthly-newsletter/state/issues.json`, issue `2026-08`. It is the ledger, not a report; it records what was *submitted* |
| What actually happened to those 1,549 messages | `npx tsx scripts/email/send-stats.ts` over `email_events`, which the Svix webhook writes. **Nothing in this file establishes a delivery, open or bounce outcome** |
| Status / source / `confirmedAt` breakdown | `GROUP BY` over `newsletter_subscribers` |
| Mailchimp audience counts, last send | `GET /lists/{id}` and `/lists/{id}/members?status=…`, dc `us3` |
| Exactly one audience | `getLists()` in `lib/mailchimp/client.ts` |
| The Mailchimp ↔ our-table gap | Hash both sides with `hashEmail()` and diff; **never write addresses to disk** |
| The consent tiering of the 1,549 | Set union over the two vault exports and the two API pulls, in `hashEmail()` digests; reconstruct the population as the `subscribed` export minus the suppression register plus the API delta, and check it comes to the live figure before trusting it |
| The `Marketing opt-in` column by year | The 2026-08-17 orders CSV, grouping on the four-digit year in `Order date` (`DD/MM/YYYY` — not the first four characters) |
| `timestamp_opt` ↔ `OPTIN_TIME` | Join the vault export against a live pull; the difference is 12h or 13h |
| Humanitix API surface | `curl https://api.humanitix.com/v1/documentation/json` and count `paths` |
| `organiserMailListOptIn` placement | Search that OpenAPI document's `components.schemas` |
| `organiserId` across events | `GET /v1/events` with `x-api-key` |
| The archive page's 20 entries | `curl 'https://us3.campaign-archive.com/home/?u=1bcf1c40837f51b409973326f&id=31bd05e8eb'`; count `<li class="campaign">`. The `MAILCHIMP_CONFIG.archiveUrl` constant this used to name was deleted with `lib/data/newsletters.ts` on 2026-08-30; the URL is the account's own and is kept here only so the measurement stays re-takeable |
| The Humanitix campaign list, its banner, the unsubscriber list, the host profile | **Not re-takeable from code.** Sign in to the Humanitix console and look; there is no API, no export and no history view |

`MAILCHIMP_API_KEY` is **local tooling only** and nothing under `app/` may read
it; it expires **2027-08-27**. Credentials, rate limits and what each pull costs
are in [`PLATFORM_APIS.md`](PLATFORM_APIS.md).

---

## Related

- [`../../.claude/skills/update-mailing-list/references/consent-rules.md`](../../.claude/skills/update-mailing-list/references/consent-rules.md) — who may be emailed. The rule
- [`EMAIL_RESPONSIBILITY_BOUNDARIES.md`](EMAIL_RESPONSIBILITY_BOUNDARIES.md) — which system sends what
- [`EMAIL_PLATFORM_STRATEGY.md`](EMAIL_PLATFORM_STRATEGY.md) — why self-hosting, costed
- [`EMAIL_OPERATIONS.md`](EMAIL_OPERATIONS.md) — streams, webhook, the newsletter loop
- [`../deployment/MAILCHIMP_CANCELLATION.md`](../deployment/MAILCHIMP_CANCELLATION.md) — the exit runbook, bilingual
- [`../deployment/EMAIL_AUTHENTICATION.md`](../deployment/EMAIL_AUTHENTICATION.md) — SPF/DKIM/DMARC and the Resend migration
- [`PLATFORM_APIS.md`](PLATFORM_APIS.md) — the two API integrations and the PII boundary
- [`MAILCHIMP_ARCHIVE.md`](MAILCHIMP_ARCHIVE.md) / [`HUMANITIX_ARCHIVE.md`](HUMANITIX_ARCHIVE.md) — the committed archives and how their numbers go wrong
- [`EVENT_LIFECYCLE_SOP.md`](EVENT_LIFECYCLE_SOP.md) — the opt-in switch, and the 2022 measurement in full
