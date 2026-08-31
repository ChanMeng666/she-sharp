# Photographs in the video

Two rules from the main repo travel with every frame. They are why a zoom that
looks cinematic can be unpublished, and why a number that looks like a crowd
size is not.

Read `docs/development/PHOTOGRAPHING_MINORS.md` and the counting section of
`docs/development/CONTENT_RULES.md` before choosing pictures or writing a
stat scene.

## Children

**Do not publish a frame in which a child is the identifiable subject** — the
frame is about them and their face is readable. A child inside a wide group
shot is not that.

A Ken Burns crop on a group photo can turn the allowed case into the forbidden
one: the original is a room, the zoom is a portrait. Classify every source
photograph **before** it goes on the timeline:

| Class | Test | Treatment |
|---|---|---|
| `fullBleed` | Adults only, or children so small/turned that they are not identifiable even after a 1.2× push-in | `KenBurns` is safe |
| `wideOnly` | A child is readable in the published frame, but the frame is a group shot | `PhotoCard` only — shown whole, never cropped |
| unusable | A child is the subject | Do not copy it into the Remotion `public/` folder |

Never name a child in on-screen type, not even when a name badge is legible.

Youth events (Youth Tech Series, Superhero Daughter Day, school workshops) run
under the host's media consent and prefer activity over faces. If the only
pictures are of children, stop and say so — this skill will not invent a
workaround.

## Where the pictures actually are

Do not scrape the live site. The files are already in the repo.

**This event**

- `public/img/events/<slug>/` — poster, cover, speaker headshots. One folder
  per slug; nothing sits loose at `events/`.
- `photo-<n>.webp` beside that folder, never inside `archive/`. `archive/` is
  wiped by `scripts/build-event-archive.mts` on every rebuild.

**A previous edition of the same partnership** (the usual promo hook)

- `lib/data/json/shesharp_events_v3.json` for scraped history — `photos[]`,
  `images[]`, speaker `image` paths. Do not hand-edit that file.
- `lib/data/json/events-custom.json` for anything since the rebuild.
- Paths look like `/img/legacy-site/photos/…`, `/img/legacy-site/galleries/…`,
  `/img/legacy-site/speakers/…`.

Look at every candidate. `ffprobe` dimensions are not a substitute: a 1200×800
file can still have a child in the front row.

## Counting

`attendees` holds **registrations**. `checkedIn` holds attendance. The field
name is misleading; the convention is not. The live event page has labelled
registrations as "attended" before. A video that repeats that is wrong even
when it matches the page.

- Past event, registrations known: "109 people registered".
- Past event, `checkedIn` present and `checkInDataPresent` is true: you may
  say they were in the room, using `checkedIn`, never `attendees`.
- A `checkedIn` of 0 usually means nobody scanned. Do not put it on screen.
- This event, still upcoming: the live Humanitix count goes stale. Prefer "Join
  us" over a registration number unless you have just checked.

## Headshots

Speaker photos come from the event record, the same files `/make-event-poster`
uses. Do not generate a face. Do not fall back to `users.image`. If a headshot
is missing, omit that person and say so — same rule as the speaker-poster skill.
