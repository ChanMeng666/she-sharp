---
name: build-event-slides
description: Build the presentation deck for one She Sharp in-person event — generating it from the event's own data, then confirming, trimming, linting, previewing and deploying a slide deck at `/present/<event-slug>`. Use whenever someone wants slides or a presentation for an event — phrases like "make slides for the AUT event", "we need a presentation for Thursday's meetup", "build the deck for our next event", "update the hackathon deck", "presentation for the panel night", "event slides", "给 X 活动做幻灯片", "活动幻灯片", "把这场活动的 PPT 做出来" — or anything about a projector, a run sheet on screen, a title slide, an opening or closing karakia, or a deck for a host to click through. Also covers correcting an event fact so the website and the slides stay in agreement. The run sheet, speakers, hosts and sponsors come from `lib/data/json/events-custom.json` and are read live, so a correction goes into the event data rather than into the deck. Covers the fixed organisational sequence, the evening-event template, the accent colour taken from the poster, where photos live, the enforced copy limits, the multi-screen preview pass, and the merge-to-deploy path. Assumes the event is already in the repo — `sync-event-from-slack` puts it there.
---

# Build the slide deck for one event

The person you are working with runs She Sharp events. They do not write code and
they must never be asked to. They know the room, the run sheet, the speakers and
the sponsors. Your job is to get that out of their head and onto a projector.

Four facts shape everything below.

- **The event data is the single source of truth, and the deck is a view of
  it.** Title, date, time, venue, speakers, sponsors, run sheet and poster live
  in `lib/data/json/events-custom.json`. The deck file does not copy them — it
  *reads* them, on every build, through `lib/deck/event-source.ts`. So the
  public event page and the projector cannot disagree, and **a correction goes
  into the event data, never into the deck.** When the organiser says "actually
  Gemma's title has changed", you edit the JSON; the website and the slide both
  follow. See *Correcting a fact* below — this is the rule the whole skill turns
  on.
- **A deck is plain data.** One file under `lib/deck/decks/`, generated from the
  event and registered automatically, rendered at `/present/<slug>`. Nobody
  hand-writes HTML or CSS, and the author never sees either.
- **The deck is built out of She Sharp's own photographs.** Not a white canvas
  with a purple accent — twelve years of real rooms, used as mass. One
  photograph shown as a subject keeps its colours; photographs used many at a
  time go purple. `references/slide-types.md` explains why, and it is worth
  understanding rather than just obeying.
- **The limits are enforced, not suggested.** `lib/deck/lint.ts` fails a deck
  whose title runs to nine words, and it also fails a deck that is *shaped*
  badly — too many similar slides in a row, too few dark ones, a kicker that
  just repeats the title. When it fails, **the deck changes** — you fix it and
  read the change back for approval.

Commands are PowerShell-first. Nothing is committed or deployed until the author
has seen the deck on screen and said yes.

## When to apply

Trigger conditions (examples — don't wait for an exact match):

- "make slides for the AUT event" / "给 AUT 那场做幻灯片"
- "we need a presentation for Thursday's meetup"
- "build the deck for the hackathon"
- "update the hackathon deck — the run sheet changed"
- "can you put together the slides for the panel night"
- "活动幻灯片" / "把这场活动的 PPT 做出来"

## When NOT to apply

| The ask is | Use instead |
|---|---|
| Put the event on the website in the first place | `sync-event-from-slack` |
| Email the people who registered | `send-event-emails` |
| Tell the mailing list about the event | `email-the-community` |
| The monthly newsletter | `monthly-newsletter` |

## What the author gives you

**One thing: the event.** However vaguely — "the AUT one", "Thursday's meetup",
a slug. Almost everything else is already in the repo, so most of the interview
is you *reading facts back* and them saying yes or correcting you — not them
answering twenty questions. Follow `references/content-checklist.md`.

| Where it comes from | What you do |
|---|---|
| Which event? | Whatever they said — Step 1 resolves it and reads it back |
| Run sheet, speakers, hosts, sponsors | Already in the event data. **Read back, don't ask.** A correction goes into the JSON |
| Accent colour | `scripts/deck/accent-from-poster.ts` ranks the poster's colours; you pick and say which in plain words |
| Break length | Taken from the run sheet's own timings, never a default |
| Karakia | She Sharp's standing karakia, read back once for confirmation |
| Table prompts, what to say | **Ask.** These exist nowhere and only they know them |
| Photos | Their own; the archive as a named fallback |
| Feedback form link | Already handled — She Sharp's own form at `/f/<code>`, derived from the event slug |
| Ambassador form link | Already handled — the standing form in `AMBASSADOR_FORM_URL` |

## Correcting a fact

When the organiser corrects any event fact — a speaker's job title, a timing, a
venue, the subtitle — **the correction goes into
`lib/data/json/events-custom.json` first**, and the deck picks it up with no
edit of its own.

Rules, all of them hard:

1. **Only inside `detailPageData`.** Never touch `id`, `slug`, or anything above
   it. The slug is the feedback code, the deck route and the public URL.
2. **Read the change back before you make it**, in the organiser's own terms:
   "I'll change Gemma's title to *Global Comms Director* — that will update the
   event page on the website as well as the slide. Yes?"
3. **Commit it on its own**, as `fix(events): …`, separately from the deck
   commit. A data correction and a deck build are two different reviews.
4. **Never edit a fact into the deck file to avoid editing the data.** That is
   exactly how the website and the projector come to disagree, and the
   disagreement is invisible until someone in the room notices.

If the event is not in the repo at all, this skill does not create it — stop and
run `sync-event-from-slack`.

## Prerequisites

1. **Working directory is the repo root** (it has `lib/deck/types.ts`).
2. **The event is in `lib/data/json/events-custom.json`.** Not there → stop and
   run `sync-event-from-slack` first. A deck built around an unverified date is
   how the wrong date reaches a projector.
3. **Node 22 and dependencies installed** (`npx pnpm@10 install`).
4. **A branch to work on.** `feat/deck-<event-slug>` off `main`.

---

## Step 1 — Identify the event

Find it in `lib/data/json/events-custom.json` by slug or by title. Read back to
the author, and wait for a yes:

```
Event   : Aotearoa AI Hackathon Festival 2026
Slug    : aotearoa-ai-hackathon-festival-2026
When    : 7–8 August 2026, 9:00am–5:00pm NZST
Where   : AUT City Campus, 55 Wellesley Street East, Auckland
Deck URL: /present/aotearoa-ai-hackathon-festival-2026
```

The deck slug **is** the event slug, so `/present/<slug>` mirrors
`/events/<slug>`. Don't invent a shorter one.

**Several candidates** — She Sharp has run a same-named event most years. List
them with dates and let the author pick; never take the top row.

**Nothing matched** — the event is not in the repo. Stop here and say so:

> That event isn't on the website yet, and the deck reads its date and venue
> from there. Let's run `/sync-event-from-slack` first so the slides can't
> contradict the event page — then I'll build the deck.

**The deck already exists** (a file under `lib/deck/decks/`) — this is an
update, not a build.

- **A fact changed** (a name, a time, a title): edit the event JSON. The deck
  reads it live, so there is usually **nothing to regenerate**. Re-run Steps 6
  and 7 anyway — a longer job title can still overflow a slide.
- **The shape changed** (a whole new speaker group, a run sheet where there was
  none): regenerate with `--force`, but **read the existing deck first** and
  carry over every host note, kicker and photograph the author already
  approved. `--force` overwrites hand-written copy and there is no undo.

## Step 2 — Read it back, then fill the gaps

Work through `references/content-checklist.md`. It is grouped into short rounds
on purpose.

**Most of this is confirmation, not interrogation.** The run sheet, the
speakers, the hosts and the sponsors are already in the event data. Read them
back as a short list and ask "is this still right?" — one question instead of
four, and the answer is usually yes. Only when they correct something do you go
and edit the JSON (see *Correcting a fact*).

What is genuinely not in the repo, and so must be asked: the table-discussion
prompts, what the host should say on each slide, whether there is a prize draw,
which upcoming events to preview, and the kickers.

**Ask one round at a time. Never dump twenty questions at once.** A wall of
questions gets one answer to the first and silence for the rest. Ask three or
four, listen, reflect back what you heard, then move on.

Three habits that make this work:

- **Take the answer in their words and shorten it yourself.** They say "so the
  idea is that people who've never touched an AI tool before can come along and
  build something in a day without needing to know how to code" — you write
  *"Build something real in a day, no code required"* and read it back.
- **"I don't know" is a real answer.** The checklist says what to do with each
  one — a sensible default, a slide dropped, or a question parked for later.
  Never fill a gap by inventing a fact.
- **Keep the asides, not just the answers.** *"Oh, dinner's out when people walk
  in"* is not a digression from the run-sheet question, it is a finished kicker
  for the run-sheet slide. Every slide needs one and you will not get them by
  asking directly.

**The karakia is a read-back too.** The deck defaults to She Sharp's standing
karakia (`lib/deck/karakia.ts`). Say which ones they are and ask whether the
person opening the evening will read those or something of their own — a venue
with its own mihi is common and the deck should carry theirs.

## Step 3 — Set the colours

Every deck carries an accent pair: one colour for light slides, one for dark.
The pair is not decoration. She Sharp's brand purple `#9b2e83` scores 2.92:1
against the dark canvas — under even the 3:1 large-text floor — so a dark slide
needs a lighter partner or the text is unreadable from the back of the room.

Read the colours off the poster:

```powershell
npx tsx scripts/deck/accent-from-poster.ts <event-slug>
```

It prints the poster's candidate colours, most likely first, each already run
through `accentFromBrandColour()` — which keeps the hue and fixes the luminance
per canvas — with its contrast measured. Paste the `theme` block it prints into
the deck file.

**Look at the poster before you take its top answer.** The ranking scores area
as well as vividness, and on a poster with a big flat ground the background can
still win. The Les Mills poster is a navy field holding a teal photo panel and a
neon pink headline: navy ranked first at 51% of the poster's colour, and the
right answer was the pink at 15%, because **a background is the one colour never
to take**. That is why the script prints a list instead of an answer.

`lint-deck.ts` re-checks the contrast in Step 6, so an unreadable pair cannot
reach a projector — but it cannot tell you that you picked the wallpaper.

**Then explain the result in plain language, without the numbers:**

> Your poster's purple is lovely but it's too dark to read on the black slides,
> so those use a lighter version of the same purple. On the white slides it
> stays exactly as it is on the poster.

No poster, or the author would rather stay on brand: use `sheSharpTheme` from
`lib/deck/theme.ts` and say so.

**The accent is not the same thing as the duotone.** The accent is this event's
colour, taken from its poster, and it is what tints headings, rules and the
timer ring. The purple laid over photographs used en masse is **always She Sharp
purple**, whatever the poster says. Expect to explain that once:

> The teal from your poster runs through the headings and the timer. The photo
> walls stay purple — that's the organisation's colour rather than this event's,
> and it's what makes twelve years of photos taken in twelve different lighting
> conditions read as one thing.

## Step 4 — Collect the assets

Read `references/assets.md` for the full detail. In summary:

- Event photos go in `public/img/decks/<event-slug>/`, named for what they show:
  `group-photo.jpg`, `venue-atrium.jpg`, `judges-panel.jpg`.
- JPEG, WebP, PNG and SVG all work. Logos should be SVG when there is one.
- Ask for the biggest version they have — the deck runs at 1920×1080 and up.
- Sponsor and speaker artwork usually already exists under `public/img/sponsors/`
  and `public/img/events/`. Check before asking for a re-send.

**Decide what each photograph is for before you go looking.** A picture the room
is meant to look at has to be sharp and big. A picture that is one tile among
many does not, because it is a fraction of the screen and the purple duotone
covers a multitude of sins. Most of the archive can only ever be the second kind
— see below.

**Two things about the archive that will catch you out:**

1. **Almost nothing is big enough to fill a screen.** Only the 47 curated images
   and about sixty files in `public/img/scraped/photos/` clear 1920px; everything
   else stops between 1200 and 1368, *including* most of the 2023–2026
   photography. Want a full-bleed hero? Look in `public/img/curated/` first.
2. **There is no photograph of a mentor and a mentee together** anywhere in the
   835 images — the flagship programme has no picture of itself. Do not caption
   a group shot as if it were one. Say it to the author instead and suggest
   someone take one at the next event.

**For a karakia or a chapter break**, `public/img/plates/` has six generated
backgrounds — three whenua plates (a greenstone sea, an unfurling frond,
harakeke at dusk) and three abstract light plates. They exist because the
archive is entirely indoors under fluorescent light and a karakia had nowhere
quiet to sit. If the one you need is not there, you can generate it — Step 4a.

**When an event photo is missing**, offer `public/img/curated/` — 47 real
past-event photographs with alt text already written. Say what you are doing:

> You haven't got a photo of the venue yet, so I've used a shot from last year's
> conference on the section divider. It's a real She Sharp photo, just not from
> this event. Happy to swap it the moment you have one.

**Then list every borrowed photo in the Step 7 preview, slide by slide.** Never
quietly substitute, and never say "the venue photo" about a curated stand-in.

## Step 4a — Generate a plate, if one is missing

Only when a karakia, a ceremony or a chapter break needs a background that the
six existing plates do not give. This is a small step, not a creative licence.

The author asks in plain language — *"is there something calmer for the
closing?"* — and you produce it with gpt-image-2 (the project's existing
`OPENAI_API_KEY`), save it into `public/img/plates/`, and record it in that
folder's manifest with real alt text.

**What may be generated is whenua and nothing else**: land, water, plants,
light — what the karakia itself speaks about.

**Never people. Never taonga** — no carving, no woven pattern, no moko, no motif
belonging to any iwi. **And never anything that could be mistaken for a real She
Sharp event photograph.** That last one is the worst outcome available: the
archive's whole value is that it is true, and one convincing fake means nobody
can trust any of it again. If a request drifts that way, say so and offer the
whenua version instead.

`references/assets.md` has the prompt structure that works — subject, then the
clear space where the type will go, then the house rules verbatim. Use it; a
plate without deliberate empty space is a nice picture with nowhere to put a
word.

**Tell the author which slides carry a generated background**, in the Step 7
preview, exactly as you would for a borrowed curated photo.

## Step 5 — Generate the deck

```powershell
npx tsx scripts/deck/new-deck.ts event-lesmills-03-september-2026
```

That writes `lib/deck/decks/<slug>.ts` **and registers it** — there is no manual
registry edit any more, and `deck.test.ts` fails if a deck file is ever
unregistered. What comes out is a deck you could project as it stands: the
opening and closing sequences from `lib/deck/boilerplate.ts`, and between them a
middle built from the event's own data by the evening-event template — the run
sheet, the host's logos, the speakers, what the event says people will get out
of it, the table-discussion block with a countdown set to the number of minutes
the run sheet actually allows, the readouts, and a closing photograph.

**Your job is now subtraction, not authorship.** Read the deck, delete the
blocks tonight does not have, and write the parts only a person can:

- **Replace every PLACEHOLDER note.** The template marks the slides it could not
  fill — the table prompts, most obviously, because nobody writes those down
  before the night. `placeholder-copy` fails the build if a TODO reaches a
  slide, but a *note* may say PLACEHOLDER, so it is on you to catch those.
- **Write a kicker for each slide** (below). The template ships workable ones;
  the good ones come from the interview.
- **Mark what can be dropped** — `optional: true` on anything skippable when the
  event runs late.
- **Delete freely.** Everything in the middle is optional except the closing
  photograph, which carries a comment explaining why it cannot go.

Do **not** paste event facts into the file. Names, roles, times, logos and the
title are live expressions (`SPEAKERS[0].people`, `RUN_SHEET_ROWS`) and must
stay that way — that is what keeps the website and the projector in agreement.
`references/slide-types.md` maps a thing you want to say onto the layout that
says it, when you do add a slide of your own.

### Read the generator's notes back

`new-deck.ts` prints a block headed *"Read these back to the organiser"*. It is
not a log — it is the list of decisions taken on their behalf:

```
SHORTENED   "How AI is impacting different roles across an organisation — not
            just deep technical topics" → "How AI is impacting different roles
            across an organisation"
NOT SHOWN   "What You'll Explore" has more than 5 points; not shown: "AI from a
            fitness company perspective"
```

Every line needs to be said out loud before the deck is shown, in plain words:
*"Your event page lists six things people will explore — five fit on a slide, so
I've left off the fitness-company one and trimmed the first. Happy with that, or
would you rather drop a different one?"*

**Never present a shortened line as if it were theirs.** They wrote the long
version; you cut it; they get to disagree. And if what they want back is the
full list, the answer is two slides, not a smaller typeface.

### Give every slide a kicker

Two labels sit above a title and they are not the same thing. The **section**
names the chapter and repeats across it — "Day One". The **kicker** names *this*
page and is different every single time.

They must never be restatements of each other, or of the title. The checker
rejects that outright, because it is the clearest sign nobody actually wrote the
slide.

A good kicker tells the room **what to do**, or **what is true right now**:

```
PLEASE STAND IF YOU ARE ABLE       on the karakia
THE FIRST OF TWO BUILD DAYS        on the Day One divider
DOORS AT FIVE, DINNER ON ARRIVAL   on the run sheet
```

None of them describes its slide. Each says the thing the host would otherwise
have to remember to say out loud. You write these yourself, from the practical
asides the author dropped during the interview — *"tell people dinner's there
when they walk in"* is a kicker, already written. `references/copy-rules.md` has
the weak-versus-strong table.

The deck that shipped before this rule used the kicker slot **zero times across
thirty-six slides**. Every slide was correct and every slide was more anonymous
than it needed to be.

**The organisational slides arrive with kickers already on them**, written
generically enough to be true at any She Sharp event — "Please find a seat",
"Stand if you are able". Leave those alone where they fit, and replace them
where this event can say something better. The event-specific slides in the
middle of the deck have nothing, and every one of them is yours to write.

### Watch the shape, not just the slides

As you add the event-specific slides, keep an eye on the sequence: **no more
than four information slides in a row, no more than two full-frame ones, no more
than four of the same tone, at least a quarter of the deck dark, and at least
eight different layouts.** The checker will tell you in Step 6 if you drift, but
it is much cheaper to feel it now — a divider dropped in while you write costs
nothing, and one retro-fitted afterwards means re-reading three slides to work
out where the day actually turns.

## Step 6 — Check it

Three commands, in this order:

```powershell
npx tsx scripts/deck/lint-deck.ts aotearoa-ai-hackathon-festival-2026
npx tsx scripts/verify-image-paths.ts
npx tsx lib/deck/deck.test.ts
```

- **`lint-deck.ts`** enforces the copy limits, unique slide ids, the host note,
  the kicker rules, the accent contrast, and the **shape of the deck** — runs of
  similar slides, the share of dark slides, and how many different layouts you
  used.
- **`verify-image-paths.ts`** is the CI gate. Every `/img/...` path written in
  `lib/`, `app/` or `components/` must resolve to a real file under `public/`.
  A typo here fails the pull request, so catch it now.
- **`deck.test.ts`** lints every registered deck, re-checks the theme, and
  asserts every event's feedback code is unique and resolves back to its own
  event.

One of the linter's failures is not a copy problem and must not be reworded
away: **`feedback-qr-event-mismatch` is an error, not a warning.** The feedback
link is derived from the deck's event slug, so a mismatch means the deck itself
is pointed at the wrong event. Fix `EVENT_SLUG` in the deck file — see *Common
failure modes* below.

**When the linter fails on copy, rewrite the copy — do not hand the author an
error message.** They did not write a lint rule and should never see one. Fix
it, then read the change back:

> "Judging criteria and how the weighting works across the two days" was too
> long for a title, so I've made it "How judging works" and moved the weighting
> into the rows underneath. Does that still say what you meant?

**When it fails on the shape of the deck, add a beat — never reorder the day.**
A message like *"8 information slides in a row (max 4), ending at slide 20"* is
not asking you to shuffle anything; the order is the order of the event, and
moving a slide moves a moment. Put a section divider, a photograph or the break
roughly halfway along the run, or turn one of the slides in the run into a
different layout. Then explain it as a decision, not a repair:

> The middle of the deck was eight information slides back to back, which is
> about four more than a room can take. I've put a chapter divider in before the
> judges — the day genuinely changes gear there — and made the challenge list a
> card grid instead of a third set of bullets. Nothing was cut.

Some of the newer checks print without a plain-English explanation attached, so
**translate before you speak**: never read a rule name like `rhythm-tone-run`
out to the author, and never paste the raw output.

`references/copy-rules.md` has the limits in plain words and worked before/after
examples.

## Step 7 — Preview at real screen sizes

```powershell
pnpm dev
```

Open `http://localhost:3000/present/<slug>` and walk the whole deck.

Then screenshot at four shapes, because venue screens are not one shape:

| Size | What it stands for |
|---|---|
| 1920×1080 | The default projector |
| 1512×982 | A MacBook screen, mirrored |
| 1024×768 | An older 4:3 projector — the tightest case |
| 3440×1440 | A wide LED wall or a lecture-theatre screen |

The stage is a fixed 1080 tall and flows in width between 4:3 and 21:9, so type
rescales rather than letterboxing. What still breaks: a run sheet with too many
rows, a people grid at the wrong density, a lead sentence that wraps to four
lines on 4:3. **Fix anything that overflows before showing the author.**

Then show them. Screenshots, in order, with a plain-language note on anything
you changed and every curated photo you borrowed. Iterate until they are happy.

## Step 8 — Ship it

```powershell
git checkout -b feat/deck-aut-panel-night-2026

# If the organiser corrected an event fact, that goes in on its own first.
git add lib/data/json/events-custom.json
git commit -m "fix(events): correct Gemma Lynskey's title for the Les Mills panel"

git add lib/deck/decks/aut-panel-night-2026.ts lib/deck/registry.ts public/img/decks/aut-panel-night-2026
git commit -m "feat(deck): add slides for AUT panel night 2026"
git push -u origin feat/deck-aut-panel-night-2026
gh pr create --fill
```

Conventional Commits: `feat(deck):` for a new deck, `fix(deck):` for a
correction to an existing one, `fix(events):` for a change to the event data.
**Keep the data commit separate** — it changes the public event page as well as
the deck, and those are two different things to review.

Merging to `main` triggers `.github/workflows/deploy.yml`, which prebuilds and
deploys to production. The deck is then live at:

```
https://www.shesharp.org.nz/present/<slug>
```

**There are no preview deploys on this project.** Whatever you verified locally
in Step 7 is the only verification there is — which is why Step 7 is not
optional. Watch the Actions run finish, then load the production URL once and
click through it.

## Step 9 — Hand over to the host

Give the person presenting three things:

1. **The URL** — `https://www.shesharp.org.nz/present/<slug>`.
2. **A PDF backup.** Open `<url>?print=1`, print to PDF, and send them the file.
   This is the version that survives a dead venue wifi and a laptop that will
   not talk to the projector.
3. **`references/run-sheet.md`** — one printable page: the keys, the countdown,
   and the two things that go wrong. Send it to whoever is clicking, even when
   that is someone who has presented before.
4. **The feedback link in plain text** — `shesharp.org.nz/f/<code>`, which you
   can read off the deck's feedback slide. Paste it into the venue chat and the
   thank-you email. Everyone who was looking at their phone when the code was on
   screen, or who left early, can still fill it in.

Tell them the one thing worth remembering: **open it ten minutes early, wait for
the loading chip to disappear, and then don't reload.**

If the venue laptop is old, tell them one more: **`L` stops all the movement**
and the deck still looks right standing still. It does not make the deck load
faster — only the PDF does that — but it fixes a slide show that stutters.

---

## Guardrails (USER-APPROVED — hard rules)

1. **Never ask the author to write, read or debug code.** Not a JSON snippet,
   not a lint error, not a stack trace. *Why:* this skill is the entire
   interface for a non-technical volunteer — the moment it leaks code, they stop
   being able to run their own event.
2. **Never invent an event fact, and never type one into the deck.** Dates,
   times, venue, speaker names, sponsor names and run-sheet timings come from
   `events-custom.json`, and a correction goes *back into it*. *Why:* a slide is
   projected in front of the room as the organisation's word. A wrong start time
   is not a typo, it is a promise — and a fact typed into the deck to save a
   step is a fact that will one day contradict the event page nobody thought to
   re-check.
3. **Never claim an asset exists when a placeholder is standing in.** Every
   curated or borrowed photo is named, slide by slide, in the Step 7 preview.
   *Why:* the author is the only person who knows the photo is from a different
   event, and the audience is the only one who will notice on the day.
4. **The checker is not advice.** If it fails, the deck changes — you rewrite
   the copy or add the missing beat, and read the change back for approval.
   *Why:* the copy limits are what survives being read from three metres away by
   someone who is also listening to a person talk, and the rhythm limits are
   what stops a deck that is correct slide by slide from being unwatchable end
   to end.
5. **Never generate a person, a taonga, or anything that could pass for a real
   She Sharp photograph.** Generated imagery is whenua only — land, water,
   plants, light. No carving, no woven pattern, no moko, no iwi motif. *Why:*
   imitating taonga is appropriation whoever holds the pen, and a convincing
   fake event photo destroys the credibility of the twelve years of real ones
   sitting next to it. The archive is real and must stay real.
6. **Nothing goes on a slide that the room does not need in order to act on it
   right now.** Speaker bios, terms and conditions, long rules and full
   schedules live on the event page and are reached by a QR code. *Why:* every
   sentence the audience is reading is a sentence they are not hearing.
7. **Every slide carries a host note, and every slide carries a kicker.** The
   note is for the person clicking; the kicker is for the room. *Why:* the deck
   is clicked through by a volunteer who may see it for the first time that
   morning, and a slide whose only labels repeat each other reads as though
   nobody wrote it.
8. **Verify locally before merging.** There are no preview deploys. *Why:* the
   next place the deck renders after your laptop is production.
9. **Repo conventions apply.** English for all on-screen strings and code
   comments; Conventional Commits; no new files under `docs/`. *Why:* this deck
   ships in the same repository as the public website.

## The fixed slide sequence

Every She Sharp deck runs the same organisational frame. The author supplies the
content; the frame comes free from `lib/deck/boilerplate.ts`.

| # | Slide | Type | Fixed or authored |
|---|---|---|---|
| 1 | Title & partners | `title` | Event data + partner logos |
| 2 | Opening karakia | `karakia` (`timatanga`) | Fixed |
| 3 | Health & safety | `bullets` | Fixed, venue detail authored |
| 4 | We are She Sharp | `bullets` | Fixed |
| 5 | The team | `people` | Fixed roster, trimmed per event |
| 6 | Our impact | `stats` | Fixed (3000+ members, 50+ sponsors, 94+ events) |
| 7 | Sponsors | `logos` | Event data |
| 8 | Contact & QR codes | `contact` | Fixed |
| 9 | The event title | `section` | Event data |
| — | **The evening** | various | **Generated from the event data — you trim it** |
| 11 | Thank you | `thanks` | Event data + named people |
| 12 | Upcoming events | `upcoming` | Authored, snapshotted |
| 13 | Feedback QR | `qr-cta` | Nothing — derived from the event slug |
| 14 | Ambassador QR | `qr-cta` | Fixed destination |
| 15 | Closing karakia | `karakia` (`whakamutunga`) | Fixed |

The upcoming-events slide is **snapshotted at authoring time on purpose** — a
live lookup would quietly change what is on the projector between the rehearsal
and the event.

### And the evening in between

`lib/deck/templates/evening-event.ts` generates the middle from the event data.
Every block disappears on its own when the event has no data for it, so a
workshop with no panel and no roundtable simply gets a shorter deck.

| Block | Type | Comes from | Gone when |
|---|---|---|---|
| How tonight runs | `agenda` | the timed schedule section | there is no timed schedule |
| Tonight's hosts | `logos` | `sponsors.main` | there is no partner |
| *Chapter divider* | `section` | the speaker group's heading | its chapter is empty |
| Meet the … | `people` | each `speakers.<group>` | there are no speakers |
| What you'll explore | `bullets` | the why-attend section | there is no such section |
| *Chapter divider* | `section` | fixed | its chapter is empty |
| At your table | `bullets` | **you write these** | there is no discussion block |
| The countdown | `break` | minutes taken from the run sheet row | that row has no readable duration |
| What did you find | `bullets` | the readout row | there is no readout row |
| The closing frame | `photo` | the archive, or the event's own photo | **never — see below** |

**Why the closing photograph cannot be deleted.** The closing sequence is four
information slides in a row (thanks, upcoming, feedback, ambassador) and four is
the limit. If the middle ends on an information slide the run reaches five and
the deck fails its shape check. The last slide of the middle has to be
full-frame. Change the photograph by all means; do not remove the slide.

You will not normally hit the shape rules at all — the template keeps the middle
running at two information slides between breaths, against a limit of four, and
every combination of present and absent blocks is asserted in `deck.test.ts`.

## Common failure modes and how to recover

**`/present/<slug>` 404s** — the deck is not registered. `new-deck.ts` does this
for you; if you created the file by hand, run
`npx tsx scripts/deck/sync-registry.ts`, which regenerates `registry.ts` from
whatever is in `lib/deck/decks/`. Never hand-edit that file.

**The slide shows a name or a time that the website does not** — someone typed a
fact into the deck instead of correcting the event data. Find the literal, put
the value back to its live expression, and fix the JSON. See *Correcting a fact*.

**`"TODO" is still on screen`** — `placeholder-copy` caught a placeholder in a
title, bullet or kicker. Host notes are exempt and may say PLACEHOLDER; slides
may not, because the room reads them.

**`Title is 9 words (max 7)`** — rewrite it to seven, read the new one back to
the author for approval, and move on. Do not raise the limit.

**`3 bullet slides in a row`** — the deck has gone flat. Turn the middle one
into `themes`, `stats` or a `photo`, or put a `section` divider in front of it.
The rule exists because three bullet slides is where a room stops listening.

**`8 information slides in a row (max 4)`** — the same disease, one level up.
Add a divider, a photograph or the break halfway along the run. Do not reorder
the day to make it go away.

**`3 full-frame slides in a row (max 2)`** — a karakia, then a photograph, then
a chapter divider is three consecutive requests for the room's silence, and the
third one gets impatience instead. Move one, or put the slide it was introducing
in between.

**`Only 20% of slides are dark (need 25%)`** — the deck is all working and no
breathing. Dividers, photographs and breaks are dark by default, so the fix for
this and the fix for a long information run are usually the same fix.

**`The feedback code points at "<other-slug>" but this deck is "<slug>"`** — the
feedback link is derived from the event slug, so this can only mean the deck was
built against the wrong event. Fix `EVENT_SLUG` in the deck file; the code then
fixes itself. **Never silence this rule** — a code pointing at last month's
event looks perfectly correct from the front of the room and collects the wrong
data, which is the exact failure the rule exists to catch.

**`Only 6 distinct layouts across 30 slides (need 8)`** — you reached for the
same layout repeatedly, which nearly always means content got bent to fit it.
Look for the list that is really four criteria, or the list that is really three
themes.

**`Eyebrow "Day One" restates the section "Day One"`** — the kicker is doing the
section's job. Replace it with something the slide does not already say:
*"THE FIRST OF TWO BUILD DAYS"*. Same for a kicker that restates the title.

**`Accent #7b2ff7 on the dark canvas #0b0a14 is 3.10:1 (need 4.5:1)`** — the
accent was hand-written instead of passed through `accentFromBrandColour()`.
Run it through, which fixes the luminance and keeps the hue.

**`✗ 1 broken image path`** — the file is not where the deck says it is. Compare
the exact path against `public/`; the usual causes are `.jpeg` versus `.jpg`, a
capital letter, or a photo that was described but never actually sent.

**A slide shows a coloured gradient with words on it** — that is
`deck-image.tsx`'s designed failure state for a missing file. It is not a
styling choice; find the missing image.

**The deck looks wrong after an edit and the change won't appear** — a stale
`next dev` server. Stop it, restart, and reload once.

**`scripts/deck/new-deck.ts` is missing** — the scaffolding script has not
landed on this branch. Copy the nearest existing deck under `lib/deck/decks/`,
rename the slug, strip the event-specific slides, and continue from Step 5. Say
so in your report; do not hand-build the organisational frame from scratch.

## What this skill does *not* do

- **Create an event, or change what it fundamentally is** — that is
  `sync-event-from-slack`. This skill may correct a *fact* inside
  `detailPageData` when the organiser corrects it out loud (see *Correcting a
  fact*), because the alternative is a slide that disagrees with the website.
  It never adds an event, never changes a `slug` or an `id`, and never invents
  a fact to fill a gap.
- **Email anyone** about the event.
- **Publish the deck as a public page.** `/present/*` is `noindex`, absent from
  the sitemap, and internal tooling for hosts.
- **Design new slide layouts.** It uses the eighteen types that exist. A genuine
  new one is a code change and belongs to a developer.
- **Change the copy limits, the type scale or the stage behaviour.**
- **Produce a PowerPoint or Google Slides file.** The deliverable is a URL plus
  a PDF printed from it.
