---
name: build-event-slides
description: Build the presentation deck for one She Sharp in-person event — interviewing the organiser in plain language, then generating, linting, previewing and deploying a slide deck at `/present/<event-slug>`. Use whenever someone wants slides or a presentation for an event — phrases like "make slides for the AUT event", "we need a presentation for Thursday's meetup", "build the deck for our next event", "update the hackathon deck", "presentation for the panel night", "event slides", "给 X 活动做幻灯片", "活动幻灯片", "把这场活动的 PPT 做出来" — or anything about a projector, a run sheet on screen, a title slide, an opening or closing karakia, or a deck for a host to click through. Covers the fixed organisational slide sequence, the accent colour taken from the event poster, where photos live, the enforced copy limits, the multi-screen preview pass, and the merge-to-deploy path. Assumes the event is already in `lib/data/json/events-custom.json` — `sync-event-from-slack` puts it there.
---

# Build the slide deck for one event

The person you are working with runs She Sharp events. They do not write code and
they must never be asked to. They know the room, the run sheet, the speakers and
the sponsors. Your job is to get that out of their head and onto a projector.

Three facts shape everything below.

- **The event already exists in the repo.** Title, date, time, venue, speakers,
  sponsors and poster live in `lib/data/json/events-custom.json`. Read from
  there. Never re-type an event fact from memory or from the chat.
- **A deck is plain data.** One file under `lib/deck/decks/`, registered in
  `lib/deck/registry.ts`, rendered at `/present/<slug>`. Nobody hand-writes HTML
  or CSS, and the author never sees either.
- **The copy limits are enforced, not suggested.** `lib/deck/lint.ts` fails a
  deck whose title runs to nine words. When it fails, **the copy changes** — you
  rewrite it shorter and read the new version back for approval.

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
a slug. Everything else you ask for, one small group of questions at a time,
following `references/content-checklist.md`.

| Question it asks | Default when the author shrugs |
|---|---|
| Which event? | Whatever they said — Step 1 resolves it and reads it back |
| Accent colour | Pulled from the event poster; brand purple if there is no poster |
| Run sheet | **Ask.** Never invent a timing |
| Who is on stage | From the event data's `speakers[]`, confirmed out loud |
| Which sponsors to thank | From the event data's `sponsors`, confirmed out loud |
| Photos | Their own; `public/img/curated/` as a named fallback |
| Feedback QR destination | **Ask.** No form → drop the slide, don't fake one |
| Ambassador QR destination | `https://www.shesharp.org.nz/join-our-team` |
| Break length | 15 minutes |

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

**The deck already exists** (a file under `lib/deck/decks/`, an entry in
`lib/deck/registry.ts`) — this is an update, not a build. Skip Step 5's
scaffolding, go straight to the slides that changed, and keep everything the
author already approved. Re-run Steps 6 and 7 in full: a one-word edit can still
overflow a slide.

## Step 2 — Interview the author

Work through `references/content-checklist.md`. It is grouped into short rounds
on purpose.

**Ask one round at a time. Never dump twenty questions at once.** A wall of
questions gets one answer to the first and silence for the rest. Ask three or
four, listen, reflect back what you heard, then move on.

The rounds cover: what this event is in one sentence and who it is for; who
hosts and who speaks; the run sheet; breaks and the group photo; which partners
to thank; the visual assets; the two QR destinations; what the closing should
say; which future events to preview.

Two habits that make this work:

- **Take the answer in their words and shorten it yourself.** They say "so the
  idea is that people who've never touched an AI tool before can come along and
  build something in a day without needing to know how to code" — you write
  *"Build something real in a day, no code required"* and read it back.
- **"I don't know" is a real answer.** The checklist says what to do with each
  one — a sensible default, a slide dropped, or a question parked for later.
  Never fill a gap by inventing a fact.

## Step 3 — Set the colours

Every deck carries an accent pair: one colour for light slides, one for dark.
The pair is not decoration. She Sharp's brand purple `#9b2e83` scores 2.92:1
against the dark canvas — under even the 3:1 large-text floor — so a dark slide
needs a lighter partner or the text is unreadable from the back of the room.

Read the event's poster or key visual (`coverImage` in the event data) and take
its dominant colour. Then:

```ts
import { accentFromBrandColour, checkAccentContrast } from "@/lib/deck/theme";

theme: {
  accent: accentFromBrandColour("#7b2ff7", "#5ee7f5"),
}
```

`accentFromBrandColour()` keeps the hue and fixes the luminance automatically,
once per canvas. `checkAccentContrast()` confirms it — and `lint-deck.ts` runs
it again in Step 6, so a bad pair cannot reach a projector.

**Then explain the result in plain language, without the numbers:**

> Your poster's purple is lovely but it's too dark to read on the black slides,
> so those use a lighter version of the same purple. On the white slides it
> stays exactly as it is on the poster.

No poster, or the author would rather stay on brand: use `sheSharpTheme` from
`lib/deck/theme.ts` and say so.

## Step 4 — Collect the assets

Read `references/assets.md` for the full detail. In summary:

- Event photos go in `public/img/decks/<event-slug>/`, named for what they show:
  `group-photo.jpg`, `venue-atrium.jpg`, `judges-panel.jpg`.
- JPEG, WebP, PNG and SVG all work. Logos should be SVG when there is one.
- Ask for the biggest version they have — the deck runs at 1920×1080 and up.
- Sponsor and speaker artwork usually already exists under `public/img/sponsors/`
  and `public/img/events/`. Check before asking for a re-send.

**When a photo is missing**, offer `public/img/curated/` — 48 real past-event
photographs with alt text already written. Say what you are doing:

> You haven't got a photo of the venue yet, so I've used a shot from last year's
> conference on the section divider. It's a real She Sharp photo, just not from
> this event. Happy to swap it the moment you have one.

**Then list every borrowed photo in the Step 7 preview, slide by slide.** Never
quietly substitute, and never say "the venue photo" about a curated stand-in.

## Step 5 — Generate the deck

```powershell
npx tsx scripts/deck/new-deck.ts aotearoa-ai-hackathon-festival-2026
```

That writes `lib/deck/decks/<slug>.ts` with the fixed organisational slides
already in place, built by `buildOpeningSlides()` and `buildClosingSlides()` in
`lib/deck/boilerplate.ts`. Then register it — **one import and one map entry**
in `lib/deck/registry.ts`:

```ts
import { autPanelNight2026Deck } from "./decks/aut-panel-night-2026";

const decks: Record<string, Deck> = {
  [aotearoaAiHackathonFestival2026Deck.slug]: aotearoaAiHackathonFestival2026Deck,
  [autPanelNight2026Deck.slug]: autPanelNight2026Deck,
};
```

Without the registry entry `/present/<slug>` returns a 404.

Now fill in the **event-specific** slides between the event title and the group
photo — the part only this event has. `references/slide-types.md` maps a thing
you want to say onto the layout that says it. Every slide needs:

- a lowercase kebab-case `id` (`judging-criteria`, not `Judging Criteria`);
- a `note` — one or two sentences the host can read before speaking. It prints
  in the PDF and never appears on screen. A slide nobody can introduce is a
  slide nobody should present;
- `optional: true` on anything that can be skipped when the event runs late.

## Step 6 — Check it

Three commands, in this order:

```powershell
npx tsx scripts/deck/lint-deck.ts aotearoa-ai-hackathon-festival-2026
npx tsx scripts/verify-image-paths.ts
npx tsx lib/deck/deck.test.ts
```

- **`lint-deck.ts`** enforces the copy limits, unique slide ids, the host note,
  the bullet rhythm and the accent contrast.
- **`verify-image-paths.ts`** is the CI gate. Every `/img/...` path written in
  `lib/`, `app/` or `components/` must resolve to a real file under `public/`.
  A typo here fails the pull request, so catch it now.
- **`deck.test.ts`** lints every registered deck and re-checks the theme.

**When the linter fails on copy, rewrite the copy — do not hand the author an
error message.** They did not write a lint rule and should never see one. Fix
it, then read the change back:

> "Judging criteria and how the weighting works across the two days" was too
> long for a title, so I've made it "How judging works" and moved the weighting
> into the rows underneath. Does that still say what you meant?

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
git add lib/deck/decks/aut-panel-night-2026.ts lib/deck/registry.ts public/img/decks/aut-panel-night-2026
git commit -m "feat(deck): add slides for AUT panel night 2026"
git push -u origin feat/deck-aut-panel-night-2026
gh pr create --fill
```

Conventional Commits: `feat(deck):` for a new deck, `fix(deck):` for a
correction to an existing one.

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

Tell them the one thing worth remembering: **open it ten minutes early, wait for
the loading chip to disappear, and then don't reload.**

---

## Guardrails (USER-APPROVED — hard rules)

1. **Never ask the author to write, read or debug code.** Not a JSON snippet,
   not a lint error, not a stack trace. *Why:* this skill is the entire
   interface for a non-technical volunteer — the moment it leaks code, they stop
   being able to run their own event.
2. **Never invent an event fact.** Dates, times, venue, speaker names, sponsor
   names, prize amounts and run-sheet timings come from the repo or from the
   author. *Why:* a slide is projected in front of the room as the
   organisation's word. A wrong start time is not a typo, it is a promise.
3. **Never claim an asset exists when a placeholder is standing in.** Every
   curated or borrowed photo is named, slide by slide, in the Step 7 preview.
   *Why:* the author is the only person who knows the photo is from a different
   event, and the audience is the only one who will notice on the day.
4. **The copy linter is not advice.** If it fails, the copy changes — you
   rewrite it and read the change back for approval. *Why:* the limits are what
   survives being read from three metres away by someone who is also listening
   to a person talk.
5. **Nothing goes on a slide that the room does not need in order to act on it
   right now.** Speaker bios, terms and conditions, long rules and full
   schedules live on the event page and are reached by a QR code. *Why:* every
   sentence the audience is reading is a sentence they are not hearing.
6. **Every slide carries a host note.** *Why:* the deck is clicked through by a
   volunteer who may see it for the first time that morning.
7. **Verify locally before merging.** There are no preview deploys. *Why:* the
   next place the deck renders after your laptop is production.
8. **Repo conventions apply.** English for all on-screen strings and code
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
| — | **Event-specific slides** | various | **All authored — this is the work** |
| 10 | Group photo & break | `photo` + `break` | Authored (break length) |
| 11 | Thank you | `thanks` | Event data + named people |
| 12 | Upcoming events | `upcoming` | Authored, snapshotted |
| 13 | Feedback QR | `qr-cta` | Authored destination |
| 14 | Ambassador QR | `qr-cta` | Fixed destination |
| 15 | Closing karakia | `karakia` (`whakamutunga`) | Fixed |

The upcoming-events slide is **snapshotted at authoring time on purpose** — a
live lookup would quietly change what is on the projector between the rehearsal
and the event.

## Common failure modes and how to recover

**`Cannot find module './decks/<slug>'`** — the deck file was generated but the
registry import points at a different name, or vice versa. The import path and
the filename must match exactly, without the `.ts`.

**`/present/<slug>` 404s** — the deck is not in the `decks` map in
`lib/deck/registry.ts`. Generating the file does not register it.

**`Title is 9 words (max 7)`** — rewrite it to seven, read the new one back to
the author for approval, and move on. Do not raise the limit.

**`3 bullet slides in a row`** — the deck has gone flat. Turn the middle one
into `themes`, `stats` or a `photo`, or put a `section` divider in front of it.
The rule exists because three bullet slides is where a room stops listening.

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

- **Create or edit the event itself** — that is `sync-event-from-slack`. This
  skill reads `events-custom.json` and never writes to it.
- **Email anyone** about the event.
- **Publish the deck as a public page.** `/present/*` is `noindex`, absent from
  the sitemap, and internal tooling for hosts.
- **Design new slide layouts.** It uses the eighteen types that exist. A genuine
  new one is a code change and belongs to a developer.
- **Change the copy limits, the type scale or the stage behaviour.**
- **Produce a PowerPoint or Google Slides file.** The deliverable is a URL plus
  a PDF printed from it.
