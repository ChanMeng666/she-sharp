# Photographs of children

## Why this exists

On 2026-08-22, curating 377 professional photographs from the Aotearoa AI
Hackathon Festival, three frames were set aside because a child was the
identifiable subject. That was a judgement call, and there was nothing to point
at when making it: no rule in this repository, nothing in
`app/privacy-policy/page.tsx` beyond listing "Photo" as a category of data
collected, and nothing in `app/code-of-conduct/page.tsx` about photography at
all. A different person doing the same job the following week would have had
nothing to go on either.

The gap is not hypothetical, and it is not only forward-looking. **The site
already publishes photographs of children.** Ten of them, across two 2026
primary-school workshops:

| Event | Venue | Photos describing young people |
|---|---|---|
| `peyvand-academy-13-june-2026` | Fruitvale Primary School | 5 of 7 |
| `peyvand-academy-20-june-2026` | Fruitvale Primary School | 5 of 7 |

Superhero Daughter Day and Girls' Night Out are two more youth-facing events in
the archive. So this is a rule being written after the fact, over material
already live — which is why the last section exists.

## The rule

**Default: do not publish a photograph in which a child is the identifiable
subject.**

The test is two things at once, and both have to be true for a frame to fail:

1. **The frame is about that child** — they are the subject, not part of a
   scene. A wide shot of a hundred people that happens to include a nine-year-old
   is a photograph of an event. A three-quarter portrait of that same
   nine-year-old is a photograph of a child.
2. **Their face is readable.** Turned away, in profile at distance, or too small
   to identify is not the same as looking down the lens.

Applied to the hackathon set: the whole-festival panoramas were published with
children visible in them, and three closer frames were not. That is the line.

**Never name a child.** Not in body copy, not in a caption, not in `alt` text,
not in a photo credit. This extends the existing rule in
[`CONTENT_RULES.md`](CONTENT_RULES.md) against quoting a real respondent by
name, and it has no exception — not even when a name badge is legible in the
frame or a parent has offered.

**Alt text must describe the activity, not the individual.** "Young
participants working together on an electronics activity" is right. Anything
that would let a stranger pick that child out of a room is not.

**The Google Photos album is not a lesser standard.** `CONTENT_RULES.md` is
right that the album is the home of event photography rather than the repo, but
a public album is public. A frame that should not be on the site should not be
in the album either.

### Youth events are the deliberate exception

The Youth Tech Series, Superhero Daughter Day and Girls' Night Out exist to put
children in front of STEM. Publishing nothing from them would misrepresent a
real part of what She Sharp does, and would make the organisation's work with
schools invisible in exactly the places funders look.

So for an event whose participants are children, the default above is replaced
by a procedure, not by an exemption:

- **The host institution's permission governs.** A school, an academy or a
  holiday programme already has its own media-consent arrangement with families,
  and it — not She Sharp — knows which children are covered. Get that permission
  in writing, from the organiser, before the shoot, and record who gave it.
- **Prefer activity over faces.** Hands on a breadboard, a room mid-experiment,
  a facilitator mid-explanation with the class in soft focus. These carry the
  story better than portraits anyway.
- **A group photograph of a class is fine where the school's permission covers
  it**; a portrait of one child is not, whatever the permission says, because
  the child is then the published subject rather than a participant in a scene.
- **No individual close-ups on the marketing surfaces.** Even a permitted frame
  does not go into `public/img/curated/`, which is reused across `/community`,
  `/contact`, `/mentorship` and the home page. Those surfaces are decoration; a
  child's face is not decoration, and a photograph reused there travels far
  beyond the event it belongs to.

## Where the rule binds

Everywhere an image becomes public, which is more places than it looks:

| Surface | Path |
|---|---|
| Event page gallery | `detailPageData.photos[]` in `lib/data/json/events-custom.json` |
| Harvested gallery | `public/img/events/<slug>/archive/` via `scripts/build-event-archive.mts` |
| Site-wide decoration | `public/img/curated/` via `scripts/curated-picks.json` |
| Projected decks | `public/img/wall/` via `scripts/deck/wall-tile-sources.json` |
| Posters and social | `scripts/events/build-event-poster.ts` output |
| Newsletter and campaign email | `emails/`, the `/monthly-newsletter` and `/email-the-community` skills |
| The public album | `detailPageData.galleryUrl` |

The screening happens **at selection**, before anything is encoded, because
`/img/*` is served with a one-year immutable cache: a published frame cannot be
quietly replaced, only superseded by a new filename, and the album copy is
outside this repository entirely. Of every rejection reason applied to a photo
set, this is the only one that cannot be undone afterwards.

## What is already published

The ten Fruitvale Primary School photographs went up before any of the above
existed. Nothing here removes them, and a contributor should not remove them
unilaterally either — they are a school's workshop, published in good faith,
and the school may well have had consent in place all along.

What should happen, and is a decision for She Sharp rather than for whoever
next reads this file:

1. Confirm with Peyvand Academy / Fruitvale Primary School whether their media
   consent covered publication on `shesharp.org.nz`.
2. If it did, record that fact here so the question is not reopened annually.
3. If it did not, re-select those two galleries against the procedure above.
   The frames showing activity rather than faces would survive; the group shots
   would need the school's word.

## What this document is not

It is not legal advice, and it does not attempt to state what the Privacy Act
2020 requires of a registered charity photographing children. It is the
operating default a contributor can apply without having to ask, plus a record
of what has not been decided.

**One of the two things left open here has since been decided and shipped; the
other has not.**

### Published 2026-08-23

The wording is live, not a draft, and it went out as three surfaces:

| Surface | Where |
|---|---|
| A photography notice on **every event detail page**, upcoming and past | `components/events/event-detail/event-photography-notice.tsx` |
| "Photographs at Our Events" | `app/privacy-policy/page.tsx` |
| "Photography" | `app/code-of-conduct/page.tsx` |

All three route removal requests to `PRIVACY_EMAIL` in
`lib/config/contact-addresses.ts`, which is **`info@shesharp.org.nz`**.

It was `privacy@shesharp.org.nz` when this notice shipped, and that address did
not exist. A delivery probe on 2026-08-23 established that it had never been
created: a parent asking for a photograph of their child to be taken down would
have received a bounce, from a page telling them the route was there. The
inconsistency this section used to describe — the privacy page's older sections
saying `info@` while the newer ones said `privacy@` — turns out to have been
the older sections being right. Both now resolve through the constant.

The event-page notice **is a notice and a removal route, not a consent
mechanism**, and it says so in its own source. It tells an attendee three
things they previously had no way to learn: that they may be photographed, that
they can decline on the day without giving a reason, and that a published frame
can be taken down.

**What the removal promise now obligates.** This is the part with a cost:

1. Someone has to actually monitor the address. This was written when
   `EMAIL_ADDRESSES.md` still said that which mailboxes are monitored "is an
   organisational question" and left it there; the August 2026 audit answered
   the question and this route was the worst thing it found. `info@` is opened
   about once or twice a week, which is a real answer rather than a good one —
   see `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md`.
2. Removal is **not a click**. `/img/*` is served `max-age=31536000, immutable`,
   so a frame cannot be swapped at its own URL: the entry comes out of
   `detailPageData.photos[]` (or `curated-picks.json`, or
   `wall-tile-sources.json`), the file is deleted, and `verify-image-paths.ts`
   is re-run — the reverse check will fail the build if a reference is left
   behind, which is the safety net working as intended.
3. The **public Google Photos album is outside this repository** and has to be
   edited separately. A frame removed from the site but left in the album has
   not been removed.
4. If the frame reached a newsletter or a projected deck, those are separate
   copies too.

### Still open: consent at registration

There is still no photography question anywhere in the sign-up flow. Attendees
register through **Humanitix**, a third-party platform this codebase does not
control, so it cannot be added from here. Until it is, the notice on the event
page and the line in the code of conduct are doing the work that an opt-in
checkbox would do better — they inform, and they put the burden on the attendee
to speak up rather than on the organisation to ask.

That remains She Sharp's to close, in Humanitix.

## Related

- [`CONTENT_RULES.md`](CONTENT_RULES.md) — the rest of the naming, counting and
  editorial rules, including that event photos live in a Google Photos album
- [`public/img/events/README.md`](../../public/img/events/README.md) — the asset
  layout, and why one event carries 24 photographs
- `.claude/skills/sync-event-from-slack/references/image-conventions.md` — how a
  photograph gets from a channel into the repo
