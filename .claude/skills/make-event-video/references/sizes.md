# The four sizes, and why none of them is a crop of another

A 9:16 story, a 4:5 feed post and a 16:9 YouTube file cannot be one composition.
Satisfying the story loses the headline in landscape; letterboxing a master
looks like a PowerPoint export. Scenes ask `useLayout()` for the frame's shape
and recompose — safe areas, grid columns and type scale all change.

These numbers match `/make-event-poster`'s social sizes so a campaign of stills
and a campaign of video occupy the same slots. Poster, Humanitix banner and
email cover are still images; they have no video equivalent.

Verified against the same sources as
`.claude/skills/make-event-poster/references/platform-sizes.md` (10 August 2026).

## The set

| Key | Composition id | Pixels | Ratio | Where it goes |
|---|---|---|---|---|
| `v` | `Promo-Vertical-9x16` | 1080×1920 | 9:16 | Reels, Stories, TikTok, Shorts, LinkedIn vertical |
| `p` | `Promo-Portrait-4x5` | 1080×1350 | 4:5 | Instagram + Facebook feed — tallest the feed shows without cropping |
| `s` | `Promo-Square-1x1` | 1080×1080 | 1:1 | LinkedIn + Instagram feed, and anywhere a square is safest |
| `l` | `Promo-Landscape-16x9` | 1920×1080 | 16:9 | YouTube, LinkedIn landscape, the website, playing in the room |

Always render all four unless the person names one platform. A "LinkedIn video"
is still two files: 4:5 for the feed and 16:9 for native landscape.

**H.264, `yuv420p`, `.mp4`.** That combination plays on phones, LinkedIn's
uploader and a projector. Do not hand over WebM or ProRes.

## Safe areas

**9:16 is the dangerous one.** Instagram, TikTok and Reels draw their own
controls over roughly the top 250px and the bottom 390px (account row above,
reply bar / caption / sticker below). Type placed there is not cropped — it is
**covered**, which is worse, because the file looks correct in Remotion Studio.
`useLayout()` already pads `vertical` at `{ top: 250, bottom: 390, side: 92 }`.
Do not shrink those numbers to fit more copy.

4:5, 1:1 and 16:9 have modest padding for breathing room, not for a platform UI.

## Type scale and grids

The short edge is 1080 in every size, so type barely changes. What does:

- **Landscape type steps UP** (`scale: 1.05`). It is read at arm's length or
  across a room and has ~1420px of usable width against the vertical's ~896.
- **Face grids are 4-up only in landscape.** A square 1080 split four ways
  leaves ~208px a cell, which wraps "Keryn McKenzie" onto two lines. 2×2
  everywhere else.

## Length

Aim for **25–35 seconds**. Longer than 45s and Stories/Reels drop off; shorter
than 20s and the panel and the date both get crushed. The Les Mills 2026 promo
landed at 28.5s once it was recut to the track's real tempo.

## Re-checking

Platforms move these numbers. Signs it is time: a story with type under the
caption bar, a LinkedIn upload that letterboxes a 9:16, or a year having passed.
Cross-check the still-image guide in `make-event-poster/references/platform-sizes.md`
before changing a number here.
