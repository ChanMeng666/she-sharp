# The speaker set

The event artwork announces the evening. It can be posted once. This is the
other half: one poster per person, posted one at a time across the weeks before
the event.

## Why a campaign is drip-fed

An event goes on sale six weeks out and fills in the last ten days. Posting the
same picture five times in that window trains a follower to scroll past it. One
speaker at a time gives every post a new face, a new name and a new reason,
while the link, the date and the venue stay identical — so the campaign
accumulates instead of repeating.

Recommended order, though the organiser decides:

1. the event `social` poster — *this is happening*
2. `lineup-social` — *here is who is on the panel*
3. one speaker a week, `speaker-*-social` in the feed and `speaker-*-story`
   the same day
4. `speaker-*-square` if the Instagram grid needs a tile

## The copy rules

Everything on a speaker poster is one of three things: **who this is**, **what
event**, or **when and where**. Nothing else goes on.

| Line | Where it comes from |
|---|---|
| role kicker | derived — see below. The only derived string on the poster |
| name | `speaker.name`, verbatim |
| job title | `speaker.title`, wrapped to at most two lines, never truncated |
| company | `speaker.company`, omitted when the record has `""` |
| hook | yours, ≤9 words, optional — see below |
| event title | `event.title` |
| when / where | the event record |

**Deliberately absent: the bio, the agenda, the street address, the LinkedIn
URL, the strapline.** The caption under the post is the briefing; the poster is
the thing that makes somebody stop scrolling long enough to read it. A poster
carrying a paragraph is a poster nobody reads on a phone.

The job title is **wrapped, not clamped**. The deck clamps a role to six words
because a person there is one card in a grid of four; a poster gives the same
string a whole column. Clamping "Head of Finance – LM Media & Automation Lead"
to six words produces "Head of Finance – LM Media", which is not a shorter job
title, it is somebody else's. A title that genuinely needs three lines is
refused and named, and the fix goes into `events-custom.json` where the event
page reads it too.

## The role kicker, and the judges

Two words above the name — `PANELLIST`, `KEYNOTE`, `HOST`. It is derived, in
this order:

1. `--role "…"`, verbatim.
2. The group's own **heading**: "Meet the Judges" → `JUDGE`, "Meet the Panel" →
   `PANELLIST`, "Facilitator" → `FACILITATOR`.
3. The group **key**, as a fallback.
4. Nothing matched → **refuse and ask.** It never prints a vague "SPEAKER".

The heading is asked before the key because the key lies. The 2026 hackathon
files its **judges** under the `panelists` key, heading "Meet the Judges" — a
key-driven label would print `PANELLIST` on a judge's poster, beside their
photograph, in public. `poster-speaker.test.ts` pins that exact case against the
real record, so a re-sync that rewords the heading fails a test rather than a
printed poster.

**Read the derived label back before building.** It is the only string on the
poster that is not read out of the event record, and Guardrail 1 says never
invent a fact about a person:

> Keryn McKenzie — I'll label her **PANELLIST**, taken from the event's own
> heading "Meet the Panel". Say the word if it should read something else.

## The hook

One line, at most nine words, saying what this person brings. It is optional and
it is the artefact's, not the record's — the same division `--strapline` already
makes.

Draft one per speaker **from their bio**, read all of them back together, and
set only the ones the organiser approves. Then write the approved lines to
`tmp/<slug>-hooks.json` and pass `--hook-file`:

```json
{
  "keryn-mckenzie": "Where the data actually meets the decision",
  "carolina-lobos": "What AI changed about the finance team",
  "ben-sullivan": "The legal questions nobody asks first",
  "gemma-lynskey": "Getting a whole company to change its mind"
}
```

A good hook is a **claim, not a summary**. "Head of Finance who is interested in
automation" is the job title again; "What AI changed about the finance team" is
a reason to come. Nine words is a hard refusal, not a guideline — the fix is to
cut the sentence, never to shrink the type.

**Never lift the bio's first sentence.** It reads as a hook and it is a
paragraph's opening; truncating a paragraph produces a sentence nobody wrote.

## The three sizes

| Key | Pixels | Files | Where it goes |
|---|---|---|---|
| `social` | 1080×1350 | `.jpg` | LinkedIn, Instagram and Facebook feeds |
| `story` | 1080×1920 | `.jpg` | Instagram and Facebook stories |
| `square` | 1080×1080 | `.jpg` | a square Instagram grid tile |

Plus `lineup-social` at 1080×1350 for the whole group.

**JPEG only.** These are social-only artefacts — no page on the website renders
them, so the WebP that every event size carries for the site would be a file
with no destination. And they are posted from a phone, where Instagram handles
WebP inconsistently.

**A speaker poster is never `coverImage`.** The event `social` format carries a
safe band (`SOCIAL_SAFE`, 445–778) because the website re-crops it at five
aspect ratios. A speaker poster has no such band — which is exactly what buys it
a 520px portrait — so pointed at `coverImage.url` it would have the person's
name cropped away by an event card.

## The portrait

The face is **always the real headshot from the event record**. Guardrail 2
forbids generated people, and a plausibly-fake portrait of a real, named woman
is the worst version of that problem rather than a milder one. The plate
underneath stays abstract and generated; the person does not.

- **No headshot, no poster.** A speaker with `image: ""` is refused by name, and
  so is one whose path is in the JSON but whose file was never committed. The
  fix is to add the photograph to `events-custom.json`, where the event page
  shows it too.
- **Circular, with a feathered edge and a hairline ring.** A hard circular cut
  leaves the headshot's own background — an office, a white wall, a window —
  ending at a crisp boundary against a near-black plate, which reads as a
  sticker. The last 9% of the radius fades out, and the ring is drawn just
  inside it so it reads as the picture's own edge rather than a hoop in front
  of it.
- **Warn, don't refuse, on a small source.** Headshots arrive at whatever size
  the speaker had. Three of the Les Mills panel are 800×800 and one is 358×358;
  the smaller one is upscaled about 1.5× on the story, which is soft rather than
  wrong. Silence would be the bug — the softness is invisible on a laptop and
  obvious in print.

## The geometry, and why it is solved rather than written down

The type block is **bottom-anchored** and the portrait takes the space above it.
Job titles vary from "Legal Counsel" to ninety-one characters, so fixed
baselines would fit one speaker and collide on the next. The stack is built
twice — once at `y = 0` to learn its height, then at the baseline that height
implies — which is affordable because `measure()` is memoised.

The consequence is the thing worth knowing: **a longer job title makes the
circle smaller, not the poster taller.** Only when the circle would fall below
its floor does anything fail, and then the hook is dropped first, because it was
the optional line to begin with. Below that, the build refuses and names the
field to shorten.

**The name size is solved once for the whole run, not per poster.** Fitted
independently, "Ben Sullivan" solves far larger than "Gemma Lynskey" in the same
column; four posts a week apart at two display sizes read as two designs rather
than one campaign. So the run takes the minimum across everyone in it. The
corollary: rebuilding one poster on its own later gives that name a *different*
size unless you pass `--name-size <the number the set used>`, which the build
prints on every run.

Two more rules that are easy to undo by accident:

- **The wash is `band`, never `up`.** `up` reaches 0.62 opacity only 35% of the
  way down its rect. On these layouts the type starts past halfway with a large
  lit disc above it, so an `up` rect placed low enough to leave the plate open
  gives the kicker around 0.3 — and a small tracked kicker in `spark` over a lit
  highlight at that depth will not clear 4.5:1. `band` hits 0.80 at 17% and
  holds. The rect deliberately starts *above* the bottom of the disc, which
  costs nothing because the portrait composites over the scrim.
- **The portrait composites before the legibility gate.** Plate → scrim →
  portrait → gate → type. A photograph is part of the ground a line lands on, so
  a name that strays onto a lit cheek has to be measured against the face. After
  the gate it would pass every check and ship unreadable. There is a second,
  separate assert that refuses any overlap outright, because the gate's message
  for that case ("a highlight at luminance 0.9 runs through it") sends the
  reader to deepen the scrim, and deepening the scrim cannot help.

## Where the files live, and why nothing had to change in the image gate

Output is `public/img/events/<slug>/speaker-<name-slug>-<size>.jpg` and
`lineup-<size>.jpg`, beside the headshot the poster was built from.

Nothing on the website references them, and
`scripts/verify-image-paths.ts` fails on any file under `public/img/` that
nothing references. The build therefore writes a generated
`public/img/events/<slug>/index.ts` naming every one of them.

This was chosen over two alternatives:

- **Listing each file in `KNOWN_UNREFERENCED`** — a dozen entries per event, and
  that array's whole virtue is being short enough to read.
- **A regex allow-list** — worse. That array works because an entry which stops
  being true *fails*; a pattern never goes stale, so it would quietly become the
  place broken things go to be forgotten, which is precisely what its own
  comment warns about.

The manifest needs no change to any gate: `scripts/assets/refs.ts` already scans
`public/**` for `.ts`, because `public/img/curated/index.ts` and
`public/img/plates/index.ts` are generated manifests inside the asset tree and
are the sole reference for about 143 images. And it makes the check *stronger* —
the forward check now covers these too, so deleting a poster fails CI instead of
CI staying green while somebody's scheduled post loses its picture.

It is per-event rather than one global list, so deleting an event's folder
deletes its manifest with it and a stale entry is structurally impossible; and
it is rebuilt by scanning the directory, so it is idempotent.

## Checking a change

```powershell
npx tsx scripts/events/poster-speaker.test.ts   # layout and copy, ~3 seconds, no API key
npx tsx scripts/verify-image-paths.ts
```

The test builds every format for every speaker on the trial event and asserts
what has no other guard: that no line runs off the right edge (**the legibility
gate does not look at x at all**), that nothing is set over a face, that the
story's RSVP pill clears Instagram's reply bar, and that the judges are called
judges.
