# Add Events (Non-Technical Guide)

This guide shows how to add a new event so it appears on `/events` and the event
detail page. It is written for non-technical users and uses a simple copy/paste
workflow.

## Where to add events

All custom events live in:

`lib/data/json/events-custom.json`

Only events inside the `events` array are shown on the website. The `template`
section is just a reference and does not display on the site.

## Quick steps

1. Open `lib/data/json/events-custom.json`.
2. Copy the object from the `template` section.
3. Paste it into the `events` array (as a new entry).
4. Replace the example values with your new event details.
5. Save the file.

## Example

Below is a minimal example you can paste into the `events` array. Replace every
value with your event info.

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

## Field-by-field checklist

Use this checklist to ensure completeness and avoid missing data.

### Required fields (must be filled)
- `id`: A unique number. Use a new number that is not used by any other event.
- `slug`: Lowercase, words separated by hyphens. Example: `women-in-ai-2026`.
- `title`: Event title shown on cards and the detail page.
- `date`: Use the format `Month Day, Year` (example: `March 5, 2026`).
- `coverImage.url`: Poster or hero image. Use a valid public URL or `/img/...`
  if the image exists in the `public/img` folder.
- `detailPageUrl` and `detailPageData.url`: The event page URL.
- `shortDescription`: One sentence. Shown on the event card.
- `detailPageData.title`: Usually the same as `title`.
- `detailPageData.date`: Same as `date`.
- `detailPageData.time`: Example: `5:30pm - 7:00pm NZDT`.
- `detailPageData.location`: Use real location details.
- `detailPageData.fullDescription`: At least 1 paragraph (array of strings).
- `detailPageData.status`: Use `upcoming` or `completed`.

### Optional fields (recommended when you have the info)
- `detailPageData.subtitle`: Short supporting line under the title.
- `detailPageData.registrationUrl`: Ticket or registration link.
- `detailPageData.galleryUrl`: Post-event photo gallery.
- `detailPageData.images`: Extra images for the event detail page.
- `detailPageData.sponsors`: Add sponsor logos if available.
- `detailPageData.speakers`: Add speaker profiles if available.

## Tips to avoid common mistakes

- **Date format** must be `Month Day, Year` or the event sorting may break.
- **Slug** must be unique. Do not reuse existing slugs.
- **Cover image** must be reachable. If using `/img/...`, confirm the image
  exists in `public/img`.
- **Location format** values: `in_person`, `online`, or `hybrid`.
- **Time** should include timezone (e.g., `NZDT`, `NZST`) when possible.

## How to add an image

If you have a local poster image, place it in:

`public/img/`

Then reference it like this:

`/img/my-new-event.jpg`

## Need help?

If you are unsure about any field, ask a developer to confirm before publishing.
