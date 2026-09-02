# Newsletter sign-up surfaces

Where the website asks for a newsletter address, why it asks there, and the two
mechanisms that stop eight forms behaving like eight different products.

The consent rules themselves are not here. They are in
`.claude/skills/update-mailing-list/references/consent-rules.md`, and everything
below defers to them: this file is about **the website's own route 1**, the
double opt-in form, and nothing else. The Humanitix checkout tick-box is route 2
and lives in `EVENT_LIFECYCLE_SOP.md` § "The ticket page".

---

## Why there are now eight of them

Until 2026-09-01 the site had exactly **one** sign-up form, at
`/newsletter/subscribe`. Six other "entry points" were plain links to it, and
**four of those six were behind `!applicationsOpen`** on the mentorship pages —
visible only while mentorship applications are paused, and due to vanish the day
they reopen.

The result was measurable and it was zero. On 2026-09-01, of the **1,543**
mailable people in `newsletter_subscribers`, **not one carried
`source = 'website-form'`**. The website's own form had never produced a
subscriber, and that is still true as at 2026-09-02.

**Say it that way round, because the stronger version has already stopped being
true.** Until 2026-09-02 this paragraph said every row carried
`source = 'mailchimp-import'`, which was a claim about the whole table rather
than about the form. Nine `registration-optin` rows were imported that day — the
Humanitix route-2 harvest — so the table now has two sources and the sentence
would read as false while the point it was making is intact. The measurement that
matters here is a count of `website-form` rows, not the absence of every other
source:

```sql
SELECT source, count(*) FROM newsletter_subscribers GROUP BY source;
```

Over the same period the Humanitix checkout tick-box — one checkbox,
asked at the moment somebody was already committing to something — converted at
about **40%**.

The site was not an acquisition channel. It is one now, and the shape of the
change is: **ask where the person has just demonstrated interest**, not only on
a page they have to go looking for.

| Placement key | Where | Why there |
|---|---|---|
| `newsletter-page` | `/newsletter/subscribe` | The explainer. Still the destination every inline form links to, and the only one that asks for a first name |
| `footer` | every page | The baseline. Was a button to the page; is now the field itself |
| `home` | between testimonials and the sponsor wall | After the emotional peak, before the section people scroll past. Deliberately **not** beside `CTASection`, whose Donate / Come-to-an-event pair should stay uncontested |
| `events-index` | `/events`, **after** the list | Somebody who has scrolled ~90 events without finding an upcoming one has demonstrated interest and has no other next action |
| `event-page` | `events/[slug]`, after the info sections | `isPast`-aware. On an upcoming event it is quiet and low, never competing with the ticket CTA. On a past one it becomes the primary forward action |
| `event-feedback` | the feedback form's success panel | The highest-intent moment there is. See "The tick that promised nothing" below |
| `newsletter-archive` | `/resources/newsletters` | Literally the archive of the thing |
| `mentorship` | `mentorship-cta-section.tsx` only | **One** of the four mentorship CTAs. The other three stay links: they share the `!applicationsOpen` condition and can appear on one page, and four forms on one page is spam, not distribution |

---

## One component, and the copy that must not drift

`components/newsletter/newsletter-signup.tsx` is the only sign-up form in the
codebase. `app/(site)/newsletter/subscribe/subscribe-form.tsx` was deleted into
it.

**The hedged success copy is a module constant that `labels` cannot reach.** A
200 from `/api/newsletter/subscribe` means "your request was accepted", not "an
email was sent" — the same 200 comes back for an address already on the list,
one on the suppression register, and a honeypot hit, precisely so the endpoint
cannot be used to test whether an address is subscribed. Copy saying "we've sent
you an email" would be a lie in three of those four cases.

That hedge survived fine while there was one form. With eight, it is the single
thing most likely to be locally "improved" into something confident and wrong,
by somebody who has not read this paragraph. Hence: one copy, unreachable from
props, and **deleting the constant must fail every call site's compile**.

The honeypot is unconditional and internal — no prop can disable it.

### Two forms on one page

The footer form is on every page, so a visitor who signs up from a page section
is looking at a second, still-inviting form the moment they finish. Submitting
it again spends another slot of a shared rate budget and achieves nothing.

On success the component writes a `sessionStorage` marker and every mounted
instance in that tab switches to the success panel, with a quiet "subscribe a
different address" link that clears it. The marker is **local only and says
nothing about server state** — it records that this browser pressed the button,
not that anything happened on the list — so it does not weaken anti-enumeration.
Every storage access is wrapped, because a private window throws.

---

## `placement` → the consent sentence

`lib/newsletter/placements.ts` holds a closed list of placement keys and a
`Record` mapping each to one fixed sentence. **The client sends a key and never
prose**, so a public endpoint cannot write arbitrary text into the audit record —
the same shape as `composeConsentSource()` in `scripts/email/optin-rows.ts`.
Adding a placement means adding it in that one file; the `Record` will not
compile until the new key has a sentence.

`consent_source` is the sentence somebody would have to stand behind if a
recipient ever asked why they were mailed, so each one answers "where did this
person opt in?" — `Website newsletter signup form — post-event feedback
confirmation`, and so on. A request naming no placement keeps the original
`Website newsletter subscribe form`, so an older cached bundle still writes a
row that looks like the rows before it.

`source` stays `"website-form"` for all eight. `SubscriberSource` in
`lib/newsletter/subscribers.ts` is a closed union describing the *mechanism*,
and "which form on the website" is not a new mechanism.

---

## Rate limiting: why it is two tiers now

The endpoint was limited at **5 per hour per IP**. Malformed bodies are rejected
by zod and honeypot hits return 200 **before** the limiter, so only well-formed
human submissions ever spend budget. That was correct for one form on one page.

It breaks the moment the form is in the post-event feedback panel: **a hall of
forty attendees sits behind one NAT'd venue IP**, all finishing within minutes of
each other, and the sixth person reads a 429 as "the site is broken". That is
the same failure `app/api/event-feedback/route.ts` already had to design around.

So:

| Client sends | Limit |
|---|---|
| the device id it already mints for the feedback form (`DEVICE_HEADER`) | **3/hour per `ip:device`**, under a **30/hour per-IP ceiling** |
| nothing | **5/hour per IP**, unchanged |

The device id is sent only from `placement === "event-feedback"`.

**The IP ceiling is not optional and must not be removed.** The device id is
client-supplied, so a limiter keyed on it alone would be a limiter anyone can
opt out of by clearing storage. It is a fairness key layered *under* a real
ceiling, never a replacement for one. A malformed device header falls back to
the IP-only limiter rather than being rejected.

Every limiter degrades **open** when Redis is missing or throwing. Locking a room
out of a sign-up form is worse than a few junk `pending` rows, which are never
confirmed and expire on their own.

---

## The tick that promised nothing

The event feedback form has an "interested in newsletter" checkbox writing
`event_feedback_submissions.interested_in_newsletter`. It subscribed nobody, by
design — the schema comment says so, and `scripts/events/feedback-interests.ts`
exists only so a human can read the ticks out by hand.

The success panel now **delivers** on it without ever implying the tick did
anything:

- ticked → "You ticked *Monthly newsletter*. That tells us you're interested —
  it hasn't put you on the list. Nobody joins without confirming from their own
  inbox. Want the link?"
- not ticked → the same block with a neutral heading. The tick is not consent
  either way, so it cannot gate the *offer*, and somebody who simply missed the
  checkbox should not be locked out.

The form is prefilled with the address they just typed, still editable, and goes
through the ordinary endpoint: honeypot, rate limit, `pending` row, confirmation
email. **The feedback POST is unchanged and still subscribes nobody.**

`interested_in_newsletter` keeps being written, and **the two records are never
joined**. That is deliberate: if they were, a tick would eventually be read as
evidence of a subscription, which is exactly the confusion that put 752 people
on this list for no recorded reason.

---

## The failure mode that is silent

`app/CLAUDE.md` warns that a `cookies()`, `headers()` or DB read in the wrong
place opts pages out of static rendering. **It was verified by breaking it**, on
2026-09-01: adding `await headers()` to the new home section flipped `/` from
`○` (static) to `ƒ` (dynamic) and **the build still exited 0 with no warning**.

Two things worth keeping from that:

- only the page carrying the offending component flips, not the whole site —
  the root layout is the case that takes everything with it;
- nothing tells you. The only way to see it is to read the route table.

So when touching these components, diff the `CI=true npx next build` route table
before and after. On 2026-09-01 the correct answer was 154 routes with zero
`○/●/ƒ` changes, `/` prerendered, and `events/[slug]` still generating 98 paths.

Clear `tmp/` before a local build — it breaks the build otherwise.

---

## Where the live numbers are

Not here. Every figure above carries the date it was taken and none of them is
current. The size of the list is read from the `Mailable after suppression` line
of:

```bash
npx tsx scripts/email/suppression.ts reconcile
```

To find out how a given placement is actually doing, group by `consent_source` —
which is the reason the placement is recorded at all:

```bash
npx tsx scripts/email/inspect-subscribers.ts --email someone@example.com
```

reads one row's provenance, masking the address.
