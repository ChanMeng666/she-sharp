---
name: make-event-poster
description: Design and build the promotional artwork for one She Sharp event, at every size the organisation publishes — the Humanitix ticketing banner, the LinkedIn/Instagram/Facebook feed post, the Instagram story, the square grid tile, and the print/event-page poster. Use this whenever someone needs a poster, a banner, a flyer, a social graphic, a cover image or a "picture for the event" — phrases like "make a poster for the AUT night", "we need a banner for Humanitix", "can you do a LinkedIn graphic for Thursday's panel", "design artwork for the mentorship launch", "I need something to post on Instagram about this event", "给这场活动做个海报", "活动宣传图", "做个领英的图" — and also when someone asks to redesign or refresh an event's existing artwork, or to regenerate it after a date, venue or speaker changed. Works from the event's own record in `lib/data/json/events-custom.json`, so the artwork and the website cannot disagree. The picture is generated with gpt-image-2 as a textless plate and every word is then set in code, which is what makes the type exact, correctable and identical across all five sizes.
---

# Make the artwork for one event

The person you are working with runs She Sharp events. They do not write code and
must never be asked to. Your job is to turn "we need a poster for Thursday" into
a set of files they can upload.

Four things shape everything below.

- **The picture and the words are made separately, and that is the whole idea.**
  gpt-image-2 makes a **textless, logoless plate**; every word and both marks are
  then set in code. Ask a generator for a poster and you get invented signage and
  lettering that is the right shape from three metres and gibberish from one —
  and it cannot be corrected when the venue changes. Type set in code is exact,
  re-runnable, and identical across all five sizes.
- **The facts come from the event record, never from the person.** Title, date,
  time, venue and the partner logo are read from
  `lib/data/json/events-custom.json`. So a poster cannot disagree with the
  website, and a correction goes into the event data where both read it.
- **Each size is its own design, not a crop.** A 2:1 Humanitix banner, a 4:5 feed
  post and a 9:16 story cannot be one composition — satisfying one loses the
  headline or the facts in the others. That is why there are five layouts.
- **Legibility is enforced, not eyeballed.** Every line of type is measured
  against the ground it will actually sit on, and the build fails rather than
  shipping a headline nobody can read.

## The five sizes

| Key | Size | Files | Where it goes |
|---|---|---|---|
| `humanitix` | 3200×1600 | `.jpg` | The ticketing page banner. Their stated minimum, 2:1 |
| `social` | 1080×1350 | `.jpg` + `.webp` | LinkedIn / Instagram / Facebook feeds (JPEG), **and the website's cover image** (WebP) |
| `story` | 1080×1920 | `.jpg` + `.webp` | Instagram and Facebook stories |
| `square` | 1080×1080 | `.jpg` + `.webp` | A square Instagram grid tile |
| `poster` | 1400×1980 | `.webp` | The event page and print. The only one carrying the street address |

One image serves LinkedIn, Instagram and Facebook because all three now favour
4:5 portrait — it is the tallest thing that is not cropped in a mobile feed.

**File format here is an upload constraint, not a quality preference**, and two
platforms disagree with what the web would prefer:

- **Humanitix rejects WebP outright** — JPEG, PNG and SVG only. A WebP looks
  perfect locally and simply cannot be uploaded, which is discovered by whoever
  is trying to publish the event, not by whoever made the file.
- **Instagram accepts WebP but handles it inconsistently on mobile**, which is
  where these actually get posted from. Anything Instagram-bound therefore ships
  a JPEG.

That is why several formats write two files. Same artwork, different door: hand
over the `.jpg` for uploading and keep the `.webp` for the website.

## The workflow

### 1. Find the event, and read it back

Locate it in `lib/data/json/events-custom.json` by slug or title. Read back what
the artwork will say and wait for a yes:

```
Event : No Pain, All Gain – Getting Fit for AI
When  : Thursday, 3 September 2026, 5:00pm – 7:30pm NZST
Where : Les Mills Auckland City
With  : Les Mills
```

Not in the repo? Stop. The artwork reads its facts from there, and a poster built
on a guessed date is worse than no poster:

> That event isn't on the website yet, and the poster reads its date and venue
> from there. Let's run `/sync-event-from-slack` first so the poster can't
> contradict the event page.

A fact is wrong? **Fix it in `events-custom.json`, never in the poster** — inside
`detailPageData` only, never `id` or `slug`. Read the change back first, and
commit it separately as `fix(events): …`; it changes the public event page too.

### 2. Decide what the picture is

This is the only genuinely creative step, and it is worth a real conversation
rather than a prompt written on their behalf.

Ask what the event is *about* — not the agenda, the idea. Listen for a concrete
noun. "AI is everyone's job, not just the tech team" became a braid of
fibre-optic strands lit from within: many separate filaments, one bundle, light
travelling through all of them. That image came out of the sentence, and the
whole deck was later built from it.

Then say the concept back in one sentence before generating anything. If you
cannot say it in a sentence, there is no concept yet — ask another question
rather than generating four variations of nothing.

`references/plate-prompts.md` has the prompt structure that works, the scope
rules, and worked examples. Read it before writing a prompt.

### 3. Generate candidate plates

```powershell
npx tsx scripts/events/generate-poster-plate.ts <event-slug> --probe
npx tsx scripts/events/generate-poster-plate.ts <event-slug> --n 4 --size 2048x3072
```

`--probe` first, once per project, to confirm what sizes the model offers — it is
one cheap call and a larger plate removes an upscale from every format.

You get four PNGs, a contact sheet, and the **mean luminance of the regions the
type will land in**. Lower is better. That number turns "which of these four"
from taste into evidence: a plate whose headline zone reads 0.28 needs a heavier
scrim than one reading 0.06, and one reading 0.5 is not a candidate.

Show the contact sheet. Let them pick. Their event, their picture.

### 4. Build every size

```powershell
npx tsx scripts/events/build-event-poster.ts <event-slug> `
  --plate tmp/plates/<chosen>.png `
  --strapline "Join She Sharp and <partner> for <what it is>"
```

Useful flags: `--only social,humanitix` to rebuild a subset, `--suffix v2` to
write beside the existing files instead of over them, `--accent`/`--spark` to
override the colours.

**Colours resolve themselves.** If the event already has a slide deck its theme
is reused, so the poster and the projector are one piece of art direction. If
not, it falls back to the She Sharp default and says which it used.

**The strapline is optional and it is yours, not the event record's.** It is a
framing sentence, so it lives on the artefact rather than in the data. With none
given the posters carry the title and the facts, which is a perfectly good
poster. Do not lift one out of `fullDescription` — that is paragraphs, and a
truncated paragraph is a sentence nobody wrote.

### 5. Look at it, in the right order

The build writes cover crop previews to `tmp/poster-review/`. Look at
**`-cover-16x9.webp` first**: `social` doubles as the website's cover image and
is rendered at five different aspect ratios, of which 16:9 is the cruellest. A
headline that survives that band has cleared the hardest constraint in the set.

Then the full sizes. Specifically check:

- the **Humanitix banner** — type on the leading edge, picture open on the right
- the **story** — nothing important in the top or bottom 250px, where Instagram
  and Facebook draw their own interface over your artwork
- the **poster** — the display lines should land on the same right edge, because
  they are solved to the same column

Show them the images. Iterate on the plate choice or the copy, not by nudging
numbers.

### 6. Hand over

Say plainly which file goes where — they are uploading these by hand:

> Five files, all in `public/img/events/`:
> - `…-humanitix.jpg` → the banner on the Humanitix event page
> - `…-social.webp` → LinkedIn, Instagram and Facebook posts
> - `…-story.webp` → Instagram and Facebook stories
> - `…-square.webp` → a square Instagram tile if you want one
> - `…-poster.webp` → the website and printing

If the `social` file is also replacing the website's cover image, that is a
second change: point `coverImage.url` in `events-custom.json` at it and update
the `alt` text. Say so rather than doing it silently — it changes a public page.

## When the build refuses

It fails rather than shipping something unreadable. Each failure means a specific
thing.

**`Type would be hard to read: … contrast 2.09:1`** — that line cannot be read on
that ground. Almost always it is small type in the brand magenta: `#c846ab` is
4.61:1 on *pure black*, so over anything lit at all it cannot reach 4.5:1 and no
scrim rescues it without throwing the picture away. Magenta carries solid fills
like the RSVP pill; the bright spark colour carries ink.

**`… a highlight at luminance 1.00 runs through it`** — a bright part of the
picture is crossing the letters. The mean looked fine; a single lit strand
through a word does not move an average but does make the word unreadable. Move
the line, deepen that format's scrim, or pick a plate with darker ground there.

**`… outside the story safe area 250–1670`** — type would sit where Instagram and
Facebook draw their own interface. Not clipped: *covered*. It looks right in the
file and in the preview and is hidden only once live.

**`… outside the safe band 445–778`** — on the `social` size, type would be
cropped away by an event card on the website. Shorten the title or drop a line.

**`"…" wanted 195pt … and was capped`** — cosmetic. The line will not quite reach
the column edge, so the right edges stop aligning. Raise that format's
`titleMax` in `poster-formats.ts` if it matters.

## Adding a platform

A new size is one entry in `FORMATS` in `scripts/events/poster-formats.ts`: the
dimensions, the encoder, a size band, one line on what it is for, and a layout.
Most layouts are the shared stack — kicker, title, rule, strapline, facts —
positioned over the plate, so a new one is short. Nothing else changes.

Two things to get right, both learned by getting them wrong:

- **A landscape format needs its crop pulled onto the subject.** A 2:1 window
  centred in a portrait plate lands on the empty space the prompt deliberately
  left below the subject, giving a banner with its picture in one corner and half
  a frame of black.
- **`gap.afterKicker` is clear space, and the builder adds the title's cap
  height.** Do not treat it as a baseline-to-baseline distance.

## Guardrails

1. **Never invent a fact.** Dates, times, venue, partner names come from
   `events-custom.json`, and a correction goes back into it. A poster is the
   organisation's public word; a wrong start time is a promise, not a typo.
2. **Never generate people, faces or taonga, and never anything that could pass
   for a real She Sharp photograph.** No carving, woven pattern, moko or iwi
   motif — imitating taonga is appropriation whoever holds the pen. And the
   archive's entire value is that it is true: one convincing fake means nobody
   can trust any of the twelve years of real photographs beside it. Abstract
   subjects are safe precisely because they could never be mistaken for a room.
3. **No text or logos inside the generated image.** Those are set in code, where
   they can be corrected, kerned and translated.
4. **Never hand the author a stack trace, a lint rule or a hex code.** Explain in
   plain words what happened and what you changed.
5. **The legibility gate is not advice.** If it fails, the design changes. Do not
   reach for `--no-gate` to get an image out; it exists for inspecting a failure,
   not for shipping past one.
6. **Repo conventions apply.** English in all on-screen strings and code
   comments, Conventional Commits, no new files under `docs/`.

## Reference

- `references/platform-sizes.md` — every platform's requirements, where the
  numbers came from, and how to check they are still current.
- `references/plate-prompts.md` — how to write a gpt-image-2 prompt that leaves
  room for type, with worked examples and the scope rules.
