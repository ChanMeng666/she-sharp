# Platform requirements, and where these numbers came from

Verified 10 August 2026. Platforms change these; the last section says how to
re-check without guessing.

## The set

| Format | Pixels | Ratio | Files | Platform |
|---|---|---|---|---|
| `humanitix` | 3200×1600 | 2:1 | **JPEG only** | Humanitix event banner |
| `social` | 1080×1350 | 4:5 | JPEG + WebP | LinkedIn, Instagram, Facebook feeds; website cover |
| `story` | 1080×1920 | 9:16 | JPEG + WebP | Instagram & Facebook stories |
| `square` | 1080×1080 | 1:1 | JPEG + WebP | Instagram grid |
| `poster` | 1400×1980 | ~1:1.41 | WebP | Event page, print |

The per-speaker set reuses three of these ratios — 4:5, 9:16 and 1:1 — at the
same pixel sizes, so nothing below changes for it. Two things do:

- **JPEG only.** No website surface renders a speaker poster, so the WebP that
  `social`, `story` and `square` carry for the site would be a file with no
  destination.
- **No safe band on the 4:5.** `SOCIAL_SAFE` exists only because the event
  `social` file doubles as the website's `coverImage`. A speaker poster never
  does, which is what buys it a large portrait — and is why one must never be
  pointed at `coverImage.url`.

See `speaker-posters.md`.

## File format is an upload constraint

Two platforms will not reliably take the format the web prefers, and both
failures land on the person publishing rather than the person designing.

**Humanitix rejects WebP** — see below.

**Instagram accepts WebP but handles it inconsistently on mobile**, which is
where posts are actually made; JPEG is the format that always works. So every
Instagram-bound size writes a JPEG, and keeps a WebP alongside for the website.

This was missed in the first version of these formats, which emitted WebP for all
three Instagram sizes. It would not have failed any check — the files were valid
and the right dimensions — it would simply have handed someone a file their phone
might refuse.

## Humanitix — the one with a hard rule

Their help centre states the banner should be **"a minimum of 3200px by 1600px
and in a 2:1 ratio"**, that images outside that ratio **will be cropped**, that
files must be **under 10 MB**, and that accepted formats are **"JPEG, PNG, or
SVG. GIF files are accepted as still images only."**

**WebP is not on that list.** This is the single most expensive thing to forget:
a WebP renders perfectly everywhere else in this pipeline and simply cannot be
uploaded to the ticketing page, which is discovered by the person trying to
publish the event, usually not by the person who made the file. `FORMATS` pins
this one to JPEG for that reason and nothing else.

Authoring at exactly 3200×1600 rather than larger means Humanitix never crops.

## LinkedIn, Instagram, Facebook — why one file does all three

All three now favour **4:5 portrait at 1080×1350**:

- It is the tallest image a mobile feed will show without cropping, so it occupies
  the most screen for the longest time. Roughly 60% of LinkedIn traffic is mobile.
- Instagram's feed standard is 1080×1350; square is legacy and takes less space.
- Facebook's feed vertical is the same ratio.

LinkedIn also accepts 1200×627 landscape, but that shape exists for link-preview
cards, not for artwork someone should stop and read.

Convenient consequence: **1080×1350 is also the website's `coverImage` slot**, so
one file is the feed post and the site cover. That is why `social` carries the
extra crop-band constraint the others do not — see the safe-band note in
`poster-formats.ts`.

## Stories — someone else's interface is on top of your artwork

1080×1920, and roughly the **top and bottom 250px belong to the platform**: the
account row above, the reply bar and any link sticker below.

Type placed there is not cropped, it is **covered** — which is worse, because the
file looks correct, the preview looks correct, and the problem only exists once
it is live and nobody is looking. `storyLayout` asserts every text box sits
inside 250–1670 and fails the build otherwise.

## Re-checking these

Platforms move these numbers, usually without announcement. Signs it is time to
re-check: a platform visibly cropping a post, a rejected upload, or simply a year
having passed.

- **Humanitix** publishes theirs in the help centre article "Add or edit an event
  banner image". It is the authoritative source and worth fetching directly.
- **The social platforms** rarely publish a definitive page; a current
  social-media image size guide (Hootsuite, Buffer and Sprout all maintain one)
  is the practical source. Prefer one carrying the current year.
- Cross-check at least two before changing a number here, and update the
  verified date at the top of this file when you do.

Do not guess. A wrong number produces artwork that is quietly cropped on the one
platform nobody checked.

Sources:
- [Add or edit an event banner image — Humanitix Help Centre](https://help.humanitix.com/en/articles/8892493-add-or-edit-an-event-banner-image)
- [Social media image sizes for all networks — Hootsuite](https://blog.hootsuite.com/social-media-image-sizes-guide/)
