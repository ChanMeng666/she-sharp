# Reply voice and templates

How a She Sharp reply should sound, and the block structures to build for the
kinds of message that actually arrive. Read this before drafting; it exists so
every reply sounds like the same organisation regardless of who ran the skill.

## Voice

She Sharp is a small Auckland non-profit run largely by volunteers. Replies
should read like a real person wrote them between other commitments — warm,
direct, and specific. Not corporate, not effusive.

- **Warm but brief.** Two to four short paragraphs. Nobody wrote to us hoping
  for an essay.
- **Answer the actual question first.** If they asked "are there mentoring
  places open", the first sentence says yes, no, or when — not "thank you for
  your interest in She Sharp".
- **NZ English.** organisation, programme, enrol, recognise. "Kia ora" is a
  welcome opener when the sender used it; don't force it otherwise.
- **Name the real thing.** Real event names, real dates, real venues, real
  page URLs on `https://www.shesharp.org.nz`. Never "our upcoming events" when
  you can say "the Aotearoa AI Hackathon Festival on 7–8 August at AUT City
  Campus".
- **One clear next step.** A single button, or a single link in a sentence.
  Two calls to action means neither gets taken.
- **Say what you don't know.** "I'll check with the team and come back to you
  this week" is a better reply than a confident guess. If you promise a
  follow-up, tell the user running the skill so they actually do it.

### Never

- Never invent a date, a fee, a capacity, a policy, or a person's availability.
  If the answer isn't in the repo's event data or on the site, ask the user.
- Never quote or paraphrase anything from a private Slack channel.
- Never mention another enquirer — no names, no emails, no "someone else asked
  the same thing".
- Never include a discount, promo, access or registration code. Link to the
  public registration page instead.
- Never sign as a named individual unless the user tells you who is signing.
  The default signature is the team, not a person.

## Default signature block

Unless the user names a signer, close with:

```
Ngā mihi,
The She Sharp team
https://www.shesharp.org.nz
```

The footer of `brandedEmailLayout` already carries the contact email, the logo
and the copyright line — don't repeat them in the body.

## Choosing the sending mailbox

The mailbox shapes how the reply is read, and `--reply-to` must point at an
inbox a human actually watches.

`shesharp.org.nz` receives mail through Google Workspace (its MX records point
at `aspmx.l.google.com`), so every alias below is a real inbox. The
"receiving: disabled" line in `resend domains list` is unrelated — it only means
Resend does not accept inbound mail for the domain, and replies never touch
Resend at all. The real risk is choosing an alias nobody on the team opens.

| Enquiry is about | From | Reply-To |
|---|---|---|
| Anything general (default) | `She Sharp <hello@shesharp.org.nz>` | `hello@shesharp.org.nz` |
| Mentoring — applying, matching, the programme | `She Sharp <hello@shesharp.org.nz>` | `mentoring@shesharp.org.nz` |
| Sponsorship, partnership, a company wanting to help | `She Sharp <hello@shesharp.org.nz>` | `hello@shesharp.org.nz` |
| A problem with the website itself | `She Sharp <hello@shesharp.org.nz>` | `website@shesharp.org.nz` |

Always confirm the pair with the user before the first send of a session; after
that, reuse it silently for the rest of the batch.

## Template 1 — general enquiry

The default. Someone asked a real question and deserves a real answer.

```
Subject: Re: your message to She Sharp

blocks:
  paragraph  Kia ora {firstName},
  paragraph  <Answer their question in the first sentence. Then one or two
             sentences of the specific detail they need — date, venue, cost,
             eligibility, what happens next.>
  button     <Only if there is one obvious page: "See the details" → the real URL>
  paragraph  <If anything is unresolved: what you will do and roughly when.>
  paragraph  Ngā mihi,
             The She Sharp team
```

Keep `{firstName}` as a literal in the spec — `composeMessage` substitutes it
and falls back to `there` when the name is missing.

## Template 2 — mentoring enquiry

Check the live state of the programme before drafting: mentorship applications
were **paused** in June 2026 (see `docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md`
and the chatbot knowledge base, which tracks the current status). Telling
someone to apply through a form that is hidden is worse than saying "not right
now".

```
blocks:
  paragraph  Kia ora {firstName}, thanks for asking about mentoring.
  paragraph  <Current status in plain words: open / paused / next intake and
             when. If paused, say so and say what they can do meanwhile.>
  button     <"About the mentoring programme" → https://www.shesharp.org.nz/mentorship>
  paragraph  <If paused: invite them to the events or the newsletter so they
             hear when it reopens — a link they click themselves, never an
             automatic subscription.>
  paragraph  Ngā mihi,
             The She Sharp team
```

Send these with `--reply-to mentoring@shesharp.org.nz`.

## Template 3 — event registration problem

The most common concrete request: someone missed a deadline, hit a payment
problem, or wants to know whether they qualify. Pull the real event from
`lib/data/json/events-custom.json` (or the archive) before answering — dates,
venue and registration URL must match the live page.

```
blocks:
  paragraph  Kia ora {firstName},
  paragraph  <Directly address what went wrong or what they asked.>
  details    Event      <real title>
             When       <real date and time>
             Where      <real venue>
  button     <"Registration page" → the real public URL>
  paragraph  <What you can and cannot do — e.g. whether late registration is
             possible. If you don't know, say you're checking with the
             organisers and will come back to them.>
  paragraph  Ngā mihi,
             The She Sharp team
```

**Never** paste a registration, discount or access code into the email. Link to
the public page and let the page hand out whatever it hands out.

## Template 4 — sponsorship / partnership

Reached via the sponsor form, so the message arrives with a `[Sponsor Inquiry]`
prefix. Strip that prefix before quoting anything back.

```
blocks:
  paragraph  Kia ora {firstName}, thanks for getting in touch about supporting
             She Sharp.
  paragraph  <One or two sentences on what partnership looks like, grounded in
             the real page — not invented tiers or prices.>
  button     <"Corporate sponsorship" → https://www.shesharp.org.nz/sponsors/corporate-sponsorship>
  paragraph  <Offer a conversation, and say who will follow up.>
  paragraph  Ngā mihi,
             The She Sharp team
```

## Messages that should NOT get a template reply

### Unsolicited vendor outreach (`kind: "vendor-pitch"`)

Agencies pitching web design, SEO, lead generation and "quick calls" arrive
through the same form. The reconcile step flags these, but the flag is
**advisory** — a false positive would bin a real person's message.

Show the user the message and let them choose:
- **No reply** (the usual choice) → `mark-contact-replied.ts --outcome
  no-reply-needed --reason "unsolicited vendor outreach"`. No email is sent.
- **A short decline** → one paragraph, no button, no warmth theatre:
  "Kia ora — thanks for reaching out, but we're not looking for this at the
  moment. Ngā mihi, The She Sharp team."

Never mark a vendor-pitch row without the user saying so in this session.

### QA / test rows (`kind: "qa-test"`)

Submitted by the team while testing the form. Mark them reviewed, send nothing:
`--outcome no-reply-needed --reason "QA test row"`.

### Anything involving a minor, a safeguarding concern, or a complaint

Stop and hand it to the user. Examples: a parent asking whether a
thirteen-year-old can attend, a code-of-conduct report, anything about someone's
personal safety or immigration status. Draft nothing; summarise the message and
say plainly that this one needs a human decision before a reply goes out.

## Length and gates

Replies are short, so the gates should be quiet. If `render-message.ts` reports
anything, the usual causes are:

- **`absolute-urls`** (blocks the send) — a link was written as `/mentorship`
  instead of `https://www.shesharp.org.nz/mentorship`.
- **`single-cta`** (warning only) — two buttons. Pick one.
- **`subject-length`** (warning only) — trim to 50 characters.

Separately, `render-message.ts` prints a **`Redactions to confirm`** list. That
is *not* a gate — nothing is blocked and nothing turned red. It is a list of
things in the draft that often should not be in an email: a booking link, a
shared Google Doc, a code-shaped string, an outside email address. Read each
one, decide, and then declare what you removed on the plan block's
`Redactions:` line so the user can overrule you. An empty list still means you
write `Redactions: none` — the point is that the decision was made out loud.
