---
name: build-event-slides
description: Build the presentation deck for one She Sharp in-person event — generating it from the event's own data, then confirming, trimming, linting, previewing and deploying a slide deck at `/present/<event-slug>`. Use whenever someone wants slides or a presentation for an event — phrases like "make slides for the AUT event", "we need a presentation for Thursday's meetup", "build the deck for our next event", "update the hackathon deck", "presentation for the panel night", "event slides", "给 X 活动做幻灯片", "活动幻灯片", "把这场活动的 PPT 做出来" — or anything about a projector, a run sheet on screen, a title slide, an opening or closing karakia, or a deck for a host to click through. Also covers correcting an event fact so the website and the slides stay in agreement. The run sheet, speakers, hosts and sponsors come from `lib/data/json/events-custom.json` and are read live, so a correction goes into the event data rather than into the deck. Every event gets its own visual design, led by its poster: covers generating the poster with gpt-image-2, designing that event's skin (surface, palette, geometry, motion, type), and the boundary where She Sharp's own organisational slides keep the house archive look. Also covers the fixed organisational sequence, the evening-event template, the accent colour taken from the poster, where photos live, the enforced copy limits, the multi-screen preview pass, and the merge-to-deploy path. Assumes the event is already in the repo — `sync-event-from-slack` puts it there.
---

# Build the slide deck for one event

The person you are working with runs She Sharp events. They do not write code and
they must never be asked to. They know the room, the run sheet, the speakers and
the sponsors. Your job is to get that out of their head and onto a projector.

Five facts shape everything below.

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
  event and registered automatically, rendered at `/present/<slug>`. **The
  author never writes or reads HTML or CSS.** You may; they may not.
- **Every event gets its own look, and the poster decides it.** This is the
  change that matters most, and it is a correction, made twice. A deck carries a
  **skin** — its own surface, palette, geometry, motion tempo and type
  personality — designed from that event's poster (`references/skins.md`). And a
  deck carries a **weave**, which is how She Sharp's own slides arrange the
  archive (`references/weaves.md`). The skin was not enough on its own: it
  cannot reach the organisational sequence, and that sequence is over half of a
  short deck, so the Les Mills evening and the two-day hackathon still came out
  looking like the same deck with a different accent. Step 3 is where you do
  both, and neither is optional.
- **She Sharp's own slides keep She Sharp's own photographs — and nothing else
  about them is fixed.** The organisational sequence always shows the same
  twelve years of real rooms, on the same slides, in the same order. What those
  photographs are *lit by* is the event's: a deck may take the whole thing dark,
  and may regrade the archive into its own colour. The grade's job is to make
  photography shot across four stops of colour temperature read as one thing,
  and it does that in any hue — brand purple was the convention, not the
  mechanism. Drawing this line around *treatment* instead of *content* is what
  made the first two decks look identical. `references/skins.md` has the table.
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
| The poster | Theirs if they have one. If not, **you make one** — Step 3, two commands. It is what the look is decided from |
| This event's look | **Yours to design**, from the poster, per `references/skins.md`. Read it back in plain words; never show them CSS |
| Break length | Taken from the run sheet's own timings, never a default |
| Karakia | She Sharp's standing pair, already in the deck. **Don't ask** |
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
3. **Node 22 and dependencies installed** (`pnpm install` — the repo pins pnpm 10).
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
  none): regenerate with `--force`. The accent colour is carried across
  automatically and the script says so. **Everything else hand-written is
  not** — read the existing deck first and carry over every host note, kicker
  and chosen photograph the author already approved. There is no undo.

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

**Do not ask about the karakia.** She Sharp opens and closes every event with
the same pair, and the deck already carries them (`lib/deck/karakia.ts`). Asking
each time implies a decision that has already been made.

The exception is when the organiser raises it themselves — a venue opening with
its own mihi, or a guest who will read something else. Then take their text
verbatim, macrons as given, and pass it as `karakia:` to `buildOpeningSlides()`
or `buildClosingSlides()`.

## Step 3 — Design this event's look

Two halves: the accent pair, then the skin. **Do them in that order and do them
after the poster exists** — the poster is where the concept is decided, it is
cheap to iterate on, and the organiser can say yes or no to it long before any
front-end does.

No poster yet? Make one. It is two commands, and it is the cheapest way to have
the "what should this look like" conversation:

```powershell
npx tsx scripts/events/generate-poster-plate.ts <event-slug> --probe
npx tsx scripts/events/generate-poster-plate.ts <event-slug> --n 4
npx tsx scripts/events/build-event-poster.ts <event-slug> --plate tmp/plates/<chosen>.png
```

Show the poster. Get a yes. Then continue.

### 3a — The accent pair

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

### 3b — The weave, and you do not get to skip this one

**Read `references/weaves.md`.** It is short.

Every deck picks how She Sharp's own slides arrange the archive — `drift`,
`contact-sheet` or `mosaic`. This is the axis that made the first two decks look
like twins: the organisational sequence is over half of a short deck, and until
August 2026 it was the same drifting photo wall in every deck ever built,
whatever else the deck did.

See what is already taken:

```powershell
npx tsx scripts/deck/style-ledger.ts
```

It prints every registered deck against every axis, and the weaves nothing has
claimed. **Take an unused one unless you can say why this event needs a weave a
neighbouring deck already has** — and if you do take a used one, the accent has
to be in a different part of the colour wheel, or `deck.test.ts` fails the build
with `deck-set-house-twins`.

Two questions decide it: what is this event like, and what is the rest of this
deck already doing? The second is the one people skip. Les Mills went to
`mosaic` because the rest of that deck is editorial — paper, hairline rules,
type at rest — and `mosaic` is a still grid cut the way a page is laid out.

`scripts/deck/new-deck.ts` writes a free weave into the scaffold for you, so
this step is usually confirming a choice rather than making one. Say it out loud
to the author anyway, in their words, not the key:

> The She Sharp slides in your deck use the usual wall of past-event photos, but
> laid out as a still grid rather than the slow-moving rows the hackathon deck
> uses — so the two don't look like the same night.

### 3c — The skin

**Read `references/skins.md`.** Its first section is the default; the rest is
the system underneath, including the trap where `object-position` set in CSS
compiles cleanly and silently loses to an inline style, so every band shows a
black bar.

**For a regular 2–3 hour evening — a panel, a talk, a workshop — this step is
confirming the default or arguing your way out of it, not designing anything.**
`scripts/deck/new-deck.ts` scaffolds `skin: EDITORIAL_SKIN,` into the deck: She
Sharp's own editorial system on the projector, paper and navy ink, hairline
rules, a line of script where a statement slide introduces itself, chapter
numerals drawn as outlines. The two things this event turns are the **accent
pair** (off the poster, and only if it genuinely beats purple and mint — it must
clear 4.5:1 on both canvases) and the **archive weave** from 3b. Nothing else.
Tell the author what they have got:

> Your slides use She Sharp's own editorial look — the same paper, navy and
> hairline rules as the website — so the night reads as a She Sharp night. The
> photo wall on the She Sharp slides is unchanged.

**A bespoke skin is for two kinds of event**, both named in
`references/skins.md`: one whose poster gives you a concept you can say in one
sentence, and a flagship or multi-day event that must not read as a regular
evening. If neither applies, do not build one. A deck in a half-built bespoke
skin is worse than a deck in the default — that is the lesson of the Fibre skin,
built for the Les Mills evening in August 2026, argued over for three rounds and
deleted in full.

When one **is** warranted:

1. **Name the concept in one sentence**, from the poster. If you cannot, you do
   not have a concept, and the default is the honest answer — say so and move on.
2. **Declare a `DeckSkin`** in the deck file: a surface (`archive`, or `plate`
   with **at least two** of the event's images), and a `tempo` if the concept
   wants the entrances slower or quicker than the house.
3. **Write the `[data-skin="<key>"]` block** in
   `styles/components/deck-skins.css` — panels, rules, tracking, ambient loops.
   This is where the look actually is.
4. **Check the light slides, not just the chapter cards.** Most of a deck is
   light. A skin that only shows up on the dark statements is a skin nobody
   sees.

**What you may not touch, ever**, because each fails silently in front of a
room: the stage geometry, `vw`/`vh`/`dvh` anywhere inside the stage, the 1080
design height, the copy and rhythm limits, the accent contrast floor, the white
logo chip, or an ambient loop missing either the `[data-active="true"]` or the
`[data-motion="on"]` gate. `references/skins.md` says why for each.

**Two decks in the same skin** are meant to look related, so `deck.test.ts` asks
them for something else instead: they must differ on **both** the archive weave
and the accent hue sector, and it stops asking about surface, geometry and tempo
— a shared skin fixes those. Run `npx tsx scripts/deck/style-ledger.ts` before
settling either.

**Explain a bespoke skin to the author in plain words, never in CSS:**

> Your poster is a coastline at dawn, so the slides are built out of it — the
> chapter cards sit on the water itself, and the pale slides carry a strip of it
> along the bottom where the other decks have a row of photos. The She Sharp
> slides in the opening and the thank-yous keep the usual photo wall; that part
> is the organisation's rather than this event's.

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
   and about sixty files in `public/img/legacy-site/photos/` clear 1920px; everything
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

**Your job on the STRUCTURE is subtraction.** Read the deck, delete the blocks
tonight does not have, and do not add slides the run sheet cannot justify.

**Your job on the WORDS is authorship**, and that is not the same job. The
template's copy is scaffolding written for a generic evening; leaving it in place
is how two decks end up sounding alike. Write the parts only a person can:

- **Replace every PLACEHOLDER note.** The template marks the slides it could not
  fill — the table prompts, most obviously, because nobody writes those down
  before the night. `placeholder-copy` fails the build if a TODO reaches a
  slide, but a *note* may say PLACEHOLDER, so it is on you to catch those.
- **Write a kicker for each slide in the middle** (below). The template ships
  generic ones and the checker fails a deck that keeps more than four of them.
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
where this event can say something better. They are *supposed* to be the same in
every deck: they are the organisation's voice rather than this event's.

**The event-specific slides in the middle arrive with kickers too, and those are
a different matter entirely.** The template writes "Up again at the break",
"Talk to someone new", "Space starts the clock" — sentences composed for a
generic Tuesday, not for your evening. They are placeholders that read like
finished copy, which is the most expensive kind.

This is not a hypothetical. The Les Mills deck shipped with **every one** of the
template's ten eyebrows untouched; the hackathon deck, written before the
template existed, contains none of them and has sixty-one of its own. That
difference is most of why the two decks read as the same deck, and it cost
nothing to create and nothing to fix.

`template-default-copy` now fails a deck that keeps more than four of them.
Four rather than zero, because a few are genuinely the right words — "Space
starts the clock" is a literal instruction about the keyboard. The rest are
yours to write.

### Watch the shape, not just the slides

As you add the event-specific slides, keep an eye on the sequence: **no more
than four information slides in a row, no more than two full-frame ones, no more
than four of the same tone, at least a quarter of the deck dark, and at least
eight different layouts.** The checker will tell you in Step 6 if you drift, but
it is much cheaper to feel it now — a divider dropped in while you write costs
nothing, and one retro-fitted afterwards means re-reading three slides to work
out where the day actually turns.

## Step 6 — Check it

Five commands, in this order:

```powershell
npx tsx scripts/deck/sync-registry.ts
npx tsx scripts/deck/lint-deck.ts aotearoa-ai-hackathon-festival-2026
npx tsx scripts/deck/style-ledger.ts
npx tsx scripts/verify-image-paths.ts
npx tsx lib/deck/deck.test.ts
```

- **`sync-registry.ts`** regenerates the two derived files, `registry.ts` and
  `index-meta.ts`. **Run it here, after the words are final — not back at Step 5.**
  `new-deck.ts` already wrote the registry entry when it scaffolded the deck, but
  it deliberately did not write the manifest: at that moment the title, subtitle
  and slide count are still the generator's placeholders, and Step 5 is where you
  change all three. `index-meta.ts` is what the public site reads — the "View the
  slides" button on the event page and the `/slides` archive both come from it,
  and neither can import a deck to check itself. Skip this and `deck.test.ts`
  fails on the next line with `index-meta.ts matches the registered decks`; ship
  it stale some other way and the archive quotes a placeholder title under the
  real deck. **Commit `lib/deck/index-meta.ts` along with the deck file** — see
  Step 8.
- **`lint-deck.ts`** enforces the copy limits, unique slide ids, the host note,
  the kicker rules, the accent contrast, how much of the template's own copy
  survived, and the **shape of the deck** — runs of similar slides, the share of
  dark slides, and how many different layouts you used.
- **`style-ledger.ts`** is the only check that looks at more than one deck. It
  prints every registered deck against the five axes its look is made of and
  says which pairs are too close to tell apart. It never fails on its own —
  `deck.test.ts` is the gate — but it is the one that tells you *what to change*.
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

git add lib/deck/decks/aut-panel-night-2026.ts lib/deck/registry.ts lib/deck/index-meta.ts public/img/decks/aut-panel-night-2026
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
5. **Never generate a person, a face, or a taonga; never anything that could
   pass for a real She Sharp photograph.** For a karakia or a chapter of quiet
   the subject is narrower still — whenua only: land, water, plants, light. For
   an event's own artwork the subject is open, because that is the poster's
   concept and a fitness company talking about AI is not served by a photograph
   of harakeke. What never moves: no people, no taonga (no carving, no woven
   pattern, no moko, no iwi motif), nothing mistakable for the archive, and no
   text or logos inside the generated image. *Why:* imitating taonga is
   appropriation whoever holds the pen, and a convincing fake event photo
   destroys the credibility of the twelve years of real ones sitting next to it.
   The archive is real and must stay real — an abstract macro of lit glass could
   never be mistaken for a room at AUT, which is exactly why it is safe.
6. **A skin may change how a deck looks and never what it may say.** The copy
   limits, the rhythm rules, the accent contrast floor, the stage geometry and
   the twenty slide types are outside every skin's reach. *Why:* those are
   what survive being read from three metres by someone who is also listening to
   a person talk, and a skin is a look — it has no standing to overrule them.
7. **Nothing goes on a slide that the room does not need in order to act on it
   right now.** Speaker bios, terms and conditions, long rules and full
   schedules live on the event page and are reached by a QR code. *Why:* every
   sentence the audience is reading is a sentence they are not hearing.
8. **Every slide carries a host note, and every slide carries a kicker.** The
   note is for the person clicking; the kicker is for the room. *Why:* the deck
   is clicked through by a volunteer who may see it for the first time that
   morning, and a slide whose only labels repeat each other reads as though
   nobody wrote it.
9. **Verify locally before merging.** There are no preview deploys. *Why:* the
   next place the deck renders after your laptop is production.
10. **Repo conventions apply.** English for all on-screen strings and code
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
| 12 | Upcoming events | `upcoming` | Authored, snapshotted. Dropped when empty |
| 13 | Feedback QR | `qr-cta` | Nothing — derived from the event slug |
| 14 | Ambassador QR | `qr-cta` | Fixed destination |
| 15 | Closing karakia | `karakia` (`whakamutunga`) | Fixed |

The upcoming-events slide is **snapshotted at authoring time on purpose** — a
live lookup would quietly change what is on the projector between the rehearsal
and the event.

It is also **the one closing slide that disappears**. With nothing in the
snapshot it used to project "What's Coming Up — the next thing you can come to"
over an empty space, so it is now dropped entirely when there is nothing to
announce. If the author has no next event confirmed, say that the slide will not
appear and that the events QR in the opening still covers it. If they name one
later, add it and the slide comes back.

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
`npx tsx scripts/deck/sync-registry.ts`, which regenerates `registry.ts` — and
`index-meta.ts` with it — from whatever is in `lib/deck/decks/`. Never hand-edit
either file.

**`FAIL - index-meta.ts matches the registered decks`** — the manifest the public
site reads is stale, almost always because Step 6's first command was skipped or
was run before the copy was finished. Run
`npx tsx scripts/deck/sync-registry.ts` and commit `lib/deck/index-meta.ts` with
the deck. Never hand-edit it either.

**The deck is live but no event page links to it** — same cause, one step later:
the "View the slides" button reads `index-meta.ts`, so a deck missing from the
manifest is a deck only someone with the URL can reach. Regenerate and push.

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
landed on this branch. **Stop and say so.** Get the branch that has it.

Do *not* copy the nearest existing deck and rename the slug, which is what this
section used to advise. It reliably produces the defect this whole skill now
exists to prevent: you inherit that deck's weave, its accent, its skin and its
kickers, and every one of those is a decision that should have been made for
*this* event. `deck-set-house-twins` will fail the build if you do, which is the
cheap version of finding out. The expensive version is a projector.

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
- **Design new slide layouts.** It uses the twenty types that exist. A genuine
  new one is a code change and belongs to a developer.
- **Change the copy limits, the type scale or the stage behaviour.**
- **Produce a PowerPoint or Google Slides file.** The deliverable is a URL plus
  a PDF printed from it.
