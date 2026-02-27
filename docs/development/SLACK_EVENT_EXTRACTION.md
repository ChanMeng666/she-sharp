# Slack Event Extraction: Claude Code Tutorial

This document is a step-by-step guide for **Claude Code** to automatically extract event data from a Slack channel and update the She Sharp website.

---

## Overview

The local Python script `scripts/collect-event-from-slack.py` reads all messages from a specified Slack channel, sends them to OpenAI for structured extraction, and saves the results to a timestamped folder under `~/Downloads`. Claude Code then reads those results and updates the website.

### Workflow

```
User runs the Python script with a Slack channel ID
  → Script fetches all messages + thread replies from Slack
  → Script calls OpenAI to extract structured event data
  → Script downloads all images (speaker photos, banners, logos)
  → Script saves everything to ~/Downloads/slack-event-<channel-name>/
      ├── event.json              (EventV3 JSON, ready to merge)
      ├── images/                 (all downloaded files, already renamed)
      ├── download-manifest.json  (download success/failure log)
      ├── full-result.json        (raw OpenAI output with image metadata)
      └── README.md               (summary and file mapping)

User tells Claude Code: "Update the website from <output-folder>"
  → Claude Code reads event.json
  → Claude Code merges into events-custom.json
  → Claude Code copies images to public/img/events/
  → Claude Code runs pnpm build to verify
```

---

## Prerequisites

Before running the script, the user must have:

1. **Python 3.10+** installed locally
2. **Dependencies** installed: `pip install -r scripts/requirements-slack.txt`
3. **Environment variables** in `.env` or `.env.local`:
   - `SLACK_BOT_TOKEN` — Slack Bot User OAuth Token (starts with `xoxb-`)
   - `OPENAI_API_KEY` — OpenAI API key
4. **Slack Bot** invited to the target channel (run `/invite @AppName` in the channel)

---

## Step 1: Run the Script

The user runs the script and provides the output folder path to Claude Code. The command is:

```bash
D:/Python/Python312/python.exe scripts/collect-event-from-slack.py --channel <CHANNEL_ID_OR_NAME>
```

The script accepts:
- Channel ID: e.g., `C0ADRAGNTTQ`
- Channel name: e.g., `iwd-2026` or `event-academyex-iwd2026-6march-2026`

Optional flags:
- `--model <model>`: Override the OpenAI model (default: `gpt-4.1-mini-2025-04-14`)
- `--output <path>`: Override the output directory (default: `~/Downloads/slack-event-<channel-name>`)

The script prints the output folder path at the end. Example:

```
Output folder: C:\Users\0\Downloads\slack-event-event-academyex-iwd2026-6march-2026
```

---

## Step 2: Claude Code Reads the Output

When the user says something like _"Update the website from C:\Users\0\Downloads\slack-event-xxx"_, Claude Code should:

### 2.1 Read the event JSON

```
Read <output-folder>/event.json
```

This file contains a single EventV3 object matching the schema in `types/event.ts`. Example structure:

```json
{
  "id": null,
  "slug": "she-sharp-and-academyex-international-womens-day-2026",
  "title": "She Sharp & academyEX: International Women's Day 2026",
  "date": "March 6, 2026",
  "coverImage": { "url": "", "alt": "..." },
  "detailPageUrl": "https://www.shesharp.org.nz/events/<slug>",
  "shortDescription": "...",
  "attendees": null,
  "detailPageData": { ... }
}
```

### 2.2 Read the download manifest

```
Read <output-folder>/download-manifest.json
```

This tells you which images downloaded successfully and which failed. Structure:

```json
{
  "downloaded": [
    { "filename": "xxx-speaker.jpg", "path": "...", "type": "speaker", "description": "..." },
    ...
  ],
  "failed": [
    { "filename": "xxx.jpg", "reason": "download failed", ... }
  ],
  "images_dir": "<output-folder>/images"
}
```

### 2.3 Read the full result (optional, for image metadata)

```
Read <output-folder>/full-result.json
```

Contains the raw OpenAI output with both `event` and `images` keys. The `images` array has metadata about each file's purpose (cover, speaker, sponsor, other).

---

## Step 3: Merge Event Data into events-custom.json

### Target file

```
lib/data/json/events-custom.json
```

### Merge rules

1. **Read the existing file** to find the current `events` array and the highest `id`.
2. **Assign a new `id`** to the extracted event: `highest_existing_id + 1`.
3. **Check for duplicates**: If an event with the same `slug` already exists, update it instead of adding a duplicate.
4. **Fix the `coverImage.url`**: The script leaves this empty. Set it to `/img/events/<slug>-banner.<ext>` or `/img/events/<slug>-poster.<ext>` based on the downloaded cover image filename.
5. **Prepend the new event** to the beginning of the `events` array (newest events first).
6. **Validate the JSON** before saving — ensure no trailing commas, proper nesting.

### Example merge

Given the extracted event has `"id": null` and the existing highest id is 85:

```json
{
  "template": { ... },
  "events": [
    {
      "id": 86,
      "slug": "new-event-slug",
      ...
    },
    {
      "id": 85,
      "slug": "she-sharp-and-academyex-international-womens-day-2026",
      ...
    }
  ]
}
```

---

## Step 4: Copy Images to the Project

### Target directory

```
public/img/events/
```

### Process

1. **List all files** in `<output-folder>/images/`.
2. **Copy each file** to `public/img/events/` preserving the filename from the script.
3. **Verify image paths** in the event JSON match the copied filenames:
   - Speaker images: referenced in `detailPageData.speakers.*.speakers[].image`
   - Sponsor logos: referenced in `detailPageData.sponsors.main[].logo` and `detailPageData.sponsors.other[].logo`
   - Cover image: referenced in `coverImage.url`
4. **Rename if needed**: If the JSON references `/img/events/foo.jpg` but the downloaded file is named `foo.png`, either rename the file or update the JSON path.
5. **Skip non-image files**: PDFs, documents, or other files marked as type `"other"` in the manifest may not need to be copied to the project. Check the download manifest to decide.

### Image path convention

All event images use this pattern:

```
/img/events/<slug>-<descriptive-name>.<ext>
```

Examples:
- `/img/events/iwd-2026-ana-ivanovic-tongue.jpg`
- `/img/events/iwd-2026-academyex-logo.svg`
- `/img/events/iwd-2026-banner.png`

---

## Step 5: Quality Review

Before committing, Claude Code should review the extracted data against the existing event entries in `events-custom.json` for quality and consistency:

### Data quality checks

1. **Compare with existing events**: Look at the style and depth of existing entries. The AI-extracted data may have shorter bios, missing titles, or different formatting. Adjust to match the quality of existing entries.
2. **Speaker bios**: If a bio says "Bio to be confirmed.", flag it to the user. Check if the Slack messages in `full-result.json` contain better bio text that the AI missed.
3. **Speaker titles and companies**: Verify these look professional and consistent with how other speakers are listed.
4. **Registration URL**: Ensure it's a valid Humanitix or event registration link, not a Slack internal URL.
5. **Location details**: Verify address looks complete (street, city, country).
6. **Date and time format**: Must match existing entries (e.g., "March 6, 2026" and "5:00pm - 7:30pm NZDT").
7. **Category**: Must be one of: `networking`, `workshop`, `conference`, `meetup`, `panel`, `webinar`, `training`, `social`, `thrive`.
8. **Status**: Should be `upcoming` for future events.

### Image quality checks

1. **File size**: Speaker photos should be reasonable (typically 20KB-500KB). If a file is suspiciously small (<5KB), it may be a broken download or placeholder.
2. **File format**: The `image` field extension should match the actual file. Don't reference a `.jpg` path for a `.png` file.
3. **Cover image**: Ensure a suitable banner/poster image is assigned to `coverImage.url`. If none was downloaded, leave it empty and tell the user.

---

## Step 6: Build Verification

After all changes, run:

```bash
pnpm build
```

This verifies:
- The JSON is valid and parseable
- Image paths referenced in the JSON exist in `public/img/events/`
- No TypeScript errors from the event data structure

---

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| `event.json` has `"id": null` | Assign the next available ID from `events-custom.json` |
| `coverImage.url` is empty `""` | Find the cover/banner/poster image in the downloaded files and set the path |
| Speaker image path doesn't match downloaded filename | Rename the file or update the JSON path to match |
| Bio says "Bio to be confirmed." | Ask the user if they have the bio, or check `full-result.json` for raw Slack messages |
| Some images failed to download | Check `download-manifest.json` `failed` array. Tell the user which files need manual download |
| Duplicate slug in events-custom.json | Update the existing event instead of adding a new one |
| Downloaded file is actually HTML (Slack auth page) | The Slack token may have expired. Ask the user to re-run the script |
| Image file is 0 bytes or very small | Download failed silently. Ask the user to download manually from Slack |

---

## Quick Reference: File Locations

| File | Purpose |
|------|---------|
| `scripts/collect-event-from-slack.py` | The extraction script (local only, gitignored) |
| `scripts/requirements-slack.txt` | Python dependencies (local only, gitignored) |
| `lib/data/json/events-custom.json` | Website event data (update target) |
| `public/img/events/` | Event images directory (copy target) |
| `types/event.ts` | EventV3 TypeScript type definitions |
| `docs/development/ADD_EVENTS.md` | Manual event addition guide |

---

## Example Session

User:
> I just ran the Slack extraction script. Output is at `C:\Users\0\Downloads\slack-event-new-event-channel`. Please update the website.

Claude Code should:

1. `Read C:\Users\0\Downloads\slack-event-new-event-channel\event.json`
2. `Read C:\Users\0\Downloads\slack-event-new-event-channel\download-manifest.json`
3. `Read lib/data/json/events-custom.json` — find highest ID, check for duplicate slugs
4. Assign new ID, fix `coverImage.url`, review data quality
5. Merge the event into `events-custom.json` (prepend to `events` array)
6. Copy images from the output `images/` folder to `public/img/events/`
7. Verify image paths in the JSON match the copied files
8. Run `pnpm build` to verify everything compiles
9. Report to the user: what was added, any issues found, any manual actions needed
