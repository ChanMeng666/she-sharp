---
name: make-event-video
description: Build a short social video for one She Sharp event, in every size the organisation actually posts — 1080×1920 vertical, 1080×1350 feed, 1080×1080 square, 1920×1080 landscape — as a Remotion composition cut to a Suno soundtrack. Use this whenever someone wants a promo before the night or a recap after it — phrases like "make a promo video for the Les Mills event", "we need a Reels for Thursday's panel", "can you do a recap of last week's night", "TikTok for the hackathon", "LinkedIn video", "event trailer", "aftermovie", "highlight video", "活动宣传视频", "给这场活动做个短视频", "活动回顾视频", "做个 Reels", "做个 TikTok", "领英视频", "宣传片", "回顾片" — and also when they ask to add music to a video already in progress, or to re-render after a date, venue or speaker changed. Facts come from the event record so the video cannot disagree with the website. Not for still posters (that is /make-event-poster), not for the projected deck (that is /build-event-slides), and not for emailing anyone.
---

# Make a video for one event

The person you are working with runs She Sharp events. They do not write
Remotion. Your job is to turn "we need a Reels for Thursday" into four MP4s
they can upload, with the drop on the title and the date matching the website.

Four things shape everything below.

- **The facts come from the event record, never from the person.** Title, date,
  time, venue, speakers and the partner logo are read from
  `lib/data/json/events-custom.json` (or `shesharp_events_v3.json` for scraped
  history). A video that says Thursday while the page says Wednesday is a
  failed video, however good it looks.
- **Each size is its own design, not a crop.** A 9:16 story, a 4:5 feed post
  and a 16:9 YouTube file cannot share one composition. Scenes ask
  `useLayout()` and recompose. Letterboxing a master is how a PowerPoint
  export looks.
- **The picture is cut to the music.** Ask Suno for 120 BPM, then *measure*
  what comes back and recut the edit to that tempo. Stretching the track to
  fit an assumed 120 is how the title misses the drop.
- **The Remotion project is a sibling of this repo, never inside it.**
  `tsconfig.json` includes `**/*.tsx`. A Remotion tree in `tmp/` or anywhere
  else under she-sharp is swept into `pnpm typecheck` and `next build`.

Read `references/pitfalls.md` once per session. The rest of the references
are pointed at from the step that needs them.

## Two kinds, one engine

| Kind | When | Job |
|---|---|---|
| `promo` | Before the night | Make someone who missed last time come this time |
| `recap` | After photographs are in the repo | Show what happened, thank the room, point at what is next |

The shapes, scene by scene, are in `references/story-shapes.md`. Read that
before writing a timeline. Do not mix them: a recap that still says RSVP, or
a promo that opens on last week's crowd without saying it is last year, both
fail.

## The four sizes

| File suffix | Pixels | Where it goes |
|---|---|---|
| `vertical_1080x1920` | 1080×1920 | Reels, Stories, TikTok, Shorts, LinkedIn vertical |
| `portrait_1080x1350` | 1080×1350 | Instagram + Facebook feed |
| `square_1080x1080` | 1080×1080 | LinkedIn + Instagram feed |
| `landscape_1920x1080` | 1920×1080 | YouTube, LinkedIn landscape, in the room |

Always all four, unless they name one platform. Why the numbers, and the 9:16
safe area, are in `references/sizes.md`.

## When NOT to apply

| The ask is | Use instead |
|---|---|
| A still poster, banner, story graphic, speaker tile | `/make-event-poster` |
| The deck the room sees | `/build-event-slides` |
| A typo on slides an hour before doors | `/tweak-event-slides` |
| Email the mailing list about the event | `/promote-event` |
| "What's left for Thursday?" as a whole | `/run-event-playbook` |
| A flagship / multi-day film they have already storyboarded as something else | Say so; this skill will still render four sizes, but the nine-scene promo shape will not fit — design a shorter highlight |

## Prerequisites

1. **Working directory is the she-sharp repo root** for reading event data.
   Remotion commands run in the sibling project after Step 3.
2. **You know which event**, as a slug or something Step 0 can narrow.
3. **FFmpeg is on PATH.** `ffmpeg -version` must work.
4. **Node 18+.** Remotion's `create-video` needs it.
5. **A promo** needs the event in the repo (page + at least a poster or
   speaker headshots). **A recap** needs photographs in
   `public/img/events/<slug>/` (`photo-*.webp` or a built archive).

---

## Step 0 — Which event, which kind

If they did not name a slug:

```powershell
npx tsx scripts/events/event-status.ts
```

Pick one. Then decide `promo` or `recap` from the words they used
("coming up" / "last week" / "回顾"). If the event has not happened and they
asked for a recap, say so and offer a promo instead.

## Step 1 — Read the record, look at the pictures

Resolve the event. Upcoming custom records live in
`lib/data/json/events-custom.json`; scraped history in
`shesharp_events_v3.json`. Copy, do not retype: title, date, time, venue,
address, kicker, speakers (name, role, `image`), sponsor logo,
`registrationUrl`, `attendees`, `checkedIn`.

Find photographs. `references/photography.md` is the map — this event's
folder, a prior edition of the same partnership, `legacy-site`. **Look at
every candidate** and classify `fullBleed` / `wideOnly` / unusable *before*
any of it is copied. A child in the front row of a group shot is allowed as
a whole frame and forbidden as a Ken Burns crop.

For a recap, stop if there are no photographs yet:

> The close-out hasn't put pictures in the repo, so a recap would have
> nothing to show. The next job is T+1w on the playbook — album URL, then
> `build-event-archive`. Want me to start there instead?

## Step 2 — Stop and show the plan

Nothing is scaffolded until they approve a short plan. Include:

- Kind, slug, working title of the video
- The scene list (from `story-shapes.md`, adapted to what the pictures
  actually support)
- Which photographs, and how each will be framed
- The four output sizes
- That they will generate the music in Suno, from a prompt you will write
- Where the Remotion project will sit
  (`../she-sharp-event-videos/<slug>-<kind>/`)

Wait. If they want a different hook, change the plan, do not start building.

## Step 3 — Scaffold outside this repo

```powershell
# parent of she-sharp, not inside it
cd ..
if (-not (Test-Path "she-sharp-event-videos")) { New-Item -ItemType Directory she-sharp-event-videos | Out-Null }
cd she-sharp-event-videos
npx --yes create-video@latest --blank --yes "<slug>-<kind>"
cd "<slug>-<kind>"
npm install
npm install @remotion/google-fonts @remotion/transitions
```

Copy the starter over the scaffold (from the she-sharp repo):

```
.claude/skills/make-event-video/assets/starter/src/   ->  src/
.claude/skills/make-event-video/assets/starter/tools/ ->  tools/
.claude/skills/make-event-video/assets/starter/render.ps1
.claude/skills/make-event-video/assets/starter/preview.ps1
.claude/skills/make-event-video/assets/starter/remotion.config.ts
```

Leave `package.json` as `create-video` wrote it, so versions stay aligned.
Delete the scaffold `src/Composition.tsx`. You still have to write
`src/Promo.tsx`, `src/data.ts` and `src/scenes/*` — the starter is the
engine, not the film.

Copy assets into the Remotion `public/` folder:

```
public/photos/          classified event photographs
public/panel/           this event's speaker headshots
public/speakers-prior/  prior-edition faces, if any
public/brand/she-sharp-white.png   from she-sharp/public/logos/
public/brand/partner.svg           from the event record's sponsor logo
public/brand/poster.webp           this event's poster, for colour sampling
public/music/                      empty until Step 7
```

## Step 4 — Tokens from the poster, facts from the record

Sample the poster's colours so the video is the same campaign:

```powershell
# from the she-sharp repo root; sharp is already a dependency
node .claude/skills/make-event-video/scripts/sample-poster-colors.mjs public/img/events/<slug>/poster.webp
```

If the environment cannot decode WebP, convert first:

```powershell
ffmpeg -y -v error -i public/img/events/<slug>/poster.webp tmp/poster-for-sample.png
```

Put the hex values in `src/theme.ts`. Write `src/data.ts` from the event
record. Pre-break every headline into `copy.*` line arrays — `RevealLines`
sets `whiteSpace: "nowrap"`, so a bad break shows up as overflow rather than
a silent reflow. Longest line ~17 characters at display size.

`attendees` is registrations. The line on screen says "registered". See
`references/photography.md`.

## Step 5 — Write the edit

`Promo.tsx` declares scenes in **beats**, not frames. Copy the beat-math
from `she-sharp-promo-video/src/Promo.tsx` (sibling of this repo) or from
the first shipped cut: start beats account for a one-beat overlap per
transition; `TITLE_CUT_FRAME` is exported so the music window can aim at it.

- Put the title (promo) or the biggest crowd beat (recap) on a **multiple of
  4 beats** so a bar-aligned music window can start on a bar.
- Slide, do not fade, between two type cards.
- `KenBurns` only on `fullBleed` photos. `PhotoCard` on `wideOnly`.
- `LogoLockup` takes an optional partner src; invert black SVGs.

`npx tsc --noEmit` in the Remotion project before any render.

## Step 6 — Preview every size, then fix

```powershell
.\preview.ps1 -Comp Promo-Vertical-9x16 -Tag v
.\preview.ps1 -Comp Promo-Portrait-4x5  -Tag p
.\preview.ps1 -Comp Promo-Square-1x1    -Tag s
.\preview.ps1 -Comp Promo-Landscape-16x9 -Tag l
```

Open `stills/_sheet-*.png`. Look specifically for: clipped descenders,
type in the 9:16 safe bands, wrapped names in a 4-up grid, a Ken Burns that
has made a child the subject, a hairline underlining an eyebrow, a title
that no longer matches the poster.

Fix, re-preview, do not skip to a full render. A full pass is several
minutes per size.

Show the vertical contact sheet to the person. If they hate the hook, that
is cheaper now than after music.

## Step 7 — Music, with them in the loop

Read `references/music.md`. Write the Suno prompt (style / lyrics-box
structure / exclude) for **this** event, with a beat map of what is on
screen when. Hand it over as copy-paste blocks. Stop.

When they return with an MP3:

```powershell
node tools/analyze-music.mjs "<their file>"
# put measured BPM in src/theme.ts; recut beats if it is not 120
node tools/find-window.mjs "<file>" <bpm> <phase> <titleSeconds> <videoSeconds>
node tools/locate-drop.mjs "<file>" <from> <to> <bpm> <phase> <titleSeconds>
.\tools\prepare-bed.ps1 -Source "<file>" -Start <barAlignedStart> -Length <videoSeconds + 0.7>
```

Set `MUSIC` to `"music/bed.mp3"`. The composition already fades. Do not
fade the file as well.

## Step 8 — Render and hand over

```powershell
.\render.ps1 -Slug <slug> -Kind promo   # or recap
```

Confirm each MP4 has an audio stream (`ffprobe`) and is ~−16 to −18 LUFS.
Then tell them, in this shape:

> Four files in `…/she-sharp-event-videos/<slug>-<kind>/out/`:
>
> - `…_vertical_1080x1920.mp4` — Reels, Stories, TikTok, Shorts
> - `…_portrait_1080x1350.mp4` — Instagram and Facebook feed
> - `…_square_1080x1080.mp4` — LinkedIn and Instagram feed
> - `…_landscape_1920x1080.mp4` — YouTube, LinkedIn landscape, the room
>
> The drop lands on the title. Date, time and venue match the website.

Do not commit the Remotion project into she-sharp. Do not put the MP4s in
`public/` unless they ask for that as a separate, reviewed change.

## Guardrails

1. **Never scaffold Remotion inside she-sharp.** Not in `tmp/`, not in
   `.claude/`, not "just this once". *Why:* the site tsconfig and the Next
   build will ingest it; `tmp/` already breaks production builds when it
   holds stray files.
2. **Never Ken Burns a `wideOnly` photograph.** *Why:* a child in a group
   shot is allowed; a crop that makes them the subject is not, and the
   difference is a CSS `scale()`.
3. **Never put `attendees` on screen as people who came.** *Why:* the field
   is registrations; the live page has got this wrong before.
4. **Never generate the soundtrack yourself on a free ElevenLabs key.**
   *Why:* Music API is paid-only; a 10s sound-generation loop is not a
   track. The person uses Suno.
5. **Never invent a speaker face, a date, a venue or a registration URL.**
   *Why:* the whole point of reading the record is that the video and the
   site cannot disagree.
6. **Nothing is final until they have seen a contact sheet.** *Why:* a
   12-minute four-size render of a hook they hate is how a day disappears.

## Reference implementation

The first shipped cut — She Sharp × Les Mills, 3 September 2026 promo, using
May 2024 *Own the Unexpected* photographs — lives at
`../she-sharp-promo-video` next to this repo. Read `src/Promo.tsx`,
`src/data.ts`, `src/layout.ts` and `src/theme.ts` there if the starter and
this file disagree: the filesystem of a video that actually rendered is
right.
