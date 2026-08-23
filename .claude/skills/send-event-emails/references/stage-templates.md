# Stage templates

Four emails, one event, one job each. Every spec here is a `MessageSpec`
(`lib/email/message.ts`) with `engine: "layout"` and `category: "transactional"`
— these fulfil something the person signed up for; they are not a campaign.
Fill the bracketed slots from `resolve-event.ts` output, never from memory.

## Rules that apply to all four

- **`category: "transactional"`, always.** `"marketing"` on a registrant list is
  refused by `assertSendAllowed` before anything renders, and correctly so:
  registering is not subscribing.
- **Every email ends with one line saying why they got it**, as a plain
  paragraph: `You're receiving this because you registered for <title> on
  <date>.` No exceptions, including the thank-you.
- **One CTA.** A single `button` block. Two trips the `single-cta` gate and
  neither gets clicked.
- **Titles, dates, times and venue come from `resolve-event.ts`** — copy the
  strings verbatim. When it warns the event is multi-day, quote its `Time`
  string as-is rather than writing "on the 7th".
- **Never include a registration code, discount code, access code, or a meeting
  link with an embedded passcode.** A code in an outbound email is uncontrolled
  distribution and cannot be recalled; the repo has had a real leak (June 2026)
  that needed git history rewritten and the codes rotated. Link the public page.
  If a door genuinely needs a code, write "the team will meet you at reception".
- **`{firstName}` stays a literal** — `composeMessage` substitutes it per
  recipient and falls back to `there`.
- **All URLs absolute** (`https://www.shesharp.org.nz/…`). Email clients have no
  base URL; a site-relative link fails the `absolute-urls` gate.

### Voice

Same voice as the contact-form replies — read
`.claude/skills/reply-to-contact-messages/references/reply-voice-and-templates.md`
if you have not. Warm, direct, written by a real person between other
commitments. NZ English (organisation, programme, recognise). Real venue names,
never "our venue". Two to four short paragraphs. No "we're thrilled to
announce". Sign off, unless the user names a signer:

```
Ngā mihi,
The She Sharp team
```

The layout footer already carries the contact address, logo and copyright —
don't repeat them. From `She Sharp <info@shesharp.org.nz>`, Reply-To
`events@shesharp.org.nz` unless the user names another mailbox.

`shesharp.org.nz` receives mail through Google Workspace, so its aliases are
real inboxes — the "receiving disabled" line in `resend domains list` only means
Resend does not accept inbound mail, and replies never touch Resend anyway. The
failure mode to avoid is naming an alias nobody on the team actually opens,
especially on a day-before email where someone may reply asking where to go.

## Which fields each stage needs

| Stage | When | From `resolve-event.ts` | From the user |
|---|---|---|---|
| `welcome` | Right after the export | title, date, time, venue, address, event page, add-to-calendar | nothing |
| `week-before` | ~7 days out | title, date, time, venue, address, event page | agenda outline, parking/transport |
| `day-before` | ~1 day out | title, time, venue, address | room/level or join link, on-the-day contact |
| `thank-you` | 1–2 days after | title, date, venue, gallery URL | feedback form URL, photo album URL |

Ask for the right-hand column before drafting. Never invent a room number, an
agenda, a parking arrangement or a contact person.

## `welcome` — you're in

Confirms the registration is real and gets the date into their calendar while
they are still thinking about it.

```
subject:   You're registered — <short event title>
preheader: <Date>, <venue>. Everything you need.
title:     You're registered

blocks:
  paragraph  Kia ora {firstName},
  paragraph  <One sentence confirming the registration, naming the event.>
  details    Event   <title>
             When    <the Time string, verbatim>
             Where   <venue name, address>
  button     Add it to your calendar → <addToCalendarUrl>
  paragraph  <One or two sentences on what the evening actually is — grounded
              in the event's own description, not invented.>
  paragraph  <If plans change, tell us: just reply to this email.>
  paragraph  Ngā mihi,
             The She Sharp team
  paragraph  You're receiving this because you registered for <title> on <date>.
```

No add-to-calendar link (no start time in the record)? Drop the button, put the
event page in a `link` block, and do not guess a start time.

## `week-before` — what to expect

The planning email. Agenda and getting-there detail belong here so the
day-before email can stay short.

```
subject:   <Short event title> is next week
preheader: <Weekday> <date> at <venue> — agenda and how to get there.
title:     One week to go

blocks:
  paragraph  Kia ora {firstName},
  paragraph  <One sentence: it's a week away, here's what to expect.>
  details    When    <the Time string, verbatim>
             Where   <venue name, address>
  heading    On the night           <or "On the day">
  paragraph  <Agenda from what the user gave you. Times only if they stated them.>
  heading    Getting there
  paragraph  <Parking, transport, which entrance — the user's words. Say
              "we'll send the room number the day before" if that is true.>
  button     Event details → <eventPageUrl>
  paragraph  <Can't make it any more? Let us know so we can free the spot.>
  paragraph  Ngā mihi,
             The She Sharp team
  paragraph  You're receiving this because you registered for <title> on <date>.
```

## `day-before` — practical details only

The shortest of the four. One job: get them through the right door at the right
time. Anything not needed tomorrow belongs in `week-before`.

```
subject:   Tomorrow: <short event title>
preheader: <Time>, <venue>. Room and arrival details inside.
title:     See you tomorrow

blocks:
  paragraph  Kia ora {firstName},
  paragraph  <One sentence: it's tomorrow, here are the details you need.>
  details    When       <the Time string, verbatim>
             Where      <venue name, address>
             Room       <level / room name from the user>
             On arrival <reception, lift, who to look for>
  info       <Optional tinted box for the one thing people get wrong: "The
              Wellesley Street entrance locks at 5pm — use the Mayoral Drive
              doors." Raw HTML, one or two lines.>
  paragraph  <Running late? Reply to this email — <name> will be on their phone.>
  button     Event details → <eventPageUrl>
  paragraph  Ngā mihi,
             The She Sharp team
  paragraph  You're receiving this because you registered for <title> on <date>.
```

Online event: replace `Room` / `On arrival` with `Join link` — but only if the
link carries **no passcode**. A `…?pwd=<something>` URL is a credential; send
the plain meeting URL and have the host admit people from the waiting room.

## `thank-you` — and one honest invitation

Sent one or two days after. Thanks, feedback, photos, and the only place a
subscription is ever mentioned — as a link they choose to click.

```
subject:   Thanks for coming to <short event title>
preheader: A two-minute feedback form, and the photos.
title:     Thanks for coming

blocks:
  paragraph  Kia ora {firstName},
  paragraph  <One or two sentences that could only have been written about THIS
              event — a real moment, the real speaker, the real room. Generic
              thanks reads as automated, because it is.>
  button     Tell us how it went → <feedback form URL from the user>
  paragraph  <Photos are up: [see the album](<gallery URL>).>   (omit if none)
  paragraph  Want to hear about future She Sharp events?
             [Join our mailing list](<the site's own subscribe URL>) — it takes
             a second and you can unsubscribe any time.
  paragraph  Ngā mihi,
             The She Sharp team
  paragraph  You're receiving this because you registered for <title> on <date>.
```

The subscribe URL is whatever the site's own "Subscribe to Newsletter" button
points at — read it from `MAILCHIMP_CONFIG.subscribeUrl` in
`lib/data/newsletters.ts`, don't type a guess. If the user would rather point
people at the Resend list `update-mailing-list` manages, ask which they mean.

**That line is a link and only a link.** Never add an attendee to a mailing list
because they came to an event. Imports happen in `update-mailing-list`, with a
recorded opt-in source and date, or they do not happen.

## Gates you will actually meet

`render-message.ts` runs these before anything can be sent. `absolute-urls`
(fail) — a link written as `/events/…`; rewrite it full. `single-cta` (warn) —
two buttons; demote one to a `link` block or an inline `[label](url)`.
`subject-length` / `preheader-length` (warn) — trim to ~50 / ~120 characters.
`secret-scan` (fail) — a token-shaped string, usually a meeting link with a
passcode. `image-format` (fail) — WebP or a site-relative image; these templates
use none. `redaction-scan` is an advisory list, not a gate: whatever it names,
declare it on the plan block's `Redactions:` line so the user can overrule you.
