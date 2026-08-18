/**
 * Image naming and sponsor-lookup conventions for the Slack Event Bot.
 *
 * This module is the single source of truth for the rules the AI must
 * follow when generating EventPatch proposals. It is loaded into the
 * OpenAI system prompt so the model enforces the conventions for every
 * new file reference.
 *
 * When the conventions change, edit this file and nothing else — the bot
 * will pick up the new rules on its next invocation.
 *
 * The prompt spells the folder rule out at length on purpose. The model has
 * seen years of the previous flat scheme (`/img/events/<slug>-cover.webp`) in
 * its training data and in this repo's history, so a one-line statement of the
 * new rule loses to that prior; the explicit "NEVER repeat the slug" line and
 * the wrong/right pair are what actually stop it emitting flat paths.
 */

export const IMAGE_CONVENTIONS = `
Image path conventions for She Sharp event assets:

1. ONE FOLDER PER EVENT. Every asset an event owns lives in that event's
   own folder:
   /img/events/<event-slug>/<role>.<ext>

   Where:
   - <event-slug> is the event's "slug" field, EXACTLY (lowercase kebab-case,
     no abbreviation, no shortening). There are NO aliases: a long slug such as
     "she-sharp-and-academyex-international-womens-day-2026" is used in full as
     the folder name.
   - <role> describes the asset and NEVER repeats the slug: "cover" for the main
     banner, "<speaker-name>" for speaker photos, "<sponsor-slug>-logo" for
     event-specific sponsor logos, "photo-<n>" for post-event gallery photos.
   - <ext> must match the actual file format (jpg, png, svg, webp, gif).
     NEVER rename a .png to .svg without format conversion.

   WRONG: /img/events/her-waka-june-2026-cover.webp
   WRONG: /img/events/her-waka-june-2026/her-waka-june-2026-cover.webp
   RIGHT: /img/events/her-waka-june-2026/cover.webp

   The folder is the rule because the slug is unambiguous as a directory and was
   not as a prefix ("her-waka" is a proper prefix of "her-waka-april-2026"), and
   because one flat directory grew by 3-50 files per event.

2. Cover image: /img/events/<event-slug>/cover.<ext>

3. Speaker photo: /img/events/<event-slug>/<speaker-slug>.<ext>
   - Per-event copy. If the same person speaks at multiple events, the
     image is DUPLICATED into each event's folder (not shared). There is no
     /img/events/shared/ folder and must not be one.

4. The only sub-folder is /img/events/<event-slug>/archive/, which belongs to
   scripts/build-event-archive.mts. NEVER propose a path inside it.

5. Slug format: lowercase kebab-case, ASCII only.
   Examples: "her-waka-june-2026", "aotearoa-ai-hackathon-festival-2026",
             "event-lesmills-03-september-2026"
`.trim();

export const SPONSOR_LOOKUP_RULES = `
Sponsor logo selection (apply in order):

1. Check the "sponsorInventory" list provided in the extraction context.
   Each entry is a <sponsor-slug> with an existing SVG at
   /img/sponsors/<sponsor-slug>.svg. If the sponsor name you need to
   reference matches an entry (case-insensitive, ignoring spaces/punctuation),
   set logo to "/img/sponsors/<sponsor-slug>.svg" and DO NOT add this file
   to imageChecklist — it already exists.

2. If the sponsor is NOT in the inventory, generate a placeholder path
   "/img/events/<event-slug>/<sponsor-slug>-logo.svg" and ADD it to
   imageChecklist with description "Sponsor logo for <sponsor-name>
   (consider promoting to /img/sponsors/<sponsor-slug>.svg if reusable)".

3. NEVER place a sponsor logo in /img/events/ when a canonical exists in
   /img/sponsors/. The canonical version should always be preferred.

4. /img/sponsors/ is a flat directory of reusable marks and is NOT affected by
   the per-event folder rule above — do not invent /img/sponsors/<event-slug>/.
`.trim();

/**
 * Compose the full system prompt section about conventions.
 *
 * There used to be a third block, EVENT_ALIASES, permitting a short filename
 * prefix ("iwd-2026") for events whose slug was too long to make a readable
 * filename. Per-event folders removed the problem it solved, so it was deleted
 * rather than updated: two accepted spellings for one event meant every
 * consumer had to know the mapping. Do not reintroduce it.
 */
export function conventionsBlock(): string {
  return [IMAGE_CONVENTIONS, "", SPONSOR_LOOKUP_RULES].join("\n");
}
