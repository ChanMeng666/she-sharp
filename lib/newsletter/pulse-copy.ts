/**
 * House style for the "NZ Tech Pulse" section, as rules a machine can check.
 *
 * WHY THIS EXISTS
 * ---------------
 * `lib/deck/lint.ts` says it best, and the same sentence is the whole argument
 * here: the limits are enforced "because 'keep it short' as advice loses to a
 * source JSON with twenty-one prose sections in it." The Pulse prompt has said
 * since it was written that a bite's title must be "a short headline of your
 * own (it may re-angle the original)". It loses. Three runs against the same
 * month and the same sources produced two bites whose titles were the
 * publisher's own headline, character for character, quote marks included:
 *
 *   ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa
 *   Women 'remain underrepresented' in AI roles despite jobs boom
 *
 * That is the consistency problem in its most important form. When headlines
 * are copied the newsletter's voice becomes a collage of each publisher's
 * voice — one in Title Case, one carrying another outlet's quotation marks, one
 * written by whoever last edited it by hand. It is also a quality problem: a
 * trade-press headline is written to be indexed, not to tell a woman in
 * Auckland what changed for her.
 *
 * WHERE THE RULES COME FROM
 * -------------------------
 * They are DERIVED, not invented. `lib/data/json/newsletter-issues/2026-07.json`
 * holds the best Pulse the newsletter has had — three hand-written bites — and
 * `2026-06.json` is the user-approved showcase issue. Every limit below was
 * measured against those two files first and set so that they pass. A style
 * rule that fails the copy it was derived from is a rule that will be turned
 * off, not obeyed. Where the founder's brief and the approved copy disagreed,
 * the approved copy won and the disagreement is written down at the rule.
 *
 * WHAT THIS MODULE IS
 * -------------------
 * Same shape as `lib/deck/lint.ts`: an exported limits object, pure violation
 * functions, no I/O and no network. That is what lets one list of rules be read
 * by three consumers that must not drift apart —
 *
 *   1. the brief the agent writes to (`PULSE_HOUSE_STYLE_RULES`, published
 *                                 verbatim into the candidate file by
 *                                 `scripts/newsletter/pulse-candidates.ts`),
 *   2. the checker                (`applyPulseDraft` in `pulse.ts` refuses to
 *                                 write a section with any error), and
 *   3. `scripts/newsletter/lint-pulse.ts` (what an operator runs after
 *                                 curating an issue by hand).
 *
 * A rule stated only in a brief is advice again — which is exactly why the
 * writing could be handed to a different agent every month without loosening
 * anything: consumer 1 changed, consumers 2 and 3 did not.
 *
 * WHAT THIS MODULE IS NOT
 * -----------------------
 * It is NOT part of the anti-hallucination guard and must never be confused
 * with it. `assertNumbersVerbatim` and the URL guard in `pulse.ts` decide
 * whether an item is TRUE. These rules decide whether it sounds like us. Style
 * is subordinate to truth: if re-angling a headline would need a number the
 * source does not have, the original wording wins and the item stays.
 */

import type { IssueEditorial } from "./schema";

type Pulse = IssueEditorial["pulse"];
type PulseNewsItem = NonNullable<NonNullable<Pulse>["newsBites"]>[number];
type PulseHeroStat = NonNullable<NonNullable<Pulse>["heroStat"]>;

// --- Limits ------------------------------------------------------------------

export const PULSE_COPY_LIMITS = {
  /**
   * Words in a bite headline.
   *
   * The approved headlines run 5–12 words (July: 12, 10, 9). 12 is therefore
   * the longest thing a human has signed off, and the cap sits two words above
   * it rather than on it: a cap set exactly at the observed maximum fails the
   * next good headline for being one word longer than the last good one, and
   * the failure this rule is for is not a 13-word headline — it is the 18-word
   * restatement of an article's opening sentence.
   */
  titleWords: 14,

  /**
   * Words in a bite summary. Approved summaries run 31–42 words.
   *
   * Same reasoning as `titleWords`: three words of slack over the observed
   * maximum, so the rule bites on a paragraph rather than on a long sentence.
   */
  summaryWords: 45,

  /**
   * Sentences in a bite summary.
   *
   * **The brief asked for two, and two is what the prompt asks the model for.**
   * The linter permits three, because the strongest hand-written item the
   * newsletter has ever published uses three:
   *
   *   "Norton surveyed 1,000 New Zealand adults with children under 18. 44%
   *    weren't confident their child could tell AI-generated content from the
   *    real thing, and 37% doubted their child knew AI can be wrong. That gap
   *    is what schools outreach exists to close."
   *
   * The third sentence is the one that makes it a She Sharp item rather than a
   * survey summary. A checker that failed that paragraph would be teaching
   * operators to delete the best sentence in the section. So: the prompt asks
   * for two so the model does not ramble, the checker refuses four.
   */
  summarySentences: 3,

  /** Words in the hero stat's label (June 8, July 11, August 5). */
  heroLabelWords: 12,

  /** Words and sentences in the hero stat's context line (max seen: 22 / 2). */
  heroContextWords: 30,
  heroContextSentences: 2,

  /**
   * Similarity at which a headline stops being ours and starts being the
   * publisher's. Dice coefficient over stemmed significant words.
   *
   * Measured against the approved set, where the closest legitimate re-angle
   * is "Parents aren't sure their kids can spot a fake" against the source
   * "New Zealand parents worry kids can't spot AI fakes" — 0.63. The two real
   * copied headlines score 1.00 against their own sources. The threshold sits
   * in the middle of a gap that wide, nearer the failure than the pass, because
   * everything above it is a headline nobody wrote.
   */
  titleCopyDice: 0.85,

  /**
   * The other way a headline is copied: every significant word of ours already
   * appears in the source's headline, so we deleted words and added nothing.
   * "Women Underrepresented in AI Roles" is exactly this — containment 1.00
   * against "Women remain underrepresented in AI roles despite jobs boom".
   *
   * `titleCopyMinWords` keeps it off short headlines, where full containment is
   * a coincidence rather than a lift. The approved set's closest case is 0.67.
   */
  titleCopyContainment: 1,
  titleCopyMinWords: 4,

  /**
   * Share of capitalised content words (excluding the first word, numbers,
   * function words and short acronyms) at which a headline reads as Title Case.
   *
   * The approved sentence-case headlines score 0.00, 0.00, 0.00 and 0.17 (the
   * 0.17 is the proper noun "Auckland"). The two Title Case ones score 1.00.
   * `titleCaseMinCaps` means a single capitalised word — which is what a proper
   * noun looks like — can never trip it.
   */
  titleCaseRatio: 0.8,
  titleCaseMinCaps: 2,
  titleCaseMinContentWords: 2,
} as const;

// --- Vocabulary --------------------------------------------------------------

/**
 * Function words, dropped before any similarity or capitalisation measure.
 *
 * Deliberately its own list rather than an import from `lib/deck/lint.ts`: that
 * one is tuned for six-word slide titles and omits the auxiliaries and
 * possessives that appear constantly in a newsletter sentence. Two short lists
 * that say what they are for beat one shared list that fits neither.
 */
const FUNCTION_WORDS = new Set([
  "a", "an", "the", "of", "and", "or", "to", "for", "in", "on", "at", "with",
  "from", "by", "as", "is", "are", "was", "were", "be", "been", "being",
  "has", "have", "had", "its", "it", "this", "that", "these", "those",
  "but", "not", "no", "so", "than", "then", "there", "here", "into", "over",
  "up", "out", "off", "about", "after", "before", "our", "your", "their",
  "we", "us", "you", "they", "them", "he", "she", "his", "her", "will",
]);

/**
 * Trade-press register that is never right in this section.
 *
 * These are the words that make an item read as a press release rather than as
 * news a reader can act on. Verified against every approved issue: none of them
 * appears in 2026-06 or 2026-07. The list is short on purpose — a long banned
 * list starts rejecting ordinary English and gets switched off.
 */
const REGISTER_BANNED: readonly [RegExp, string][] = [
  [/\bunveil(?:s|ed|ing)?\b/i, "say what happened instead"],
  [/\blaunch(?:es|ed|ing)?\b/i, "say what it does, not that it exists"],
  [/\bsolutions\b/i, "name the thing"],
  [/\bleverag(?:e|es|ed|ing)\b/i, "\"use\""],
  [/\bempower(?:s|ed|ing)\b/i, "say what it actually lets someone do"],
  [/\b(?:is|are|was|were)\s+set\s+to\b/i, "\"will\", or wait until it happens"],
  [/\bcutting[- ]edge\b/i, "drop it"],
  [/\bgame[- ]chang(?:er|ers|ing)\b/i, "drop it"],
  [/\bseamless(?:ly)?\b/i, "drop it"],
  [/\brevolutionis(?:e|es|ed|ing)\b|\brevolutioniz(?:e|es|ed|ing)\b/i, "drop it"],
  [/\bworld[- ]class\b/i, "drop it"],
  [/\bend[- ]to[- ]end\b/i, "drop it"],
  [/\bsynerg(?:y|ies|istic)\b/i, "drop it"],
  [/\bthought leader(?:ship)?\b/i, "drop it"],
  [/\bstate[- ]of[- ]the[- ]art\b/i, "drop it"],
];

/**
 * Softer padding, reported as advisories rather than failures.
 *
 * Every one of these appears in real NZ tech writing and occasionally earns its
 * place ("the startup ecosystem" is what people call it). They are also the
 * exact words the generator reached for when it had nothing to say: the machine
 * -written 2026-08 bites carry "This initiative aims to inspire…" and "This
 * highlights ongoing gender disparities…", both of which are sentences that
 * add no fact. Warning, not error, because the judgement is contextual and a
 * false failure here costs more than a missed advisory.
 */
const REGISTER_SOFT: readonly [RegExp, string][] = [
  [/\binitiative\b/i, "name the programme"],
  [/\bhighlight(?:s|ed|ing)?\b/i, "usually the start of a sentence that adds no fact"],
  [/\bshowcas(?:e|es|ed|ing)\b/i, "\"show\""],
  [/\brobust\b/i, "say what is strong about it"],
  [/\becosystem\b/i, "name who is in it"],
  [/\bpioneering\b/i, "drop it"],
  [/\bspearhead(?:s|ed|ing)?\b/i, "\"led\""],
  [/\baims? to\b/i, "say what it does, not what it intends"],
];

/**
 * A trailing attribution clause: "…, SEEK report shows", "…, according to X".
 *
 * The failure this catches is real and was measured — the one headline the
 * generator wrote itself came back twice as "Job ads fell 0.8% in July, SEEK
 * report shows". Attribution belongs in `sourceLabel`, which the renderer
 * already prints beside the item; repeating it inside the headline spends the
 * scarcest words in the section on something the reader can already see.
 */
const TITLE_ATTRIBUTION_TAIL =
  /,\s*(?:according to\b.*|(?:\S+\s+){0,3}(?:report|survey|study|data|research|figures?|analysis)\s+(?:shows?|finds?|found|says?|said|reveals?|suggests?|reports?)\s*)$/i;

/**
 * The press-release frame: a named subject doing a press-release verb.
 *
 * "SEEK report shows X" is a filing label; "X, and here is what it means" is a
 * headline. Anchored to the start because that is where the vendor goes.
 */
const TITLE_VENDOR_VERB =
  /^(?:[A-Z0-9][\w'’&.-]*\s+){1,3}(?:launches|unveils|announces|debuts|releases|reveals|rolls out|introduces|partners with|expands)\b/;

// --- Text measures -----------------------------------------------------------

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sentence count. Splits on terminal punctuation followed by whitespace OR the
 * end of the string, so a summary ending in a full stop is not counted as
 * having an extra empty sentence.
 */
export function countSentences(text: string): number {
  return text.trim().split(/[.!?]+(?:\s+|$)/).filter(Boolean).length;
}

/**
 * Crude suffix stemmer, applied to BOTH sides of every comparison.
 *
 * It exists for one job: "door"/"doors" and "fake"/"fakes" must not let a
 * headline that is otherwise word-for-word the source's headline slip under the
 * similarity threshold. It is deliberately dumber than a real stemmer — a
 * linguistically wrong but SYMMETRIC transform still compares two strings
 * correctly, and a real stemmer would be a dependency and a surprise.
 */
function stem(word: string): string {
  if (word.length >= 6 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length >= 6 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length >= 4 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Lowercased, punctuation-stripped, function-word-free, stemmed tokens.
 *
 * This is the normalisation the brief asks for — "lowercase, punctuation and
 * quote marks stripped, whitespace collapsed" — plus function-word removal and
 * stemming, because without them "Women 'remain underrepresented' in AI roles"
 * and "Women remain underrepresented in AI roles despite jobs boom" score
 * further apart than they should.
 */
export function styleTokens(text: string): string[] {
  return text
    .toLowerCase()
    /*
     * Thousands separators are removed BEFORE punctuation becomes whitespace,
     * so "1,500" stays one token instead of splitting into "1" and "500".
     * Without this the URL-slug proxy — where a publisher writes "1500" — fails
     * to match the same figure written "1,500+" in the headline, and a headline
     * that is otherwise word-for-word the source's scores 0.67 instead of 1.00.
     */
    .replace(/(\d)[, ](\d)/g, "$1$2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FUNCTION_WORDS.has(word))
    .map(stem);
}

/**
 * Two independent measures of "this is their headline, not ours".
 *
 * `dice` catches wholesale copying in either direction. `containment` catches
 * the other shape — our headline is the source's headline with words removed,
 * or with a prefix or suffix bolted on — which dice alone scores as only
 * moderately similar because the source is longer.
 */
export function headlineSimilarity(
  ours: string,
  theirs: string,
): { dice: number; containment: number; ourWords: number } {
  const a = styleTokens(ours);
  const b = new Set(styleTokens(theirs));
  if (a.length === 0 || b.size === 0) {
    return { dice: 0, containment: 0, ourWords: a.length };
  }
  const shared = a.filter((word) => b.has(word)).length;
  return {
    dice: (2 * shared) / (a.length + b.size),
    containment: shared / a.length,
    ourWords: a.length,
  };
}

/**
 * Recovers the publisher's own headline from an article URL, when the publisher
 * uses title slugs — which every source in `PULSE_RSS_FEEDS` does.
 *
 * This exists because an issue fixture stores `{title, summary, sourceLabel,
 * url, dateLabel}` and NOT the source's headline, so `lint-pulse.ts` would
 * otherwise be unable to run the load-bearing rule at all. The generator has
 * the real fetched title and passes that instead; this is the CLI's proxy, and
 * callers say which they used so the report can be honest about it.
 *
 * The same trick is already trusted elsewhere in this pipeline —
 * `hrdSlugAsTitle()` in `pulse.ts` reads hcamag slugs as titles for exactly
 * this reason. Conservative on purpose: a segment must have at least four
 * hyphen-separated parts and be mostly alphabetic, so an id, a date path or a
 * hash returns null rather than a nonsense comparison.
 */
export function sourceTitleFromUrl(url: string): string | null {
  let segments: string[];
  try {
    segments = new URL(url).pathname.split("/").filter(Boolean);
  } catch {
    return null;
  }

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = decodeURIComponent(segments[i]).replace(/\.html?$/i, "");
    if (/^\d+$/.test(segment)) continue;
    const parts = segment.split("-").filter(Boolean);
    if (parts.length < 4) continue;
    const alphabetic = parts.filter((part) => /^[a-z]+$/i.test(part)).length;
    // A slug that is mostly ids or hex is not a headline.
    if (alphabetic / parts.length < 0.6) continue;
    return parts.join(" ");
  }
  return null;
}

/**
 * Capitalised content words after the first, and how many there are.
 *
 * Numbers, function words and short all-caps acronyms ("AI", "NZ") are excluded
 * from the denominator, because none of them tells you anything about whether
 * the writer was using Title Case.
 */
function capitalisation(title: string): { content: number; caps: number; capsList: string[] } {
  const raw = title.trim().split(/\s+/).filter(Boolean);
  const content = raw.slice(1).filter((word) => {
    const bare = word.replace(/[^\p{L}\p{N}'’]/gu, "");
    if (!bare) return false;
    if (/^\p{N}/u.test(bare)) return false;
    if (FUNCTION_WORDS.has(bare.toLowerCase())) return false;
    if (bare === bare.toUpperCase() && bare.length <= 4) return false;
    return true;
  });
  const capsList = content.filter((word) =>
    /^\p{Lu}/u.test(word.replace(/^[^\p{L}\p{N}]+/u, "")),
  );
  return { content: content.length, caps: capsList.length, capsList };
}

/**
 * Quote marks lifted from a source, as distinct from an apostrophe.
 *
 * "Parents aren't sure their kids can spot a fake" is approved copy and must
 * pass; "Women 'remain underrepresented' in AI roles" must not. The difference
 * is only ever positional — an apostrophe sits between two letters, a quote
 * mark does not — so that is what this measures rather than the character.
 */
function liftedQuoteMarks(text: string): string[] {
  const found: string[] = [];
  if (/["“”]/.test(text)) found.push('"');
  // A single quote that is not between two letters (so not "aren't", "AI's").
  if (/(^|[^\p{L}])['’]|['’]([^\p{L}]|$)/u.test(text)) found.push("'");
  return found;
}

// --- Issues ------------------------------------------------------------------

export interface PulseCopyIssue {
  /** Index in `newsBites`, or -1 for the hero stat / whole-section rules. */
  index: number;
  /** Which field carries the problem, e.g. `newsBites[0].title`. */
  field: string;
  rule: string;
  /** `error` must be fixed; `warning` is reported and does not fail a check. */
  severity: "error" | "warning";
  message: string;
}

export function hasCopyErrors(issues: readonly PulseCopyIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

/** Where a source headline came from, so a message can say how sure it is. */
export type SourceTitleOrigin = "fetched" | "url-slug";

/**
 * The fields of a news item these rules read.
 *
 * Deliberately looser than `PulseNewsItem`: an issue fixture written before the
 * schema settled can carry an item with no `sourceLabel`, and the checker has to
 * be able to report on the file that actually exists rather than only on a
 * perfectly-shaped one.
 */
export interface PulseBiteCopy {
  title: string;
  summary: string;
  url: string;
  sourceLabel?: string;
}

function issue(
  index: number,
  field: string,
  rule: string,
  severity: PulseCopyIssue["severity"],
  message: string,
): PulseCopyIssue {
  return { index, field, rule, severity, message };
}

// --- The rules ---------------------------------------------------------------

/**
 * Checks one bite headline.
 *
 * `sourceTitle` is optional because it is not always knowable: the generator
 * has the fetched headline, the CLI has only a slug proxy, and an item whose
 * URL carries no title slug has neither. When it is absent the copy rules are
 * skipped and everything else still runs — a rule that cannot be evaluated is
 * not a rule that passed, but it is also not a reason to skip the six rules
 * that can be.
 */
export function checkBiteTitle(
  title: string,
  opts: {
    index: number;
    sourceTitle?: string | null;
    sourceTitleOrigin?: SourceTitleOrigin;
  },
): PulseCopyIssue[] {
  const issues: PulseCopyIssue[] = [];
  const { index } = opts;
  const field = `newsBites[${index}].title`;
  const at = (rule: string, severity: PulseCopyIssue["severity"], message: string) =>
    issues.push(issue(index, field, rule, severity, message));

  if (!title.trim()) {
    at("title-empty", "error", "The headline is empty.");
    return issues;
  }

  const words = countWords(title);
  if (words > PULSE_COPY_LIMITS.titleWords) {
    at(
      "title-length",
      "error",
      `The headline is ${words} words (max ${PULSE_COPY_LIMITS.titleWords}): "${title}"`,
    );
  }

  const caps = capitalisation(title);
  if (
    caps.content >= PULSE_COPY_LIMITS.titleCaseMinContentWords &&
    caps.caps >= PULSE_COPY_LIMITS.titleCaseMinCaps &&
    caps.caps / caps.content >= PULSE_COPY_LIMITS.titleCaseRatio
  ) {
    at(
      "title-case",
      "error",
      `The headline is in Title Case (${caps.capsList.join(", ")}). ` +
        `She Sharp headlines are sentence case — capitalise the first word and ` +
        `proper nouns only: "${title}"`,
    );
  }

  const quotes = liftedQuoteMarks(title);
  if (quotes.length > 0) {
    at(
      "title-quote-marks",
      "error",
      `The headline carries quotation marks (${quotes.join(" ")}). ` +
        `They almost always come from the publisher's own headline; say the ` +
        `thing in our own words instead: "${title}"`,
    );
  }

  if (TITLE_ATTRIBUTION_TAIL.test(title)) {
    at(
      "title-attribution",
      "error",
      `The headline ends with an attribution clause. The source is already ` +
        `printed beside the item, so this spends the headline on a filing ` +
        `label: "${title}"`,
    );
  }

  if (TITLE_VENDOR_VERB.test(title)) {
    at(
      "title-vendor-subject",
      "error",
      `The headline's subject is a company or a source doing a press-release ` +
        `verb. Lead with what changed for the reader instead: "${title}"`,
    );
  }

  for (const [pattern, fix] of REGISTER_BANNED) {
    const hit = pattern.exec(title);
    if (hit) {
      at(
        "title-register",
        "error",
        `"${hit[0]}" is trade-press register — ${fix}: "${title}"`,
      );
    }
  }

  const sourceTitle = opts.sourceTitle?.trim();
  if (sourceTitle) {
    const origin = opts.sourceTitleOrigin ?? "fetched";
    const attributed =
      origin === "url-slug"
        ? `the publisher's own headline (read from the article URL: "${sourceTitle}")`
        : `the publisher's own headline ("${sourceTitle}")`;
    const similarity = headlineSimilarity(title, sourceTitle);

    if (similarity.dice >= PULSE_COPY_LIMITS.titleCopyDice) {
      at(
        "title-copies-source",
        "error",
        `The headline is ${attributed}, not one of ours ` +
          `(${Math.round(similarity.dice * 100)}% the same words). A trade-press ` +
          `headline is written to be indexed; write one that tells a reader in ` +
          `Auckland what changed for her: "${title}"`,
      );
    } else if (
      similarity.ourWords >= PULSE_COPY_LIMITS.titleCopyMinWords &&
      similarity.containment >= PULSE_COPY_LIMITS.titleCopyContainment
    ) {
      at(
        "title-copies-source",
        "error",
        `Every meaningful word in the headline already appears in ${attributed}, ` +
          `so it is that headline with words taken out rather than a headline of ` +
          `ours. Say something the source's own title does not: "${title}"`,
      );
    }
  }

  return issues;
}

/** Checks one bite summary. */
export function checkBiteSummary(
  summary: string,
  opts: { index: number },
): PulseCopyIssue[] {
  const issues: PulseCopyIssue[] = [];
  const { index } = opts;
  const field = `newsBites[${index}].summary`;
  const at = (rule: string, severity: PulseCopyIssue["severity"], message: string) =>
    issues.push(issue(index, field, rule, severity, message));

  if (!summary.trim()) {
    at("summary-empty", "error", "The summary is empty.");
    return issues;
  }

  const words = countWords(summary);
  if (words > PULSE_COPY_LIMITS.summaryWords) {
    at(
      "summary-length",
      "error",
      `The summary is ${words} words (max ${PULSE_COPY_LIMITS.summaryWords}). ` +
        `Cut to the fact and what it means for the reader.`,
    );
  }

  const sentences = countSentences(summary);
  if (sentences > PULSE_COPY_LIMITS.summarySentences) {
    at(
      "summary-sentences",
      "error",
      `The summary is ${sentences} sentences (max ${PULSE_COPY_LIMITS.summarySentences}). ` +
        `Two is the target; the third is only worth it when it says what the ` +
        `number means for a reader.`,
    );
  }

  for (const [pattern, fix] of REGISTER_BANNED) {
    const hit = pattern.exec(summary);
    if (hit) {
      at("summary-register", "error", `"${hit[0]}" is trade-press register — ${fix}.`);
    }
  }

  for (const sentence of hollowClosers(summary)) {
    at(
      "summary-hollow-sentence",
      "error",
      `"${sentence}" adds no fact — it names no number and no person, place or ` +
        `programme. Delete it, or replace it with something the reader did not ` +
        `already know from the sentence before.`,
    );
  }

  for (const [pattern, fix] of REGISTER_SOFT) {
    const hit = pattern.exec(summary);
    if (hit) {
      at(
        "summary-padding",
        "warning",
        `"${hit[0]}" usually pads rather than informs — ${fix}.`,
      );
    }
  }

  return issues;
}

/**
 * Sentences that close a summary while saying nothing.
 *
 * An ERROR where `REGISTER_SOFT` above is only a warning, and the difference is
 * deliberate: that list bans WORDS, and words like "ecosystem" or "highlights"
 * sometimes earn their place. This bans a SENTENCE SHAPE, which does not.
 *
 * The shape was measured rather than imagined. Three of three machine-written
 * 2026-08 summaries ended with one — "This highlights the need for initiatives
 * to support women entering AI careers", "This initiative aims to inspire young
 * women to explore careers in technology" — and all three of the hand-written
 * 2026-07 summaries, which are the quality bar, contain none. So the rule fires
 * on every observed failure and on no approved copy.
 *
 * A sentence qualifies only when it opens with "This"/"These"/"It" AND carries
 * no quantity AND no proper noun after the first word. Those escapes are what
 * keep it honest: a closer that names Auckland, or quotes a figure, is telling
 * the reader something and survives. The rule is deliberately conservative — it
 * under-fires rather than argue with a sentence that might be doing work.
 *
 * "Quantity" deliberately includes SPELLED-OUT numbers. The first version of
 * this rule tested for a digit only, and flagged "This is the third month of
 * decline" — a sentence that states a fact in words. A rule that rejects a real
 * fact because it was written out is worse than one that lets a little padding
 * through, because the first thing an operator does with a check that argues
 * with good copy is stop reading it.
 */
const SPELLED_QUANTITY =
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|half|quarter|third|double|triple|most|majority|minority)\b/i;

/**
 * The summary with any fact-free closing sentence removed.
 *
 * The generator's fix, where {@link hollowClosers} is the checker's report. It
 * is safe by construction, not by judgement: a sentence only qualifies when it
 * carries no digit, no spelled-out quantity and no proper noun, so removing it
 * cannot lose a fact — and it cannot affect a verbatim-number check, because
 * removing text can only remove numbers.
 *
 * Returns the input unchanged when the trim would empty the summary. A hollow
 * sentence that is the WHOLE summary is a different problem, and the checker
 * should report it rather than this function silently producing nothing.
 */
export function trimHollowClosers(summary: string): string {
  const hollow = new Set(hollowClosers(summary));
  if (hollow.size === 0) return summary;

  const kept = summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && !hollow.has(sentence));

  return kept.length > 0 ? kept.join(" ") : summary;
}

export function hollowClosers(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (!/^(This|These|It)\b/.test(sentence)) return false;
      if (/\d/.test(sentence)) return false;
      if (SPELLED_QUANTITY.test(sentence)) return false;
      const rest = sentence.split(/\s+/).slice(1);
      return !rest.some((word) => /^[A-Z][a-z]/.test(word));
    });
}

/** Checks one bite, headline and summary together. */
export function checkNewsBite(
  bite: Pick<PulseNewsItem, "title" | "summary">,
  opts: {
    index: number;
    sourceTitle?: string | null;
    sourceTitleOrigin?: SourceTitleOrigin;
  },
): PulseCopyIssue[] {
  return [
    ...checkBiteTitle(bite.title, opts),
    ...checkBiteSummary(bite.summary, { index: opts.index }),
  ];
}

/**
 * Checks the news list as a SET.
 *
 * Every rule here can be satisfied item by item and violated by the section,
 * which is the same reason `lintRhythm` exists for decks: the failure is in how
 * three correct items read together, and that is invisible to anyone reviewing
 * one at a time — which is how they are always reviewed.
 *
 * The publisher rule is a WARNING, not an error, and deliberately does not
 * duplicate the de-duplication already in `selectNewsBites()`. That one keys on
 * (host, topic tier) and treats a repeat as a spare to be used last; this one
 * keys on the printed `sourceLabel` alone and only reports. SKILL.md's own
 * wording is "at most one item from any single publisher, **unless the second
 * is genuinely better than anything else available**" — a rule with a stated
 * exception cannot be an error.
 */
export function checkNewsBiteSet(
  bites: readonly { title: string; sourceLabel?: string }[],
): PulseCopyIssue[] {
  const issues: PulseCopyIssue[] = [];
  if (bites.length === 0) return issues;

  const byPublisher = new Map<string, number[]>();
  bites.forEach((bite, index) => {
    const key = (bite.sourceLabel ?? "").trim().toLowerCase();
    if (!key) return;
    byPublisher.set(key, [...(byPublisher.get(key) ?? []), index]);
  });
  for (const [publisher, indexes] of byPublisher) {
    if (indexes.length < 2) continue;
    issues.push(
      issue(
        indexes[1],
        "newsBites",
        "set-one-per-publisher",
        "warning",
        `${indexes.length} items come from the same publisher (${publisher}), at ` +
          `positions ${indexes.map((i) => i + 1).join(" and ")}. Keep the second ` +
          `only if it is genuinely better than anything else available.`,
      ),
    );
  }

  /*
   * Three headlines that all open on a figure read as a spreadsheet rather than
   * as a section. Only fires when EVERY item does it, so a single stat-led
   * headline — which is often the strongest one — is never touched.
   */
  const numberLed = bites.filter((bite) => /^[^\p{L}]*\p{N}/u.test(bite.title.trim()));
  if (bites.length >= 2 && numberLed.length === bites.length) {
    issues.push(
      issue(
        -1,
        "newsBites",
        "set-all-open-with-number",
        "error",
        `All ${bites.length} headlines open with a number, so the section reads ` +
          `as a table. Lead at least one of them with the change rather than ` +
          `the figure.`,
      ),
    );
  }

  const seen = new Map<string, number>();
  bites.forEach((bite, index) => {
    const key = styleTokens(bite.title).join(" ");
    if (!key) return;
    const first = seen.get(key);
    if (first !== undefined) {
      issues.push(
        issue(
          index,
          `newsBites[${index}].title`,
          "set-duplicate-headline",
          "error",
          `This headline says the same thing as item ${first + 1}. A reader who ` +
            `has read one has read both.`,
        ),
      );
      return;
    }
    seen.set(key, index);
  });

  return issues;
}

/** Checks the hero statistic's own copy (its numbers are `pulse.ts`'s business). */
export function checkHeroStat(hero: Pick<PulseHeroStat, "label" | "context">): PulseCopyIssue[] {
  const issues: PulseCopyIssue[] = [];
  const at = (field: string, rule: string, severity: PulseCopyIssue["severity"], message: string) =>
    issues.push(issue(-1, field, rule, severity, message));

  const labelWords = countWords(hero.label);
  if (labelWords > PULSE_COPY_LIMITS.heroLabelWords) {
    at(
      "heroStat.label",
      "hero-label-length",
      "error",
      `The hero label is ${labelWords} words (max ${PULSE_COPY_LIMITS.heroLabelWords}). ` +
        `It is read as the continuation of the number, not as a caption: "${hero.label}"`,
    );
  }

  const caps = capitalisation(hero.label);
  if (
    caps.content >= PULSE_COPY_LIMITS.titleCaseMinContentWords &&
    caps.caps >= PULSE_COPY_LIMITS.titleCaseMinCaps &&
    caps.caps / caps.content >= PULSE_COPY_LIMITS.titleCaseRatio
  ) {
    at(
      "heroStat.label",
      "hero-label-case",
      "error",
      `The hero label is in Title Case (${caps.capsList.join(", ")}); use sentence case.`,
    );
  }

  const contextWords = countWords(hero.context);
  if (contextWords > PULSE_COPY_LIMITS.heroContextWords) {
    at(
      "heroStat.context",
      "hero-context-length",
      "error",
      `The hero context is ${contextWords} words (max ${PULSE_COPY_LIMITS.heroContextWords}).`,
    );
  }

  const contextSentences = countSentences(hero.context);
  if (contextSentences > PULSE_COPY_LIMITS.heroContextSentences) {
    at(
      "heroStat.context",
      "hero-context-sentences",
      "error",
      `The hero context is ${contextSentences} sentences (max ${PULSE_COPY_LIMITS.heroContextSentences}).`,
    );
  }

  for (const [pattern, fix] of REGISTER_BANNED) {
    for (const [field, text] of [
      ["heroStat.label", hero.label],
      ["heroStat.context", hero.context],
    ] as const) {
      const hit = pattern.exec(text);
      if (hit) {
        at(field, "hero-register", "error", `"${hit[0]}" is trade-press register — ${fix}.`);
      }
    }
  }

  return issues;
}

/**
 * Lints a whole assembled Pulse.
 *
 * `sourceTitles` maps an item URL to the publisher's own headline. The
 * generator passes the titles it fetched; `lint-pulse.ts` passes nothing and
 * lets each item fall back to `sourceTitleFromUrl`, which is why `origin` is
 * tracked per item rather than per call.
 */
export function lintPulseCopy(
  pulse: {
    heroStat?: Pick<PulseHeroStat, "label" | "context"> | null;
    newsBites?: readonly PulseBiteCopy[] | null;
  } | null,
  opts: { sourceTitles?: ReadonlyMap<string, string> } = {},
): PulseCopyIssue[] {
  if (!pulse) return [];
  const issues: PulseCopyIssue[] = [];

  if (pulse.heroStat) issues.push(...checkHeroStat(pulse.heroStat));

  const bites = pulse.newsBites ?? [];
  bites.forEach((bite, index) => {
    const fetched = opts.sourceTitles?.get(bite.url);
    const sourceTitle = fetched ?? sourceTitleFromUrl(bite.url);
    issues.push(
      ...checkNewsBite(bite, {
        index,
        sourceTitle,
        sourceTitleOrigin: fetched ? "fetched" : "url-slug",
      }),
    );
  });

  issues.push(...checkNewsBiteSet(bites));
  return issues;
}

// --- The brief half of the contract -----------------------------------------

/**
 * The house style as the writer is told it.
 *
 * Kept HERE, beside the checker, so the two cannot drift. The single worked
 * example is real: it is the 2026-08 generator output that copied TechWomen
 * NZ's own headline, next to a headline that says what the article means for a
 * reader. An abstract rule plus one concrete before/after is worth more than
 * five more abstract rules — that is the whole finding from the deck copy
 * linter, where the template's own lines survived every instruction until a
 * checker counted them.
 *
 * The numbers are interpolated from `PULSE_COPY_LIMITS` so that changing a
 * limit changes what the writer is asked for, in one edit.
 */
export const PULSE_HOUSE_STYLE_RULES = `HOUSE STYLE — how a news item must be written (pulse-apply.ts checks every one of these and REFUSES to write the section if any fails):
- The "title" is OUR headline, never the publisher's. Do not copy, trim, or lightly reword the article's own title. If every meaningful word of your headline already appears in the source's headline, you have not written one.
- Sentence case. Capitalise the first word and proper nouns; nothing else. "Job ads fell for a third month" — not "Job Ads Fell For A Third Month".
- At most ${PULSE_COPY_LIMITS.titleWords} words, and aim for about ten.
- Never carry quotation marks over from the source's headline.
- The subject is what changed for the reader, not the company or the report that announced it. Do not end a headline with ", according to X" or ", the report shows" — we print the source beside the item already.
- No trade-press words anywhere: unveils, launches, solutions, leverages, empowers, "is set to", cutting-edge, seamless, world-class, game-changer. Plain English, New Zealand spelling.
- The "summary" is at most two sentences and about 35 words. Say the fact, then what it means for a woman working in or entering tech in New Zealand.
- NEVER end a summary with a sentence that adds no fact. "This highlights the need for…", "This initiative aims to inspire…", "This trend underscores…" are all the same sentence, and it is REJECTED, not merely discouraged. If the second sentence names no number and no person, place or programme, it is padding — stop after the first sentence instead. A one-sentence summary is correct and common.
- Across the three items: do not let all of them open with a number.

WORKED EXAMPLE — this is the failure to avoid, taken from a real run:
  Source article title: "ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa"
  BAD  title: "ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa"
       (the publisher's headline, copied — it tells a reader nothing our own words would not)
  BAD  title: "ShadowTech26 Opens Doors for 1,500 Girls"
       (Title Case, and still only the source's headline with words removed)
  GOOD title: "Know a Year 9 girl? August is when to nudge her"
       summary: "TechWomen NZ's ShadowTech26 places 1,500 secondary school girls in tech workplaces this August, for Years 9 to 11. If you know one, this is the month to tell her about it."
  The good version invents nothing — every number and every fact is still the source's, copied verbatim. Only whose voice it is in has changed.`;
