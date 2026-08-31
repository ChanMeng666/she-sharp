# Two shapes of video

Same engine, different story. Decide the kind in Step 0 and do not mix them:
a recap that still asks people to RSVP, or a promo that opens on last week's
crowd without saying so, both fail.

## Promo — before the night

The job is to make someone who did not go last time want to come this time.
The Les Mills 2026 cut is the worked example
(`../she-sharp-promo-video` next to this repo, slug
`event-lesmills-03-september-2026`, prior edition `own-the-unexpected`).

A shape that has already shipped:

1. **The room** — a prior-edition photograph, "Remember this room?"
2. **The scale** — registration count, shown as a count-up, worded "registered"
3. **The people** — last year's speakers as a face strip, not named
4. **The turn** — "On 3 September, we're back."
5. **The title** — neon lock-up matching the poster, logos, kicker. This is
   the drop. Put it on a bar line.
6. **The argument** — one sentence from the event blurb, plus discipline chips
   if the panel is cross-functional
7. **This year's panel** — real headshots, names, roles
8. **When and where** — date, time, venue, street address. Worded as the
   event record has them.
9. **RSVP** — `shesharp.org.nz/events` (or the Humanitix URL if they insist
   on a direct ticket link). Charity line: `Registered NZ Charity CC57025`.

If there is **no prior edition**, do not invent "remember this room". Open on
the poster, a speaker, or the argument. A first-time partnership has no
nostalgia to spend.

Keep the longest authored line under ~17 characters at display size. Headlines
are passed to `RevealLines` as an array, `whiteSpace: "nowrap"`. A sentence
that wraps itself at 1080 and not at 1920 looks like a bug.

## Recap — after the night

The job is to show what happened, thank the people who came, and point at
whatever is next — the album, the next event, the newsletter. It is not a
second promo with the date swapped.

A shape that fits a regular evening:

1. **The room that night** — a wide shot from `photo-*.webp` or the album
2. **Who came** — `checkedIn` if scanning happened; otherwise registrations,
   labelled as registrations
3. **What was said** — one or two short quotes from the speakers, or an
   anonymised line from event feedback. Never a named respondent
   (`CONTENT_RULES.md`)
4. **The panel, as they were** — headshots are fine; prefer a stage photograph
   if one exists
5. **A taste** — two or three more photographs, `wideOnly` vs `fullBleed`
   classified the same way as a promo
6. **Thanks** — partner, speakers, the room
7. **Next** — the next upcoming event from `getUpcomingEvents()`, or
   `shesharp.org.nz/events`, or the newsletter. Not "RSVP today" for a night
   that has ended.

A recap is blocked until photographs exist in the repo. An empty `photos[]`
and no `photo-*.webp` means the close-out has not happened; hand back to
`/run-event-playbook` T+1w rather than scraping Google Photos.

Flagship events (hackathon, festival) are a different film: many more faces,
a two-day run sheet, possibly no single "panel". Say so and design a shorter
highlight (45–60s) rather than forcing nine promo scenes onto it.

## Copy sources

Every fact on screen is copied from the event record, so the video cannot
disagree with the website:

- Upcoming / custom: `lib/data/json/events-custom.json`
- Scraped history: `lib/data/json/shesharp_events_v3.json`
- Title, date, time, venue, address, subtitle/kicker, speakers, sponsor logo,
  registration URL, `attendees`, `checkedIn`

Do not retype a date from the person's message. If the record and the person
disagree, the record wins and you say so.
