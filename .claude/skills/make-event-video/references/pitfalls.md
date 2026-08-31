# Things that already went wrong once

Each of these is a frame that shipped, or nearly shipped, in the first Les
Mills video. The skill exists so the next one does not repeat them.

## The Remotion project is not in this repo

`tsconfig.json` includes `**/*.tsx` and excludes only `node_modules` and
`scripts`. A Remotion tree anywhere inside she-sharp — `tmp/` included — is
swept into `pnpm typecheck` and `next build`. `tmp/` also breaks the production
build if stray files sit in it. Scaffold as a **sibling directory**:

```
<parent>/she-sharp/
<parent>/she-sharp-event-videos/<slug>-<kind>/
```

The Les Mills first cut lives at `she-sharp-promo-video` next to the site repo
and can be read as a reference. Do not copy it *into* she-sharp.

## ElevenLabs Music is not free

`POST /v1/music` returns 402 `paid_plan_required` on the free tier. Do not
debug this. Suno is the path; see `music.md`.

## `attendees` is not attendance

The 2024 Own the Unexpected page said "109 attended". The record is
`attendees: 109, checkedIn: 95`. The video says "109 people registered".
Do not "fix" it back to match the page.

## object-position only crops the axis cover actually crops

A 3:2 photograph in a 9:16 frame is cropped on **x only**. Setting
`focus={[0.5, 0.34]}` does not lift the panel into shot. Use `drift` (a
translate on the whole box) when the subject sits above or below centre.

## Masked reveals clip descenders and neon

`overflow: hidden` is what makes a line rise crisply. It also slices the tail
of a `j` or `y`, and it clips the bloom on `NeonText`. Turn `mask` off for
anything with a glow; pad the mask (`paddingBottom: 0.26em`) for display
lines that stay masked.

## Crossfading two type cards

A fade between "Save the date" and "RSVP today" leaves both headlines legible
on top of each other for half a second. Slide those cuts (`from-bottom` or
`from-right`). Fade is for photograph-to-graphic.

## Hairlines under eyebrows

A 2px gradient line drawn between an uppercase eyebrow and a display line
reads as an underline of the eyebrow, especially in landscape where the stack
is tight. Prefer gap, or put the line under the display line.

## Partner logos are often black SVG with no fill

`lesmills_logo.svg` is paths, no `fill`. On navy it vanishes until
`filter: brightness(0) invert(1)`. Check the file before assuming it is white.

## WebP stills in this environment

Some tools cannot decode WebP. Convert a poster to PNG with ffmpeg before
sampling colours or inspecting a frame. Remotion itself reads WebP fine.

## Half-scale preview before full render

A full 1080×1920 H.264 pass is several minutes per size. Render `--scale=0.5`
and a contact sheet of every size **before** `.\render.ps1`. The faults above
all showed up on the sheet.

## PowerShell eats `$i:v` and `$args`

ffmpeg filter labels like `[0:v]` must be written `"${i}:v"` inside a
PowerShell string. `$args` is reserved. The starter `preview.ps1` already
avoids both.

## Do not add cookies, headers or a DB read to `app/layout.tsx`

Unrelated to the video, but do not "helpfully" wire the MP4 into the Next.js
app as a server-rendered page that reads the filesystem at request time.
Hand over the four files. Putting them on the event page is a separate change
and a separate review.
