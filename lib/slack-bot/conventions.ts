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
 */

export const IMAGE_CONVENTIONS = `
Image path conventions for She Sharp event assets:

1. Event images (cover, speakers, event-specific sponsor logos):
   /img/events/<event-slug>-<descriptive-slug>.<ext>

   Where:
   - <event-slug> is the event's "slug" field (lowercase kebab-case)
   - <descriptive-slug> describes the asset: "cover" for the main banner,
     "<speaker-name>" for speaker photos, "<sponsor-slug>-logo" for
     event-specific sponsor logos.
   - <ext> must match the actual file format (jpg, png, svg, webp, gif).
     NEVER rename a .png to .svg without format conversion.

2. Cover image: /img/events/<event-slug>-cover.<ext>

3. Speaker photo: /img/events/<event-slug>-<speaker-slug>.<ext>
   - Per-event copy. If the same person speaks at multiple events, the
     image is DUPLICATED per event (not shared). This keeps the naming
     rule strictly one-slug-per-file.

4. Slug format: lowercase kebab-case, ASCII only.
   Examples: "iwd-2026", "her-waka-april-2026",
             "she-sharp-candice-murray-own-your-energy"
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
   "/img/events/<event-slug>-<sponsor-slug>-logo.svg" and ADD it to
   imageChecklist with description "Sponsor logo for <sponsor-name>
   (consider promoting to /img/sponsors/<sponsor-slug>.svg if reusable)".

3. NEVER place a sponsor logo in /img/events/ when a canonical exists in
   /img/sponsors/. The canonical version should always be preferred.
`.trim();

export const EVENT_ALIASES = `
Some long event slugs have a shorter accepted alias used in filenames:
- "she-sharp-and-academyex-international-womens-day-2026" → alias "iwd-2026"

When generating image paths for an event with an alias, you MAY use the
alias prefix in filenames. Treat both the full slug and the alias as
valid for the same event.
`.trim();

/**
 * Compose the full system prompt section about conventions.
 */
export function conventionsBlock(): string {
  return [IMAGE_CONVENTIONS, "", SPONSOR_LOOKUP_RULES, "", EVENT_ALIASES].join("\n");
}
