# `lib/data/json/events-custom.json` — schema for one event entry

The file has the shape `{ "template": {...}, "events": [ ... ] }`. Only the
`events` array is touched by this skill; `template` is a placeholder the
pipeline uses elsewhere.

Each entry in `events` looks like:

```json
{
  "id": 91,
  "slug": "making-linkedin-work-for-you-with-stuart-little",
  "title": "Making LinkedIn Work for You with Stuart Little, presented by She Sharp and AUT",
  "date": "May 15, 2026",
  "coverImage": {
    "url": "/img/events/making-linkedin-work-for-you-with-stuart-little/cover.jpg",
    "alt": "Making LinkedIn Work for You with Stuart Little event cover"
  },
  "detailPageUrl": "https://shesharp.org.nz/events/making-linkedin-work-for-you-with-stuart-little",
  "shortDescription": "A masterclass to help you build a strong personal brand on LinkedIn and attract the right opportunities.",
  "attendees": null,
  "checkedIn": 0,
  "detailPageData": {
    "url": "https://shesharp.org.nz/events/making-linkedin-work-for-you-with-stuart-little",
    "title": "…",
    "subtitle": "LinkedIn Masterclass Workshop",
    "date": "May 15, 2026",
    "time": "5:00pm - 7:30pm NZST",
    "location": {
      "format": "in_person",
      "venueName": "AUT, Building WZ416",
      "address": "55 Wellesley Street East, Auckland 1010",
      "city": "Auckland",
      "country": "New Zealand"
    },
    "fullDescription": [
      "paragraph 1 …",
      "paragraph 2 …"
    ],
    "speakers": {
      "keynote_speakers": {
        "heading": "Meet Our Speaker",
        "speakers": [
          {
            "name": "Stuart Little",
            "title": "Creative Lead, THRIVE & Director of Agency8",
            "company": "THRIVE / Agency8",
            "bio": "…",
            "image": "/img/events/making-linkedin-work-for-you-with-stuart-little/stuart-little.jpg",
            "linkedin": "https://www.linkedin.com/in/stuart-little"
          }
        ]
      }
    },
    "organizers": [],
    "sponsors": {
      "main": [
        { "name": "AUT (Engineering, Computer and Mathematical Sciences)", "logo": "/img/sponsors/aut.svg" }
      ],
      "other": []
    },
    "specialSections": [
      { "type": "agenda",     "title": "What You'll Learn", "content": [ "bullet 1", "bullet 2" ] },
      { "type": "why-attend", "title": "Why Attend",        "content": [ "paragraph …" ] }
    ],
    "photos": [],
    "galleryUrl": "",
    "registrationUrl": "https://events.humanitix.com/making-linkedin-work-for-you-with-stuart-little-presented-by-she-sharp-and-aut",
    "images": [],
    "category": "workshop",
    "status": "upcoming",
    "isFeatured": false
  }
}
```

## Field guidance

| Field | Source hint |
|---|---|
| `id` | Integer, monotonically increasing. Compute `max(existing ids) + 1` when creating. Never reuse. |
| `slug` | Stable key. User supplies it; matches the Slack channel name most of the time (`event-<keyword>-<day>-<month>-<year>`). Keep identical to `events-custom.json` if one already exists. |
| `title` | From the event poster or a pinned message. Prefer the wording the host actually uses with sponsors. |
| `date` | Human-readable (`May 15, 2026`). Derive from Slack (venue/date confirmation message). |
| `coverImage.url` | `/img/events/<slug>/cover.<ext>` — always. The slug is the folder and is never repeated in the filename. |
| `coverImage.alt` | Short descriptive sentence for screen readers. |
| `detailPageUrl` | `https://shesharp.org.nz/events/<slug>`. Mirror the slug. |
| `shortDescription` | 1–2 sentences, < 200 chars. Used in event listings. |
| `attendees` | `null` before the event; integer after. Do not guess. |
| `checkedIn` | `0` before event. |
| `detailPageData.subtitle` | Short caption — at most ~40 characters, one phrase (e.g., "LinkedIn Masterclass Workshop", "Career Panel Discussion"). Do **not** derive from body-description paragraphs; the phrase often has to be invented for the UI. In UPDATE mode, preserve the existing subtitle unless it's obviously stale (wrong event or speaker). |
| `detailPageData.time` | Format: `"5:00pm - 7:30pm NZST"`. |
| `detailPageData.location.format` | One of `"in_person"`, `"online"`, `"hybrid"`. |
| `detailPageData.location.{venueName,address,city,country}` | Full physical address when `in_person`. |
| `detailPageData.fullDescription` | Array of paragraphs. Prefer the speaker-authored / pinned copy over casual chat. Strip any internal access/promo codes or private invite links (see "No internal codes" below). |
| `speakers.keynote_speakers.speakers[]` | One object per speaker. `title` = role, `company` = org, `image` = `/img/events/<slug>/<kebab-name>.<ext>`. |
| `organizers` | Left `[]` for every existing event — do not add She Sharp here. |
| `sponsors.main[]` | Partner orgs with own logo file under `/img/sponsors/`. If the logo doesn't exist, use an empty string for `logo` and flag it in the summary. |
| `specialSections` | Always include both `agenda` (= "What You'll Learn") and `why-attend` if the source content has them. Never build a "Registration" section that lists access/promo codes — keep concessions generic and point to the official channel. |
| `registrationUrl` | Public registration base URL only. Strip `?accesscode=...` (internal distribution) and never substitute a private invite/checkout link. See "No internal codes" below. |
| `status` | `"upcoming"` before the event, **`"completed"`** after. The four legal values live in `types/event.ts` — `upcoming \| ongoing \| completed \| cancelled` — and **`"past"` is not one of them**, which is what this row said until 4 Sep 2026. **Nothing renders this field**: `isPastEvent()` (`lib/data/event-utils.ts`) decides "this event has ended" from the *date*, so an event goes past by itself at midnight and flipping `status` changes no pixel. Keep it accurate anyway — it is the record, and the triage's `stale-status` row reads it — but never report the flip as the thing that updated the page. |
| `detailPageData.photos[]` | **Curated by hand after the event, not harvested from the channel.** Each entry is `{ url, alt }`, ordered so the page reads as the day in sequence. `photos[0]` is the featured hero above the grid AND the album-card cover on `/resources/photo-gallery`, so it is the one frame whose position matters most. A shoot large enough to be worth curating is triaged outside this skill — see UPDATE rule 6. |
| `detailPageData.photoCredit` | Optional. One line under the gallery grid, e.g. `"Photography by VISIONWORKS"` — a studio, never per-photo and never a She Sharp volunteer’s name. Set it when a paid photographer shot the event; omit it otherwise. |
| `isFeatured` | `false` by default. Set `true` only if the user explicitly asks. |
| `category` | Use the closest of `"workshop"`, `"panel"`, `"networking"`, `"fireside-chat"`, `"hackathon"`, `"conference"`. |

## No internal codes or private links (public-data rule)

This file is public. Whatever you write ships to the live site and to public
git history. Slack channels routinely contain material meant only for
controlled distribution; it must **never** land in `events-custom.json`:

- **Access / promo / discount / registration codes** — e.g. a student
  free-entry code, a flat-rate discount code, or any "free/discounted entry
  with code X" wording, and `?accesscode=…` query params on registration
  URLs. (Don't quote the real code values here either — describe them.)
- **Private invite-only registration or checkout links** — use the public
  registration base URL instead.

These can hide in any text field: `fullDescription`, `specialSections`
(especially a "Registration" block), `shortDescription`, `coverImage.alt`,
sponsor descriptions. Surface that concessions exist generically and route
people to the event's official channel for the code — never publish the code.
List anything you redact on the dry-run plan's `Redactions` line. When unsure
whether a token/link is internal, leave it out and ask. A leaked code can't be
undone by a later edit — it stays in public history and must be scrubbed and
rotated.

## Authoritative-content rules (most to least trusted)

1. **Pinned messages** — a team member deliberately marked this as canonical.
2. **Attached `.docx` bios / overviews** — usually speaker-authored, and the final handoff for the event page.
3. **Latest thread reply on a topic** — replies accumulate corrections; the most recent version of a given artifact (poster, copy, URL) wins over older versions of the same artifact.
4. **Message by the speaker themselves** — copy quoted from their DM / profile trumps the team's paraphrasing.
5. **Top-level messages by channel creator or sponsor lead** — final confirmations ("we have a venue", "we have a speaker").

When multiple versions conflict, the order above resolves ties.

## Matching existing entries (idempotency)

If an entry with the given `slug` already exists:
- Keep the existing `id`.
- Do not regenerate images that already exist at the target path *unless* the Slack source contains a strictly newer file (check file size + newer `ts`).
- Diff field-by-field; only overwrite fields where the Slack content differs meaningfully (whitespace-only changes can be skipped).

## CREATE vs UPDATE asymmetry

CREATE mode takes Slack as the only input — nothing pre-existing to
defer to. UPDATE mode has two authoritative sources, and they govern
different aspects:

- **Slack** is authoritative for **semantic content**: what was said,
  new facts, corrections, added agenda items, updated dates/venues.
- **Existing JSON** is authoritative for **editorial polish**:
  typography (em-dash vs hyphen), curly vs straight quotes, spacing,
  minor articles ("the" before a program name), and the short-caption
  subtitle an editor chose for the UI.

Rules, applied in order:

1. Identical semantics, different typography → keep existing JSON value.
2. Semantically different → prefer Slack; surface the change in the
   dry-run plan so the user can veto.
3. `id` never changes on UPDATE — preserve.
4. `attendees` and `checkedIn` are set by operations outside this
   skill (post-event reconciliation) — never overwrite on re-sync.
5. `subtitle` is usually editor-curated; keep existing unless empty
   or clearly referring to the wrong event.
6. `photos[]` and `photoCredit` are curated outside this skill and are
   **never** rebuilt from the channel. (Populating an **empty** `photos[]` for
   the first time is the post-event gallery pass, not a rebuild — that is
   `references/image-conventions.md`. This rule guards a set that already
   exists.) A post-event planning channel is full
   of photographs, which makes this the easiest field on the record to
   destroy by accident: the hackathon's set is 24 frames chosen from 377,
   ordered as a narrative, each one perceptual-hashed against the others so
   the same moment is not published twice. Re-harvesting would replace that
   with whatever happened to be posted. Append a genuinely new photograph if
   the channel has one the page lacks; otherwise leave the array alone.

The point of re-syncing is to let genuinely new information flow
into the site. It is not to re-render already-polished copy.
