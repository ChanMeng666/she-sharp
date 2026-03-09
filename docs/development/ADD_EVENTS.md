# Content Data Management Guide

This guide explains how to update content across the She Sharp website. The
project follows a **single source of truth** principle — each piece of data lives
in exactly one file, and all pages/components derive from it automatically.

## Data Architecture Overview

```
lib/data/json/
  ├── events-custom.json        → Custom/manual events (you edit this)
  ├── shesharp_events_v3.json   → Scraped events (auto-generated, do NOT edit)
  ├── humanitix_events.json     → Humanitix enrichment data (script-only)
  ├── shesharp_podcasts_with_local_images.json  → Podcast episodes
  └── shesharp_news_press_with_local_images.json → Press/news items

lib/data/
  ├── events.ts          → Merges scraped + custom events, exports helpers
  ├── gallery-albums.ts  → Derived from events (no separate data file)
  ├── stats.ts           → Organization statistics (single source of truth)
  ├── sponsors.ts        → Organization-level sponsor tiers
  ├── spotify-podcasts.ts → Podcast data adapter
  ├── news-press.ts      → News/press data adapter
  ├── mentors.ts         → Mentor profiles
  ├── team.ts            → Team member profiles
  └── ...
```

### Key Principle

When you add or update content, you only need to edit **one file**. The change
automatically propagates to all pages and components that use that data.

---

## 1. Adding or Updating Events

**File to edit:** `lib/data/json/events-custom.json`

This is the single entry point for manually curated events. Changes here
automatically affect:

- `/events` — event listing page
- `/events/[slug]` — event detail page
- `/resources/photo-gallery` — gallery page (if `galleryUrl` is set)
- Homepage — upcoming/recent events sections
- Homepage — scrolling sponsor banner (from event sponsors)

### Quick Steps

1. Open `lib/data/json/events-custom.json`.
2. Copy the `template` object at the top of the file.
3. Paste it as a new entry in the `events` array.
4. Replace the example values with your event details.
5. Save the file.

### Example

```json
{
  "id": 1001,
  "slug": "my-new-event",
  "title": "My New Event",
  "date": "March 5, 2026",
  "coverImage": {
    "url": "/img/my-new-event.jpg",
    "alt": "My New Event poster"
  },
  "detailPageUrl": "https://www.shesharp.org.nz/events/my-new-event",
  "shortDescription": "One sentence summary shown on the events list.",
  "attendees": null,
  "detailPageData": {
    "url": "https://www.shesharp.org.nz/events/my-new-event",
    "title": "My New Event",
    "subtitle": "Optional short subtitle",
    "date": "March 5, 2026",
    "time": "5:30pm - 7:00pm NZDT",
    "location": {
      "format": "in_person",
      "venueName": "Example Venue",
      "address": "123 Example Street",
      "city": "Auckland",
      "country": "New Zealand"
    },
    "fullDescription": [
      "Paragraph 1 of the full description.",
      "Paragraph 2 of the full description."
    ],
    "speakers": {},
    "organizers": [],
    "sponsors": {
      "main": [],
      "other": []
    },
    "specialSections": [],
    "photos": [],
    "galleryUrl": "",
    "registrationUrl": "",
    "images": [],
    "category": "",
    "status": "upcoming",
    "isFeatured": false
  }
}
```

### Field-by-Field Checklist

#### Required fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique number, not used by any other event | `1001` |
| `slug` | URL-safe identifier, lowercase with hyphens | `women-in-ai-2026` |
| `title` | Event title shown on cards and detail page | `Women in AI 2026` |
| `date` | Format: `Month Day, Year` | `March 5, 2026` |
| `coverImage.url` | Poster image path | `/img/my-event.jpg` |
| `shortDescription` | One sentence for event cards | |
| `detailPageData.time` | Include timezone | `5:30pm - 7:00pm NZDT` |
| `detailPageData.location` | Venue details | See example above |
| `detailPageData.fullDescription` | Array of paragraph strings | |
| `detailPageData.status` | `"upcoming"` or `"past"` | |

#### Optional fields (auto-propagating)

| Field | What it powers |
|-------|---------------|
| `detailPageData.galleryUrl` | Photo gallery page (`/resources/photo-gallery`) — album appears automatically |
| `detailPageData.registrationUrl` | Registration button on event detail page |
| `detailPageData.sponsors.main[]` | Event detail page + homepage scrolling sponsor banner |
| `detailPageData.speakers` | Speaker section on event detail page |
| `detailPageData.humanitixUrl` | Used to match/merge with scraped Humanitix data |

### Tips

- **Date format** must be `Month Day, Year` — sorting depends on this.
- **Slug** must be unique across all events.
- **Cover image**: place files in `public/img/` and reference as `/img/filename.jpg`.
- **Location format** values: `in_person`, `online`, or `hybrid`.
- **Gallery**: just set `galleryUrl` — the gallery page picks it up automatically. No need to edit any other file.

---

## 2. Updating Organization Statistics

**File to edit:** `lib/data/stats.ts`

This is the single source of truth for all organization-wide numbers. Changes
here automatically affect:

- Homepage impact section (member count, event count, partner count, career stories)
- Any future page that imports from `stats.ts`

### What to update

```typescript
// In lib/data/stats.ts
export const globalStats = {
  members: { current: 2200, ... },    // "2200+" on homepage
  sponsors: { current: 50, ... },     // "50+" on homepage
  events: { total: 84, ... },         // "84+" on homepage
  impact: { careerTransitions: 500 }, // "500+" on homepage
  ...
};
```

Update the numbers in `globalStats` — the homepage `homeImpactData` array
derives its display values from these numbers automatically.

---

## 3. Updating Organization-Level Sponsors

**File to edit:** `lib/data/sponsors.ts`

This file manages **organization-level sponsor tiers** (Silver, Bronze, etc.).
These are different from per-event sponsors (which live in the event JSON).

Changes here automatically affect:

- Homepage "Thanks to Our Sponsors" section (tiered display)
- Sponsorship pricing page (sponsor logo wall)

### Adding a new sponsor

Add a new entry to the `tieredSponsors` array:

```typescript
{
  name: "New Company",
  logo: "/logos/new-company-logo.svg",
  description: "Short tagline",
  url: "https://www.newcompany.com",
  tier: "silver",  // "platinum" | "gold" | "silver" | "bronze"
},
```

### Organization sponsors vs event sponsors

| Type | Where it lives | What it represents |
|------|---------------|-------------------|
| Organization sponsor | `lib/data/sponsors.ts` | Annual partnership tier (Silver/Bronze/etc.) |
| Event sponsor | `events-custom.json` → `detailPageData.sponsors` | Who sponsored a specific event |

A company may be both — e.g., HCLTech is a Silver-tier org sponsor AND sponsors
individual events. These are managed independently because they serve different
purposes.

---

## 4. Other Data Files

| Data | File to edit | Affects |
|------|-------------|---------|
| Podcast episodes | `lib/data/json/shesharp_podcasts_with_local_images.json` | `/resources/podcasts` page |
| News/press items | `lib/data/json/shesharp_news_press_with_local_images.json` | `/resources/in-the-press` page |
| Mentor profiles | `lib/data/mentors.ts` | Mentorship page mentor list |
| Team members | `lib/data/team.ts` | About page team section |
| Impact reports | `lib/data/impact-reports.ts` | Resources page |
| Newsletter config | `lib/data/newsletters.ts` | Footer newsletter links |

---

## Summary: Where to Edit for Common Tasks

| Task | Edit this file only |
|------|-------------------|
| Add a new event | `lib/data/json/events-custom.json` |
| Add a photo gallery to an event | Set `galleryUrl` in the event entry above |
| Add event sponsors | Set `sponsors` in the event entry above |
| Update org statistics (member count, etc.) | `lib/data/stats.ts` |
| Add/change organization sponsor tier | `lib/data/sponsors.ts` |
| Add a podcast episode | `lib/data/json/shesharp_podcasts_with_local_images.json` |
| Add a press/news item | `lib/data/json/shesharp_news_press_with_local_images.json` |

## Need Help?

If you are unsure about any field, ask a developer to confirm before publishing.
