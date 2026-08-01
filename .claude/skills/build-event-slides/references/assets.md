# Images, logos and QR codes

Everything a deck displays is a file already committed to the repository. There
is no upload step, no image host, and no network call at the venue — which is
the point. Once the deck has loaded, the wifi can die and nothing changes on
screen.

---

## Where things go

| What | Where |
|---|---|
| Photos for this event | `public/img/decks/<event-slug>/` |
| Speaker headshots, event posters | `public/img/events/` — usually already there |
| Sponsor and partner logos | `public/img/sponsors/` — usually already there |
| Past-event photography (the fallback) | `public/img/curated/` |
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
- **Check the form is open to the public before the event.** If opening the
  form URL in a signed-out browser lands on a Google sign-in page, the form is
  set to collect verified email addresses or is restricted to a Workspace
  domain, and attendees who are not signed in — or signed in with the wrong
  account — will hit a wall at the exact moment they scan. That is a setting in
  the form, not something the deck can fix.

## The curated fallback

`public/img/curated/` holds 48 real photographs from past She Sharp events —
crowds, panels, workshops, celebrations — each in three widths (768, 1280, 1920)
with **alt text already written**. `public/img/curated/index.ts` lists them all
with a role (`hero`, `divider`, `card`, `support`) and their dimensions, and
exports `toSrcSet()` for the responsive attribute.

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
