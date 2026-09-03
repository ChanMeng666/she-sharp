/**
 * Scaffolds a new event deck from an event already in the repo.
 *
 * Usage:
 *   npx tsx scripts/deck/new-deck.ts <event-slug>
 *   npx tsx scripts/deck/new-deck.ts <event-slug> --template minimal
 *   npx tsx scripts/deck/new-deck.ts <event-slug> --force
 *
 * Writes `lib/deck/decks/<slug>.ts` and registers it. The default `evening`
 * template fills the middle from the event's own data — run sheet, speakers,
 * hosts, the length of the break — so what comes out is a deck that can be
 * projected, not a file of TODOs. The organiser's job becomes deleting the
 * blocks their event does not have and saying what the host should say, which
 * is work only a person can do.
 *
 * Facts are written as **live expressions**, never as copied values:
 * `items: RUN_SHEET_ROWS`, not a pasted array of times. Correct a speaker's
 * job title in `events-custom.json` and the website and the projector change
 * together. That is the whole point — the event data is the single source of
 * truth and everything else is a view of it.
 *
 * Refuses to overwrite an existing deck unless `--force` is passed: a deck
 * carries hand-written copy, and losing an afternoon of it to a re-run is not
 * a recoverable mistake.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  deckMetaFrom,
  deckSubtitleFrom,
  deckTitleFrom,
  loadEventForDeck,
} from "@/lib/deck/event-source";
import { getAllDecks } from "@/lib/deck/registry";
import { ARCHIVE_WEAVES } from "@/lib/deck/skins";
import { unusedWeaves } from "@/lib/deck/style-library";
import {
  type EveningPlan,
  planEveningEvent,
} from "@/lib/deck/templates/evening-event";
import type { Deck } from "@/lib/deck/types";
import type { EventV3 } from "@/types/event";

import { syncRegistry } from "./sync-registry";

const DECKS_DIR = join(process.cwd(), "lib", "deck", "decks");

/** Turns a slug into the camelCase export name the registry imports. */
function exportName(slug: string): string {
  const camel = slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
  return `${camel}Deck`;
}

/** Renders a value as a TypeScript source literal. */
function literal(value: unknown): string {
  return JSON.stringify(value);
}

/** The default accent, used when there is no existing deck to take one from. */
const DEFAULT_THEME_BLOCK = `  // TODO: take the accent from the event poster —
  // \`npx tsx scripts/deck/accent-from-poster.ts <slug>\` ranks its colours.
  // \`onDark\` must be lighter than \`onLight\`: the brand purple scores 2.92:1
  // on the dark canvas and cannot be read there.
  theme: {
    accent: {
      onLight: "#9b2e83",
      onDark: "#c846ab",
      spark: "#5ee7f5",
    },
  },`;

/**
 * Lifts the `theme` block, and any comment explaining it, out of a deck that
 * already exists.
 *
 * Regenerating used to reset the accent to the house purple, silently undoing
 * the one decision on a deck that someone looked at a poster to make. It is a
 * quiet loss too: the deck still builds, still lints, still passes contrast —
 * it is just the wrong colour, and nobody re-checks a colour they already
 * chose. Everything else in a regenerated deck is rebuilt from the event data
 * on purpose; the accent is the exception because nothing in the data holds it.
 *
 * Counts braces rather than matching a pattern — the block nests, and a regex
 * that gets the nesting wrong would carry half a theme across.
 */
export function extractThemeBlock(source: string): string | undefined {
  const anchor = source.search(/^[ \t]*theme:\s*\{/m);
  if (anchor === -1) return undefined;

  /* Walk back over any comment lines sitting directly above it. */
  let start = anchor;
  const before = source.slice(0, anchor).split("\n");
  before.pop();
  while (before.length > 0) {
    const line = before[before.length - 1].trim();
    const isComment =
      line.startsWith("//") ||
      line.startsWith("*") ||
      line.startsWith("/*") ||
      line.endsWith("*/");
    if (!isComment) break;
    before.pop();
    start = before.join("\n").length + 1;
  }

  let depth = 0;
  let seen = false;
  for (let i = anchor; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
      seen = true;
    } else if (source[i] === "}") {
      depth -= 1;
      if (seen && depth === 0) {
        const end = source[i + 1] === "," ? i + 2 : i + 1;
        return source.slice(start, end);
      }
    }
  }

  return undefined;
}

/** Wraps `text` as an indented block comment above a slide fragment. */
function comment(text: string, indent = "    "): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > 72) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());

  return [
    `${indent}/*`,
    ...lines.map((entry) => `${indent} * ${entry}`),
    `${indent} */`,
  ].join("\n");
}

/**
 * The `archive:` line, filled in with a weave nothing else is using.
 *
 * A REAL VALUE, NEVER A `// TODO`. The whole reason `Deck.archive` is required
 * is that "leave it and get the default" is the shape that produced two
 * identical-looking decks; writing `archive: "TODO"` here would recreate it one
 * level up, and a comment is invisible to `placeholder-copy` (which scans
 * on-screen strings, not source). So the scaffold makes the choice, says which
 * ones were free, and leaves the author to disagree.
 */
function weaveBlock(taken: readonly Deck[]): string {
  const free = unusedWeaves(taken, ARCHIVE_WEAVES);

  /*
   * When every weave is taken there is nothing free to pick, and picking
   * nothing is not an option — `Deck.archive` is required and a missing line
   * would not compile. So it falls back to the first weave and says, in the
   * scaffold itself, what the author now has to do by hand. A silent repeat is
   * the one outcome ruled out: it is the exact shape that produced the twins.
   */
  const chosen = free[0] ?? ARCHIVE_WEAVES[0];
  const note = free.length
    ? `Still unused: ${free.join(", ")}.`
    : `EVERY WEAVE IS IN USE — this one repeats ${
        taken.find((deck) => deck.archive === chosen)?.slug ?? "another deck"
      }, which \`deck.test.ts\` accepts only if this deck's accent hue differs ` +
      `from that deck's. Against another deck wearing the same skin it will ` +
      `fail whatever the accent does, because a same-skin pair must differ on ` +
      `the weave AND the hue — see \`lintDeckSet()\`. Either give this event a ` +
      `skin of its own or add a fourth weave (\`references/weaves.md\` has the ` +
      `three steps).`;

  return [
    `  // How She Sharp's own slides arrange the archive. Picked because nothing`,
    `  // else was using it — ${note}`,
    `  // See \`.claude/skills/build-event-slides/references/weaves.md\`; change it`,
    `  // if this event says otherwise, and say why here.`,
    `  archive: ${literal(chosen)},`,
  ].join("\n");
}

/**
 * The skin a scaffolded deck wears, and why it is written in rather than left
 * out.
 *
 * `skin` is optional on `Deck`, so omitting it compiles — and what it compiles
 * to is the house wall in the house type, which is what every deck looked like
 * before August 2026 and is the reason `style-library.ts` exists. A regular
 * two-hour evening has no visual concept of its own and should not be made to
 * invent one, so the scaffold answers the question instead of asking it: the
 * organisation's own editorial system, the same one the website has used since
 * July 2026.
 *
 * It is a default, not a decision, and the comment says so where the author will
 * read it — in the file, next to the line, rather than in a reference they would
 * have to know to open.
 */
const EDITORIAL_SKIN_BLOCK = [
  `  // The house look for a regular She Sharp evening: the website's editorial`,
  `  // system on the projector — paper and navy ink, hairline rules, a line of`,
  `  // script where a slide introduces itself, chapter numerals drawn as`,
  `  // outlines. The two knobs this event turns are the weave and the accent`,
  `  // above; everything else is the same voice at every event, on purpose.`,
  `  //`,
  `  // Replace it with a bespoke \`DeckSkin\` only when this event's poster gives`,
  `  // you a concept you can say in one sentence — see`,
  `  // \`.claude/skills/build-event-slides/references/skins.md\`. A deck in a`,
  `  // half-built bespoke skin is worse than one in this.`,
  `  skin: EDITORIAL_SKIN,`,
].join("\n");

function template(
  event: EventV3,
  plan: EveningPlan,
  themeBlock: string = DEFAULT_THEME_BLOCK,
  weave: string = `  archive: "drift",`,
): string {
  const slug = event.slug;
  const title = deckTitleFrom(event);
  const subtitle = deckSubtitleFrom(event);
  const meta = deckMetaFrom(event);
  const shortened = title !== event.title.trim();

  const slides = plan.slides
    .map((planned) =>
      planned.why
        ? `${comment(planned.why)}\n${planned.source}`
        : planned.source,
    )
    .join(",\n\n");

  /*
   * The fragments declare what they need; the deck body around them needs the
   * title, meta and (when there is one) the subtitle regardless.
   */
  const imports = [
    ...new Set([
      ...plan.sourceImports,
      "deckMetaFrom",
      "deckTitleFrom",
      ...(subtitle ? ["deckSubtitleFrom"] : []),
    ]),
  ]
    .sort()
    .join(",\n  ");

  return `/**
 * Deck: ${event.title}
 *
 * Scaffolded by \`scripts/deck/new-deck.ts\` from the event's own entry in
 * \`lib/data/json/events-custom.json\`.
 *
 * **Every fact on these slides is read from the event data at build time.** The
 * speakers, the run-sheet times, the partner logos, the title and the venue are
 * expressions, not copies — so the way to correct any of them is to edit the
 * event in \`events-custom.json\`, where the public event page reads them from
 * too. Editing a name into this file instead is how the website and the
 * projector come to disagree.
 *
 * What belongs in this file, and nowhere else: the accent colour, the chosen
 * photographs, the kicker on each slide, and the host note that says what to
 * say. Regenerate when the event gains or loses a whole block — a new speaker
 * group, a run sheet where there was none. Editing a fact needs no regeneration.
 *
 * Next:
 *   1. Delete the blocks tonight does not have. Everything here is optional
 *      except the closing photograph — see the comment on it.
 *   2. Replace every PLACEHOLDER note with what the host will actually say.
 *   3. Take the accent from the event poster.
 *   4. \`npx tsx scripts/deck/lint-deck.ts ${slug}\`
 *
 * Long-form material — biographies, terms, full venue lists — belongs on the
 * event page, which the closing QR reaches in one scan. Keep it off the wall.
 */

import {
  buildClosingSlides,
  buildOpeningSlides,
  type KarakiaText,
} from "../boilerplate";
import {
  ${imports},
} from "../event-source";
import { parseDateString } from "@/lib/data/event-utils";

import { DEFAULT_CLOSING_KARAKIA, DEFAULT_OPENING_KARAKIA } from "../karakia";
import { EDITORIAL_SKIN } from "../skins";
import type { Deck, DeckImage, QrBlock } from "../types";
import { archiveFrame } from "../wall-tiles";

const EVENT_SLUG = ${literal(slug)};

const event = loadEventForDeck(EVENT_SLUG);

/* She Sharp's standing karakia. Read them back to whoever is opening the
   evening — a venue with its own mihi replaces these two lines. */
const OPENING_KARAKIA: KarakiaText = DEFAULT_OPENING_KARAKIA;
const CLOSING_KARAKIA: KarakiaText = DEFAULT_CLOSING_KARAKIA;

${plan.preamble.join("\n")}

/* Codes are drawn from these URLs in the browser, so a link change here is the
   only edit a code ever needs. The feedback and ambassador codes are not here:
   the ambassador form is the same at every event and the feedback code is
   derived from EVENT_SLUG, so buildClosingSlides() supplies both. */

const WEBSITE_QR: QrBlock = {
  url: "https://www.shesharp.org.nz",
  label: "She Sharp website",
  caption: "shesharp.org.nz",
};

const EVENTS_QR: QrBlock = {
  url: "https://www.shesharp.org.nz/events",
  label: "Upcoming events",
  caption: "shesharp.org.nz/events",
};

export const ${exportName(slug)}: Deck = {
  slug: EVENT_SLUG,
  title: deckTitleFrom(event),${shortened ? `\n  // Shortened from: ${event.title}` : ""}${
    subtitle ? `\n  subtitle: deckSubtitleFrom(event),` : ""
  }
  eventSlug: EVENT_SLUG,
${weave}
${themeBlock}
${EDITORIAL_SKIN_BLOCK}
  slides: [
    ...buildOpeningSlides({
      eventTitle: deckTitleFrom(event),
      eventMeta: deckMetaFrom(event),
      partnerLogos: PARTNERS,
      karakia: OPENING_KARAKIA,
      // "Our Impact" counts events held through THIS event, inclusive, instead
      // of events held before the build. Without this the slide leaves out the
      // evening it is being presented at, and changes every time the site is
      // redeployed. Do not replace it with a number.
      eventsHeldThrough: parseDateString(event.date),
      // TODO: venue-specific safety lines — where the assembly point is, which
      // stairwell, who the warden is. The organisational defaults are already
      // there; these are added to them.
      safetyExtras: [],
      contactQrs: [WEBSITE_QR, EVENTS_QR],
    }),

${slides},

    ...buildClosingSlides({
      thanksLogos: [{ label: "Hosts and partners", logos: PARTNERS }],
      // TODO: volunteers, facilitators and helpers to thank by name.
      thanksNames: [],
      // TODO: snapshot from getUpcomingEvents() at authoring time — never call
      // it at render time. It is relative to today, and would change the
      // projector content under the host.
      upcoming: [],
      // The feedback code is derived from the slug — nothing to paste.
      eventSlug: EVENT_SLUG,
      karakia: CLOSING_KARAKIA,
    }),
  ],
};
`;
}

function reportNotes(plan: EveningPlan): void {
  if (plan.notes.length === 0) return;

  console.log("");
  console.log("Read these back to the organiser before you show them anything:");
  console.log("");

  const labels: Record<string, string> = {
    shortened: "SHORTENED",
    dropped: "NOT SHOWN",
    missing: "NOTHING TO SHOW",
    confirm: "NEEDS AN ANSWER",
  };

  for (const note of plan.notes) {
    console.log(`  ${(labels[note.kind] ?? note.kind).padEnd(16)} ${note.message}`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const minimal = args.includes("--template")
    ? args[args.indexOf("--template") + 1] === "minimal"
    : false;
  const slug = args.find(
    (arg, index) => !arg.startsWith("--") && args[index - 1] !== "--template",
  );

  if (!slug) {
    console.error(
      "Usage: npx tsx scripts/deck/new-deck.ts <event-slug> [--template evening|minimal] [--force]",
    );
    process.exit(1);
  }

  let event: EventV3;
  try {
    event = loadEventForDeck(slug);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  const target = join(DECKS_DIR, `${slug}.ts`);
  if (existsSync(target) && !force) {
    console.error(`lib/deck/decks/${slug}.ts already exists.`);
    console.error(
      "Pass --force to overwrite it, but read it first — deck copy is hand-written.",
    );
    process.exit(1);
  }

  /*
   * The accent survives a regeneration. Everything else is rebuilt from the
   * event data on purpose, but nothing in the data holds a colour, so an
   * overwrite would silently put the house purple back over a decision
   * somebody made by looking at a poster.
   */
  const existingSource = existsSync(target)
    ? readFileSync(target, "utf8")
    : undefined;
  const existingTheme = existingSource
    ? extractThemeBlock(existingSource)
    : undefined;

  /*
   * The weave survives a regeneration for the same reason the accent does: it
   * is a decision made by looking at the event, and nothing in the event data
   * holds it. Resetting it would also, on a second deck, silently reintroduce
   * the collision the field exists to prevent.
   */
  const existingWeave = existingSource
    ? /^[ \t]*archive:\s*"[a-z-]+",?$/m.exec(existingSource)?.[0]
    : undefined;

  /*
   * A BESPOKE skin cannot be carried across by lifting one line.
   *
   * `skin: SOME_SKIN` is usually a reference to module-level declarations — the
   * `DeckSkin`, its plates, and their imports — and carrying the field without
   * them produces a file that does not compile, or worse, one that compiles
   * against something stale. Rather than guess at which declarations belong to
   * it, refuse: an author who has written a skin is told to move it by hand,
   * which is a loud failure instead of a silent loss. `extractThemeBlock`'s own
   * docstring makes the same argument about the accent.
   *
   * `skin: EDITORIAL_SKIN` is the one case that does not have that problem, and
   * it is now the common case: the scaffold writes it, it is backed by an
   * import from `lib/deck/skins.ts` rather than by anything declared in the deck
   * file, and the regenerated file emits the same import and the same line. So
   * it survives verbatim, and refusing on it would have made `--force` useless
   * on every deck this script has ever produced — which is the opposite of the
   * guard's purpose. The test is the WHOLE line, not the presence of the
   * identifier: a deck that spreads the default into something of its own
   * (`{ ...EDITORIAL_SKIN, tempo: 0.8 }`) is bespoke and is refused like any
   * other.
   */
  const declaredSkin = existingSource
    ? /^[ \t]*skin:.*$/m.exec(existingSource)?.[0]
    : undefined;
  if (declaredSkin && declaredSkin.trim() !== "skin: EDITORIAL_SKIN,") {
    console.error(
      `lib/deck/decks/${slug}.ts declares a skin of its own, and --force cannot carry it across.`,
    );
    console.error(
      "A bespoke skin is a reference to declarations further up the file, so",
    );
    console.error(
      "lifting the one line would leave it pointing at nothing. Copy the skin, its",
    );
    console.error("images and their imports out by hand first, then re-run.");
    console.error(
      "(The scaffolded `skin: EDITORIAL_SKIN,` is carried across automatically —",
    );
    console.error("it is an import, not a local declaration.)");
    process.exit(1);
  }

  const decks = getAllDecks().filter((deck) => deck.slug !== slug);

  const plan = planEveningEvent({
    event,
    omit: minimal
      ? (["host", "explore", "tables", "readouts"] as const)
      : undefined,
  });

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    template(event, plan, existingTheme, existingWeave ?? weaveBlock(decks)),
    "utf8",
  );

  const { slugs } = syncRegistry();

  if (existingTheme) {
    console.log("Kept the accent colour from the deck that was already there.");
  }
  if (existingWeave) {
    console.log("Kept the archive weave from the deck that was already there.");
  }

  /* The occupancy table, printed where the decision is being made rather than
     in a document somebody has to remember to open. */
  const free = unusedWeaves(decks, ARCHIVE_WEAVES);
  console.log("");
  console.log("Archive weaves in use:");
  for (const deck of decks) {
    console.log(`  ${deck.archive.padEnd(15)} ${deck.slug}`);
  }
  console.log(
    free.length ? `  still unused:   ${free.join(", ")}` : "  none are free.",
  );

  console.log(
    `Wrote lib/deck/decks/${slug}.ts — ${plan.slides.length} event slides ` +
      `between the opening and closing sequences.`,
  );
  console.log(`Registered lib/deck/registry.ts (${slugs.length} deck(s)).`);
  reportNotes(plan);
  console.log("");
  console.log(`Next: npx tsx scripts/deck/lint-deck.ts ${slug}`);
}

/* Only when run as a command — `deck.test.ts` imports `extractThemeBlock`, and
   importing this file must not scaffold a deck as a side effect. */
if (process.argv[1]?.includes("new-deck")) main();
