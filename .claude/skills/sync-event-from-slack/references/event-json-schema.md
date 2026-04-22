# `lib/data/json/events-custom.json` — schema for one event entry

The file has the shape `{ "template": {...}, "events": [ ... ] }`. Only the
`events` array is touched by this skill; `template` is a placeholder the
pipeline uses elsewhere.

Each entry in `events` looks like:

```json
{
  "id": 91,
  "slug": "event-aut-linkedin-15-may-2026",
  "title": "Making LinkedIn Work for You with Stuart Little, presented by She Sharp and AUT",
  "date": "May 15, 2026",
  "coverImage": {
    "url": "/img/events/event-aut-linkedin-15-may-2026-cover.png",
    "alt": "Making LinkedIn Work for You with Stuart Little event cover"
  },
  "detailPageUrl": "https://shesharp.org.nz/events/event-aut-linkedin-15-may-2026",
  "shortDescription": "A masterclass to help you build a strong personal brand on LinkedIn and attract the right opportunities.",
  "attendees": null,
  "checkedIn": 0,
  "detailPageData": {
    "url": "https://shesharp.org.nz/events/event-aut-linkedin-15-may-2026",
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
            "image": "/img/events/event-aut-linkedin-15-may-2026-stuart-little.jpg",
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
| `coverImage.url` | `/img/events/event-<slug>-cover.<ext>` — always. |
| `coverImage.alt` | Short descriptive sentence for screen readers. |
| `detailPageUrl` | `https://shesharp.org.nz/events/<slug>`. Mirror the slug. |
| `shortDescription` | 1–2 sentences, < 200 chars. Used in event listings. |
| `attendees` | `null` before the event; integer after. Do not guess. |
| `checkedIn` | `0` before event. |
| `detailPageData.subtitle` | Short tagline (e.g., "LinkedIn Masterclass Workshop"). |
| `detailPageData.time` | Format: `"5:00pm - 7:30pm NZST"`. |
| `detailPageData.location.format` | One of `"in_person"`, `"online"`, `"hybrid"`. |
| `detailPageData.location.{venueName,address,city,country}` | Full physical address when `in_person`. |
| `detailPageData.fullDescription` | Array of paragraphs. Prefer the speaker-authored / pinned copy over casual chat. |
| `speakers.keynote_speakers.speakers[]` | One object per speaker. `title` = role, `company` = org, `image` = `/img/events/event-<slug>-<kebab-name>.<ext>`. |
| `organizers` | Left `[]` for every existing event — do not add She Sharp here. |
| `sponsors.main[]` | Partner orgs with own logo file under `/img/sponsors/`. If the logo doesn't exist, use an empty string for `logo` and flag it in the summary. |
| `specialSections` | Always include both `agenda` (= "What You'll Learn") and `why-attend` if the source content has them. |
| `registrationUrl` | Humanitix base URL (no `?accesscode=...` — those are for internal distribution). |
| `status` | `"upcoming"` before the event, `"past"` after. |
| `isFeatured` | `false` by default. Set `true` only if the user explicitly asks. |
| `category` | Use the closest of `"workshop"`, `"panel"`, `"networking"`, `"fireside-chat"`, `"hackathon"`, `"conference"`. |

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
