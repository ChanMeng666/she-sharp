# Images, logos and QR codes

Everything a deck displays is a file already committed to the repository. There
is no upload step, no image host, and no network call at the venue — which is
the point. Once the deck has loaded, the wifi can die and nothing changes on
screen.

**One rule governs every choice below.** A photograph is either a **subject** —
one picture the room is meant to look at, which keeps its own colours — or it is
**mass**, many pictures read as one surface, which takes the purple duotone.
Decide which before you go looking, because it changes what you need: a subject
has to be sharp and big, and a tile in a wall does not.
`references/slide-types.md` explains why the deck is built this way.

---

## Where things go

| What | Where |
|---|---|
| Photos for this event | `public/img/decks/<event-slug>/` |
| Speaker headshots, event posters | `public/img/events/` — usually already there |
| Sponsor and partner logos | `public/img/sponsors/` — usually already there |
| Past-event photography (the fallback) | `public/img/curated/` |
| The wider archive | `public/img/scraped/photos/` |
| Generated backgrounds for karakia and chapter breaks | `public/img/plates/` |
| QR codes | `public/img/decks/<event-slug>/qr-<what-it-does>.png` |

**Check `public/img/events/` and `public/img/sponsors/` before asking the author
for anything.** `sync-event-from-slack` has usually already downloaded the
poster, the speaker headshots and the sponsor marks when it built the event
page. Asking someone to re-send a file they already sent is a small thing that
makes a tool feel like work.

## Naming

Lowercase, hyphens, and named for **what the photo shows** — not the camera's
filename, not the date.

```
public/img/decks/aut-panel-night-2026/
  group-photo.jpg
  venue-atrium.jpg
  panel-in-progress.jpg
  qr-feedback.png
  qr-ambassador.png
```

`IMG_4471.jpg` is unfindable in six months. `panel-in-progress.jpg` is
self-documenting, and the next person to update the deck knows what they are
looking at without opening it.

## Formats and sizes

**All of JPEG, WebP, PNG and SVG work.** Ask the author for the biggest version
they have and do not ask them to convert or resize anything.

| Use | Format | Size to aim for |
|---|---|---|
| Full-bleed photo | JPEG or WebP | 1920px wide or more |
| Supporting photo, grid tile | JPEG or WebP | 1280px wide or more |
| Headshot | JPEG | 600×600 or more, square-ish |
| Logo | SVG when one exists, PNG otherwise | any — SVG scales, PNG wants 800px wide |
| QR code | PNG | 800×800 or more, plain black on white |

The stage is 1080 tall and stretches to 2520 wide on a 21:9 screen, so a
1024px-wide photo used full-bleed will look soft. It will still render — nothing
breaks — but it will be visibly worse than everything around it.

## How photographs get cropped

A photograph filling a slide almost never has the slide's exact shape, so
something gets cut off. The deck **always cuts from the bottom** — the top of
the frame is kept.

That is not a stylistic preference. The archive is overwhelmingly group shots,
and the browser's default behaviour takes an equal bite out of the top and the
bottom, which on those photographs removes the top of people's heads. Cropping
from the bottom loses some floor and some chair backs instead.

Two things follow:

- **Headroom in a photo is not wasted space.** A shot where the group sits low
  in the frame crops beautifully; one cropped tight to the top of the heads
  already has nothing to give.
- **When the interesting part is low in the frame** — a table of prototypes, a
  whiteboard at waist height — say so and the crop can be moved for that one
  image. It is a per-photo override, not something you have to accept.

## What the archive actually contains

Someone counted. A survey of **835 images** in the repository turned up two
facts that will change what you can promise the author.

### Almost none of them are big enough to fill a screen

Only two groups clear 1920 pixels wide: the **47 curated images** (the
`*-1920.webp` files) and **about sixty** of the files in
`public/img/scraped/photos/`. **Everything else is capped between 1200 and
1368 pixels**, and — this is the part that surprises people — that includes most
of the 2023–2026 photography. The newer the photo, the more likely it came off
a social post at whatever size the platform served.

So:

| | Verdict |
|---|---|
| A 1200px photo as a full-bleed hero | **No.** It is being stretched past its own size on a projector and everyone can see it |
| The same photo as one tile in a wall | **Fine.** It is a fraction of the screen, and the duotone hides the upscaling anyway |
| The same photo as a supporting image beside bullets | Fine |
| The same photo as a headshot | Fine |

The practical habit: when you want a slide-filling photograph, look in the
curated set first, and if the shot you want is not there, use it in a grid
instead of alone rather than blowing it up.

### There is no photograph of a mentor and a mentee together

Not one, anywhere in the survey — no picture of the one-to-one meeting that is
the organisation's flagship programme. Every mentorship photo in the archive is
a room full of people at a launch or a panel.

That is not a problem you can solve inside a deck, and you should not try:
captioning a group shot as "mentorship" is the exact kind of quiet inaccuracy
this skill exists to prevent. **Say it to the author instead**, once, at the
point it bites:

> There's no photo anywhere of a mentor and mentee actually meeting — the whole
> archive is group shots. I've used the mentorship launch photo here instead and
> labelled it as that. If someone can get two people at a table at the next
> event, it would fill a real gap.

It is a thirty-second ask that fixes a twelve-year hole.

**Photos are not automatically optimised.** There is no `next/image` in the
deck: it serves the exact file you commit, on purpose, because a serverless
image round-trip can cold-start at exactly the wrong moment. So a 12MB phone
photo really is 12MB over venue wifi. Downscale anything enormous before
committing it.

## What sponsor logos look like on a dark slide

Sponsor marks are a mixed bag — some are dark artwork, some light, many
multi-colour. On dark slides they sit on **a white chip** rather than being
filtered or inverted, because filtering mangles a multi-colour logo and
inverting turns a brand's blue into orange.

What that means for you:

- **A logo with a transparent background is fine.** It lands on white.
- **A logo with a baked-in white background is also fine** — the chip is white
  too, so the join is invisible.
- **A logo with a baked-in dark background will look wrong** — a dark rectangle
  inside a white chip. Ask for a transparent or light version, and if there
  isn't one, say so rather than shipping it.
- **Very wide or very tall marks** are fitted inside the chip rather than
  cropped, so nothing gets cut off. They just occupy less of it.

QR codes use the same white chip, which is also why a QR image must be plain
black on white with a quiet margin. A code with a coloured or transparent
background will not scan reliably from across a room.

## QR codes

**Nobody makes QR images for a deck.** You write the URL and the code is drawn
in the browser, in She Sharp purple, every time the slide renders. A link and
its code therefore cannot drift apart, and there is no image to re-export when
a form URL changes. Generation is client-side, so a code on screen never needs
the venue's network.

```ts
{ url: "https://example.com/form", label: "Feedback form", caption: "Ask the host for the link" }
```

`QrBlock.image` still exists as an escape hatch for a code somebody else
produced that must be used verbatim — a ticketing platform's branded one, say.
It is only used when `DECK_QR_MODE` in `lib/deck/theme.ts` is set to `"image"`,
which is not the default.

Practical consequences:

- **Always give a caption** — a short, human-typable version of the destination
  (`shesharp.org.nz/events`). Half the room photographs the slide instead of
  scanning it, and the back row is too far away for the code to resolve at all.
- **A URL you do not have yet is an empty string, never a guess.** Leave
  `url: ""` and the slide renders a dashed "Link not set yet" panel, and the
  linter reports it. That is the honest state. Pointing the code at last event's
  form instead is the failure this is designed to prevent: it looks perfectly
  fine from the front of the room while collecting the wrong data.
- **The ambassador code is not yours to write.** It is the same standing form
  for every event, supplied by `buildClosingSlides()` from `AMBASSADOR_FORM_URL`
  in `lib/deck/boilerplate.ts`. Change it there, once, if it ever moves.
- **The feedback code is a fresh Google Form for every event.** There is no
  default and there should never be one. It is a required question in the
  interview — see Round 7 of `content-checklist.md`.
- **Open every QR destination in a signed-out browser before the event.** Not a
  normal window — an incognito one, or another browser you are not logged into.
  This is the single check most worth doing, because the person who builds the
  deck is always signed in and therefore is the one person who cannot see the
  problem.

  If it lands on a Google sign-in page, attendees who are not signed in — or who
  are signed in with the wrong account — hit a wall at the exact moment they are
  holding up a phone in a room full of people. Three causes, and only two of
  them are fixable:

  | What you see in Settings | Fix |
  |---|---|
  | **Collect email addresses** = "Verified" | Change to **"Responder input"** — it asks for the email as an ordinary question instead of forcing a login. Do not use "Do not collect" on a form whose whole purpose is to reach people. |
  | **Limit to 1 response** is on | Turn it off. It identifies people by Google account, so it requires one. |
  | **Restrict to users in \<organisation\>** is on | Turn it off, or in Drive set General access to "Anyone with the link". |
  | **"because this form has File Upload questions, respondents will be required to sign in"** | **Not fixable.** See below. |

- **A Google Form with a file-upload question always requires sign-in.** The note
  appears under "Collect email addresses" in Settings, and there is no toggle for
  it — the upload has to land in somebody's Drive, so Google insists on knowing
  who is uploading. The She Sharp ambassador form has one, which is why
  `AMBASSADOR_FORM_URL` points at `shesharp.org.nz/join-our-team` and not at the
  form.

  Point the code at a public page that links onward to the form. It costs one
  extra click and it is the better flow anyway: nobody attaches a CV standing in
  a hall. What should happen in that moment is *"I am interested and I know
  where to go"*, which a public page does and a login wall does not.

## The archive wall

When photographs are being used as mass, they do not come from a list you write.
`lib/deck/wall-tiles.ts` holds a pool of **130 photographs spanning 2014 to
2026**, and a wall is filled from it.

The pool was assembled mechanically, not curated: landscape orientation, at
least 900 pixels wide and 40KB on disk, de-duplicated across the three photo
folders, posters and screenshots thrown out. That is the entire selection
criteria, and it is deliberately unsentimental — the wall is not a highlights
reel, it is evidence. Every path in it is checked by
`scripts/verify-image-paths.ts` in CI, so a wall cannot ship with a hole in it.

Tiles are taken by **stepping through** the pool rather than slicing off the
front, because the pool is ordered by resolution and the front of it is mostly
one very good 2023 shoot. Stepping is what keeps a wall mixed across eras and
venues, which is the only thing the wall is actually saying.

**What this means when you talk to the author:**

- **Nobody picks the tiles.** If they ask "can we make sure the Wellington one
  is in there", the honest answer is that a wall is not a selection — but a
  photograph they care about can absolutely be a `photo` slide of its own, at
  full size and in full colour, which is a better home for it anyway.
- **The individual pictures are not the point and it is fine to say so.** *"Up
  close half of these are unremarkable — that's rather the point. It's twelve
  years of rooms that filled up."*
- **Do not describe a wall as being from this event.** It never is. It is the
  whole archive, and that is what makes it worth showing.

## The archive wall

When photographs are being used as mass, they do not come from a list you write.
`lib/deck/wall-tiles.ts` holds a pool of **130 photographs spanning 2014 to
2026**, and a wall is filled from it.

The pool was assembled mechanically, not curated: landscape orientation, at
least 900 pixels wide and 40KB on disk, de-duplicated across the three photo
folders, posters and screenshots thrown out. That is the entire selection
criteria, and it is deliberately unsentimental — the wall is not a highlights
reel, it is evidence. Every path in it is checked by
`scripts/verify-image-paths.ts` in CI, so a wall cannot ship with a hole in it.

Tiles are taken by **stepping through** the pool rather than slicing off the
front, because the pool is ordered by resolution and the front of it is mostly
one very good 2023 shoot. Stepping is what keeps a wall mixed across eras and
venues, which is the only thing the wall is actually saying.

**What this means when you talk to the author:**

- **Nobody picks the tiles.** If they ask "can we make sure the Wellington one
  is in there", the honest answer is that a wall is not a selection — but a
  photograph they care about can absolutely be a `photo` slide of its own, at
  full size and in full colour, which is a better home for it anyway.
- **The individual pictures are not the point and it is fine to say so.** *"Up
  close half of these are unremarkable — that's rather the point. It's twelve
  years of rooms that filled up."*
- **Do not describe a wall as being from this event.** It never is. It is the
  whole archive, and that is what makes it worth showing.

## The curated fallback

`public/img/curated/` holds 47 real photographs from past She Sharp events —
crowds, panels, workshops, celebrations — each in three widths (768, 1280, 1920)
with **alt text already written**. `public/img/curated/index.ts` lists them all
with a role (`hero`, `divider`, `card`, `support`) and their dimensions, and
exports `toSrcSet()` for the responsive attribute.

These 47 are also the only past-event photographs large enough to fill a
projector, which makes the curated set the first place to look for any slide
that needs one photograph rather than many.

Use them when the author has no photo of their own for a slide that needs one:
a section divider, a background behind a karakia, a photo grid showing what a
She Sharp event feels like.

**Two rules, and they are not negotiable.**

1. **Say so when you offer.**

   > You haven't got a venue photo yet, so I've put a shot from last year's
   > conference behind the section divider. It's a real She Sharp photo, just
   > not from this event — happy to swap it the second you have one.

2. **List every borrowed photo, slide by slide, in the Step 7 preview.**

   ```
   Curated photos used:
     slide 9  "The challenge"      ← divider-crowd-wide (2024 conference)
     slide 16 "Thank you"          ← celebration-group-smiles (2025 anniversary)
   ```

Never describe a curated photo as being from this event, and never let one reach
the projector without the author knowing it is there. The author is the only
person who knows it is from a different room; the audience is the only person
who will notice on the day.

**Not a licence to skip asking.** Offer the fallback after the author has said
they have nothing, not instead of asking.

## The generated plates

`public/img/plates/` holds six backgrounds that are **not** photographs of
anything real. They exist because the archive could not supply them: of 835
images there is exactly one contemplative natural frame and no landscape,
coastline, sky or dawn at all. Every single She Sharp photograph is indoors
under artificial light. A karakia needs somewhere quiet to sit, and there was
nowhere.

| Plate | What it shows | Sits behind |
|---|---|---|
| `whenua-pounamu-sea` | A calm dark sea at first light, the water greenstone green | The opening karakia — its second line is *"kia whakapapa pounamu te moana"* |
| `whenua-koru-unfurl` | A single silver fern frond unfurling, backlit | Karakia, ceremony, an opening |
| `whenua-harakeke-dusk` | Harakeke blades against a deep dusk sky | Karakia, a closing |
| `light-aurora-sweep` | Magenta and pale green light across a near-black field | Chapter breaks |
| `light-prism-edge` | One thin blade of refracted light on a steep diagonal | Chapter breaks |
| `light-deep-field` | A faint bloom of purple low in a violet-black field | Chapter breaks |

Each is 1920 and 1280 wide, and each records **where the frame is empty** — the
three whenua plates leave their left side clear, the three light plates are
mostly clear. Put the type in the clear part.

### What may be generated, and what may not

The scope is narrow on purpose, and it is a rule rather than a preference.

**Generate whenua only** — land, water, plants, light. That is what the karakia
itself speaks about, and it is the whole permitted subject.

**Never people.** **Never taonga**: no carving, no woven pattern, no moko, no
motif belonging to any iwi. Generating those is appropriation dressed up as art
direction, and the fact that a machine made it is not a defence.

**And never anything that could pass for a real She Sharp photograph.** That is
the worst outcome available here, worse than a bad-looking slide. The archive's
entire value is that it is true; a generated room full of generated women at a
generated event poisons every real photograph next to it, because from then on
nobody can tell which is which. If a generated image would make a viewer ask
"was I at that?", it should not exist.

## Asking for a plate that does not exist

Image generation is available (gpt-image-2, via the `OPENAI_API_KEY` already in
the project). The author does not need to know any of that — they say what they
need and you produce it.

> **Author:** "Is there something calmer for the closing? The dusk one feels
> like the start of something, not the end."

They get back a still, photographic-looking natural frame with somewhere for the
type to go, in the same family as the six above, saved into
`public/img/plates/`. What they will not get, whatever they ask for, is people,
taonga, or anything resembling an event photo — say so plainly if the request
drifts there, and offer the whenua version instead.

**The prompt shape that works** is three parts in this order:

1. **The subject**, described as a photographer would frame it — the light, the
   time of day, the weather, what is in focus.
2. **Explicit clear space for type**, named: *"the left third of the frame is
   empty water"*, *"the top half is open sky"*. Without this you get a beautiful
   image with the subject dead centre and nowhere to put a word.
3. **The house rules, verbatim:**

   ```
   Photographic, not illustration. No people, no faces, no text, no logos.
   Cinematic, restrained. Fine natural film grain, deep blacks, no oversaturation.
   ```

That third block is doing more work than it looks. "No text" is what stops a
generator inventing signage in a language it does not speak; "no oversaturation"
and "deep blacks" are what let the result sit beside the real photographs
without looking like a screensaver.

Then **write it into the manifest** at `public/img/plates/index.ts` with a role,
its clear space and real alt text, so the next person can find it without
opening the file. And tell the author, in the Step 7 preview, which slides are
carrying a generated background — the same rule as a borrowed curated photo.

## The CI gate

`scripts/verify-image-paths.ts` reads every string in `lib/`, `app/` and
`components/` that looks like `/img/…` or `/sponsors/…` and checks the file
exists under `public/`. It runs on every pull request to `main` and **fails the
PR** when one does not.

Run it yourself before pushing:

```powershell
npx tsx scripts/verify-image-paths.ts
```

A clean run prints:

```
▶ Verified 214 unique image paths referenced across 389 usages.
✓ All referenced image paths resolve to files on disk.
```

A failure names the path and the line that referenced it. The usual causes, in
order of frequency:

- **`.jpeg` written where the file is `.jpg`** (or the reverse).
- **A capital letter.** `public/` is served case-sensitively in production even
  though Windows will happily open the file locally. This one passes on your
  machine and fails in CI.
- **A photo that was described in the conversation but never actually sent.**
- **A file committed to the wrong folder** — `public/img/<slug>/` instead of
  `public/img/decks/<slug>/`.

The gate only catches broken references *forward*. If you rename or replace an
image, `git rm` the old file too — an orphaned photo sits in the repository
forever and the gate will never mention it.

## What a missing image looks like on screen

Not a broken-image icon. `components/deck/deck-image.tsx` swaps in a brand
gradient carrying the alt text, which from ten metres away reads as a design
choice rather than a mistake.

That is a safety net for the day, **not a rendering style**. If you see a
gradient with words on it while previewing, an image is missing — find it.
