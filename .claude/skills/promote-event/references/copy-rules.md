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

## The three stages say different things

One event gets up to three emails, and they are three messages rather than one
message sent three times. What each carries is fixed in the generator's stage
table, so the difference cannot quietly erode into a changed headline:

| | `save-the-date` | `line-up` | `last-call` |
|---|---|---|---|
| Leads with | the description | the description | the **When/Where table** |
| Speaker names | **withheld** | named | named |
| Full description | included | included | **dropped** |
| Preview text | the day, **no time** | day and time | `This <Weekday>` inside a week |
| Button | `See the details` → the **event page** | `Register` → the ticket link | `Book your seat` → the ticket link |
| Subject | `Save the date: …` | the event title | `Last call: …` |

Three reasons those are the differences and not others:

- **The line-up is the campaign's one scoop.** Spending it in the save-the-date
  leaves the second email with nothing new to say. It is also the fact most
  likely to still be changing six weeks out — speaker bios and headshots are
  routinely late, sometimes two weeks out.
- **A save-the-date asks for a diary entry, not a ticket.** At six weeks out the
  Humanitix page usually does not exist (it goes live at T-4w), so the button
  points at the event page, which is correct at every point in the campaign.
  The generator withholds the registration link even when the record has one,
  and says so in `Left out on purpose`.
- **A last call is read by someone who already decided.** What they still need is
  when and where, not a third reading of the pitch — so the table goes above the
  prose and the description is dropped. That also keeps the third email the
  shortest, which is the one people are least willing to read.

**A stage sent outside its window is refused, not warned about** (exit 4), and
there is no override flag. The window is the lifecycle SOP's own beat. Writing
"last call" on an email that lands three weeks out is not early — it is untrue,
and it cannot be corrected once sent.

## Subject — 50 characters, at most one emoji

Longer truncates mid-word on a phone, which is where most of this list reads
mail. Two or more emoji reads as spam to both filters and people.

The generator defaults to the stage's prefix plus the event title, falls back to
the subtitle when the title is too long for what the prefix leaves, and truncates
only as a last resort — it says which it did. When it truncated, write a real one
with `--subject`. The prefix is kept and the title shortened around it, never the
other way round: the prefix is what makes the second and third email read as new.

**Never reuse an earlier stage's subject.** Three sends with one subject line are
one message delivered three times, and that is what earns a complaint rather than
an unsubscribe — which matters because the account complaint ceiling is 0.08% and
is shared with password resets and donation receipts.

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
   they need an individual email — that is fulfilment, and it is sent from
   Humanitix -> Email campaigns, not from this repo.

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
