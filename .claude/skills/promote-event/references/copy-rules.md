# Copy rules for an event announcement

Only what is specific to announcing an event. The pre-send gates, their failure
messages and how to recover from each are in
`.claude/skills/email-the-community/SKILL.md` (Step 3) — do not duplicate them
here or in your head.

## The email is a doorway, not the event page

The announcement has one job: make someone who has never heard of this event
click through while the tickets are still there. Everything that does not serve
that click belongs on the page.

| In the email | On the event page |
|---|---|
| The title, and the one line that says what it is | The full description |
| When, where, who is speaking, who it is with | Speaker bios |
| One button to register | The running order and the agenda |
| A link to the page for everything else | Photos, sponsors, past years |

Two practical reasons, not taste. Gmail clips a message above ~102KB **and hides
the footer with it**, which takes the unsubscribe link out of the email — the
`size-100kb` gate fails before that happens. And a fact that exists in two places
is a fact that will disagree with itself the first time the venue changes: the
page can be corrected, the email cannot.

## Subject — 50 characters, at most one emoji

Longer truncates mid-word on a phone, which is where most of this list reads
mail. Two or more emoji reads as spam to both filters and people.

The generator defaults to the event title, falls back to the subtitle when the
title is too long, and truncates only as a last resort — it says which it did.
When it truncated, write a real one with `--subject`.

A good subject says what the reader gets, not what the organisation is doing.
"AI is everyone's job now" beats "She Sharp x Les Mills — September event".

## Preheader — 120 characters, and never an echo

The preheader is the grey line the inbox shows *beside* the subject. Repeating
the subject there wastes the only other line you get, and trips
`preheader-length`.

Default: `<Weekday D Month YYYY, time> · <venue>` — the two facts a subject has
no room for. If you override it, keep it additive: a second hook, or the detail
that decides whether someone comes.

## One CTA

One button, one URL, the registration link. Two buttons split the clicks and
neither gets pressed (`single-cta` warns about it). Everything else — the event
page, a speaker's LinkedIn, last year's photos — goes inline in a paragraph as
`[label](url)`, or does not go at all.

If the event has no registration URL, the button points at the event page and
the generator says so. Add the ticketing link to the event record rather than
pasting one into the spec: the website needs it too.

## Cover image — JPEG or PNG, or nothing

Outlook (every desktop version) cannot decode WebP and draws a broken-image box
where the poster should be, so `image-format` fails on it. Most She Sharp event
art is WebP, which is why an announcement often has no cover — and a cover-less
announcement is perfectly good.

To get one: `npx tsx scripts/events/build-event-poster.ts <slug> --only social`,
then re-run the generator. Never hand-edit a `.webp` URL into the spec, and never
write a cover URL for a file that is not on disk.

## Redaction — the rule with an incident behind it

**Never put a registration, access, promo or discount code in the email.**

On 2026-06-11 an event page published its registration codes. Fixing it took a
git history rewrite and a rotation of every code. An email cannot be rewritten at
all: once it is in the inboxes, the code is out, and the only remaining control
is invalidating it.

So the generator strips any access/promo/discount-shaped query parameter from the
registration URL, publishes the public base link, and prints a `Redactions:` line
naming the parameters it removed — never their values. It also scans the copy for
code-shaped tokens.

Two obligations that follow:

1. **Read the `Redactions:` line into the plan block**, verbatim, including when
   it says `none`. It makes the omission visible and lets the user overrule it.
2. **Do not put a stripped code back.** If some people genuinely need a code,
   they need an individual email — that is fulfilment, and it is
   `/send-event-emails`.

The same applies to anything else that is not public: a Slack archive link, an
editable Google Doc, a preview deployment URL, a Zoom link carrying a passcode.
The gates list these as "Redactions to confirm" rather than failing on them,
because only a human can tell an internal link from an intended one.

## Voice

Same as the rest of She Sharp: direct, warm, no exclamation marks stacked up, no
"we're SO excited". Sign off `Ngā mihi,` / `The She Sharp team` — the generator
already does.

Never write a fee, a capacity, a deadline or "limited spaces" that is not in the
event record or on the live page. A broadcast is the organisation's public
promise to its whole community, and it cannot be corrected quietly.
