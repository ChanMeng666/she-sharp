# Working with site content and data

> Moved from CLAUDE.md 2026-08-13, verbatim. **Do not summarise or "tidy" the
> rules below.** Each one records a specific thing that went wrong; the detail
> *is* the rule. Read this before editing anything under `lib/data/`, before
> publishing a number, and before naming a person on the site.

Rules distilled from a 2026 review of twelve years of the organisation's own
records. Every one of them was broken at least once; several were broken
repeatedly. Background on *why* the historical data is patchy is in
`docs/development/SITE_DATA_HISTORY.md`, and which published figures have a
source behind them is in `docs/development/PUBLIC_CLAIMS_PROVENANCE.md`.

## Counting and naming traps

- **`attendees` holds REGISTRATIONS, `checkedIn` holds attendance.** Decided
  April 2026; registrations are the number the site displays. The field name is
  misleading, the convention is not.
- **Expos and trade shows have no headcount by design** — the organisation has
  never counted people at a booth. They live on `/community`
  (`lib/data/community-appearances.ts`), not in the event data. Do not "fix"
  their missing numbers.
- **Humanitix only holds events from 2020 onward.** Nothing earlier has
  exportable registration data.
- **A ticket-code list is not a sponsor list.** Several organisations had their
  own discount codes without sponsoring anything.
- **Google has not been a sponsor since 2025** — it stopped running the
  Educator Conference and had no funding available. It appears in the
  cumulative logo wall as history, which is correct.
- **The two Fonterra event lines are different events** — "Harness the Power of
  Data and AI" (Aug 2024) and "Business and Technology Transformation" (Sep
  2025). Same partner, one continuing relationship, two events.
- **`lib/data/stats.ts` mixes two different metrics**: `members.current` is
  community members, `impact.workshopAttendees` is cumulative reach. Never
  present them as the same thing. The mailing list is a third number again.
- **`event-feedback-notifications` in Slack is now a mix of test and real
  data, and the two are trivially separable.** Everything up to `Feedback #34`
  is sample data: every submitter is a computer-history figure — Ada Lovelace,
  Grace Hopper, Radia Perlman — on an `@example.com` address. **From
  `Feedback #35` (8 Aug 2026) it is real**: the first live responses came from
  the Aotearoa AI Hackathon Festival, scanned from the deck's QR slide. Split
  on the `@example.com` address, not on the date or the ID, and **never quote
  a real respondent by name on the site** — the form promises nothing of the
  kind. The database, not Slack, is the source for any aggregate.

## Things not to re-do or roll back

- **Metlifecare's speaker belongs on the site.** A request to remove him was
  overruled by the founder, who required Metlifecare as main sponsor on all
  material.
- **A declined judge is not a judge.** One 2025 hackathon candidate declined
  and must not be listed.
- **HCLTech Dunedin 2025**: the panel facilitator changed four days out, one
  speaker was never confirmed, and one confirmed she would not attend. Copy
  published before the change is out of date.
- **IWD 2025**: an announced speaker did not attend on the day. Three spoke,
  not four.
- **2024 Enviro Hackathon mentors**: the thank-you list was cut back
  deliberately, using unclaimed name badges to confirm who was actually there.
  The rule was "only name mentors you saw".

## Editorial rules

- **Event photos: Google Photos album links only.** Not Google Drive folders
  (they get cleaned out — one album's photos were deleted when the
  photographer freed up personal storage) and not Dropbox ("Dropbox is not
  ours, it is temporary"). One album per event, named
  `{Title of the Event} @ {Company} - {Month | Year}`.
- **Newsletter links must be the public `mailchi.mp/…` or
  `us3.campaign-archive.com/…` form**, never `us3.admin.mailchimp.com/…`,
  which only works for someone logged in. Never a link carrying a merge tag —
  one archive page ended up greeting every reader by one person's name.
- **She Sharp does not run a job board.** Recruitment placements are open to
  paying sponsors only; an outside request to circulate a role was refused as
  recently as 2025.
- **LinkedIn is for She Sharp's own brand only.** Other organisations' events
  go to Instagram or Facebook stories, not LinkedIn.
- **Share images carry no personal byline and should be square.**
- **Mentorship testimonials must be about She Sharp's own programme** — another
  organisation's testimonial was used once and had to be pulled.
- **`p22-mackinac-pro`, the old site's body font, is licensed for personal use
  only.** The current site does not use it. If anyone asks for type "exactly
  like the old site", the licence has to be bought first.
- **Distinguish arrival time from start time.** Publishing one `time` caused
  real confusion when 5pm was registration and 5:30 was the actual start.
- **Speakers are thanked with a gift, not a fee**, and travel is not covered.
- **Refunds**: Humanitix cannot refund after settlement. The practice is a free
  ticket to a future event instead.
- **Photographs of children have their own rule**, because there was none until
  2026-08-22 and ten are already published: no frame in which a child is the
  identifiable subject, never a child's name anywhere, and youth events run
  under the host school's consent. See
  [`PHOTOGRAPHING_MINORS.md`](PHOTOGRAPHING_MINORS.md).
- **Fiserv venue imagery and Fonterra demo material must not be published** —
  both were shared for internal reference only.
- **AUT branding**: the AUT logo must not be locked up beside the She Sharp
  logo; co-branded order is AUT → She Sharp → AI Forum; use the version
  without the word UNIVERSITY.
- **Contact routing**: `industry@` for sponsorship, `mentoring@` for the
  mentorship programme, `events@` for a specific event, `info@` for general.
  **Never publish an address that is not in `lib/config/contact-addresses.ts`**
  — seven that were not spent up to a year on the live site bouncing everything
  sent to them. See `docs/development/EMAIL_ADDRESSES.md`.
- **A Google Form with a file-upload question always forces a Google sign-in**
  and cannot be embedded. This has caught the organisation twice.
- **Website requests belong in `#website-team`, not DMs** — restated twice in
  2026 — and test feedback should arrive as one Markdown document.

## Brand guidelines

**Legal identity** (from the NZ Charities Register, verified 2026-08; held in
`lib/config/footer.ts` → `charityInfo`):
- Legal name **She Sharp** — two words. "She#" is the visual mark, not the name
- Registered charity **CC57025** since **4 June 2019**, status Registered
- NZBN 9429047458970
- **Not GST-registered**
- Founding year is **2014**; charity registration is 2019. Different things

**Colors** (defined in `styles/tokens/colors.css`):
- Purple Dark: #9b2e83 (primary brand color)
- Purple Mid/Light: Various shades for gradients
- Periwinkle: Accent color
- Navy, Mint: Supporting colors
- The only explicit statement of the brand pair is **purple & navy blue**;
  merchandise standardised on Pantone 248 C. A 2020 rule still holds: outside
  the logo, don't use much pink

**Key Statistics**:
- 3500+ Members
- 50+ Sponsors
- 95+ Events Since 2014 (derived — `getEventsHeldCount()` in `lib/data/events.ts` feeds `globalStats.events.total`)
- Not all of these have a source. See `docs/development/PUBLIC_CLAIMS_PROVENANCE.md`
  before quoting any of them in a funding application or sponsorship deck

**Core Commitments**:
1. **Connection**: Building professional networks
2. **Inspiration**: Showcasing STEM careers
3. **Empowerment**: Career development support

**Values** (from a July 2018 team workshop; rendered on `/about`):
community · inspiring · inclusion
