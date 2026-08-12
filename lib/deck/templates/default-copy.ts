/**
 * The words the evening-event template writes when nobody has written any yet.
 *
 * WHY THIS IS ITS OWN MODULE. Two callers need the same strings and they cannot
 * import each other: `evening-event.ts` emits them into a scaffolded deck, and
 * `lint.ts` counts how many of them survived. `evening-event.ts` already imports
 * `COPY_LIMITS` from `lint.ts`, so putting the list there would close the cycle.
 * It is also the only arrangement that cannot rot — the planner and the checker
 * read one list, so editing a template string cannot silently stop the rule
 * matching it.
 *
 * WHY THE RULE EXISTS AT ALL. On 12 August 2026 the Les Mills deck contained
 * every one of these strings, exactly once each, untouched. The hackathon deck —
 * written before the template existed — contained none of them and carried
 * sixty-one kickers of its own. Reading the two decks side by side, that
 * difference did as much work as the visual system did: one deck sounded like an
 * evening somebody had thought about and the other sounded like a form.
 *
 * They are not bad sentences. They are sentences written for a generic Tuesday,
 * which is the most a template can honestly do, and the failure was never the
 * template's — it was that nothing said "these are placeholders" out loud, and
 * `SKILL.md` actively described the middle slides as arriving with no kickers at
 * all.
 *
 * THE THRESHOLD IS NOT ZERO. A few of these are simply the right words: "Space
 * starts the clock" is a literal instruction about the keyboard, and "One voice
 * per table" is a facilitation rule that does not improve by being reworded. A
 * full evening deck emits roughly twenty-three of these strings, so allowing
 * four means at least eighty per cent of the template's voice has been replaced,
 * which is the honest bar for "a person wrote this".
 */

/** Eyebrows the template writes. The kicker slot, one per middle slide. */
export const TEMPLATE_EYEBROWS = {
  speakersFirst: "Please welcome them",
  speakersRest: "And with them",
  runSheet: "Up again at the break",
  hosts: "They opened the doors",
  list: "Ask about any of these",
  supportingPhoto: "Look around a moment",
  mainAct: "Phones down for this bit",
  tables: "Talk to someone new",
  tableClock: "Space starts the clock",
  tableRoom: "Everyone talks now",
  readouts: "One voice per table",
  finalePhoto: "Squeeze in, please",
  finaleOpen: "Doors open till the end",
} as const;

/** Titles the template writes. */
export const TEMPLATE_TITLES = {
  runSheet: "How Tonight Runs",
  hosts: "Tonight's Hosts",
  tables: "At Your Table",
  tableClock: "Over to You",
  readouts: "What Did You Find?",
  finalePhoto: "Everyone Together",
  finaleOpen: "Stay and Talk",
} as const;

/** Bullets the template writes when the event data cannot supply any. */
export const TEMPLATE_BULLETS = {
  tables: [
    "One person writes, everyone talks",
    "Start with what you already do",
    "Two minutes to report back",
  ],
  readouts: [
    "One thing you agreed on",
    "One thing you disagreed on",
    "One thing you will try",
  ],
} as const;

/**
 * Every default string, flattened and lowercased, for the linter to match
 * against. Exact match after trimming and case-folding — a rewritten line is a
 * rewritten line, and near-miss matching would fail decks for coincidence.
 */
export const TEMPLATE_DEFAULT_COPY: ReadonlySet<string> = new Set(
  [
    ...Object.values(TEMPLATE_EYEBROWS),
    ...Object.values(TEMPLATE_TITLES),
    ...TEMPLATE_BULLETS.tables,
    ...TEMPLATE_BULLETS.readouts,
  ].map((text) => text.trim().toLowerCase()),
);

/**
 * How many may survive before a deck is judged unwritten.
 *
 * See the module header for why this is 4 and not 0.
 */
export const TEMPLATE_DEFAULT_COPY_BUDGET = 4;
