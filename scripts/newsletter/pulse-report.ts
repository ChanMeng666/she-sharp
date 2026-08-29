/**
 * How a house-style violation is reported to a person or an agent — one voice,
 * used by both `lint-pulse.ts` and `pulse-apply.ts`.
 *
 * It was `lint-pulse.ts`'s alone until the apply step needed to say the same
 * things about the same rules. Two copies of "what this rule is called" and
 * "what to do about it" would be two copies that could disagree, and the one
 * that disagreed would be the one an agent read at the moment it was trying to
 * fix something — so there is one.
 *
 * The shape is deliberate: a plain-English NAME for the rule, the offending
 * text, and exactly ONE instruction. No theory, no rule numbers, nothing the
 * reader has to look up.
 */

import type { PulseCopyIssue } from "../../lib/newsletter/pulse-copy";

/** Plain-English name for each rule, shown as the problem headline. */
export const RULE_TITLES: Record<string, string> = {
  "title-empty": "Headline is empty",
  "title-length": "Headline is too long",
  "title-case": "Headline is in Title Case",
  "title-quote-marks": "Headline carries the source's quotation marks",
  "title-attribution": "Headline ends with an attribution clause",
  "title-vendor-subject": "Headline's subject is a company, not the reader",
  "title-register": "Headline uses trade-press language",
  "title-copies-source": "Headline is the publisher's, not ours",
  "summary-empty": "Summary is empty",
  "summary-length": "Summary is too long",
  "summary-sentences": "Summary runs to too many sentences",
  "summary-register": "Summary uses trade-press language",
  "summary-padding": "Summary has a sentence that adds no fact",
  "set-one-per-publisher": "Two items from the same publisher",
  "set-all-open-with-number": "Every headline opens with a number",
  "set-duplicate-headline": "Two headlines say the same thing",
  "hero-label-length": "Hero label is too long",
  "hero-label-case": "Hero label is in Title Case",
  "hero-context-length": "Hero context is too long",
  "hero-context-sentences": "Hero context runs to too many sentences",
  "hero-register": "Hero stat uses trade-press language",
};

/** What to actually do about each rule. One instruction, no theory. */
export const RULE_FIXES: Record<string, string> = {
  "title-empty": "Write a headline, or delete the item.",
  "title-length": "Cut it to about ten words. Keep the change, drop the detail.",
  "title-case":
    "Lower-case everything but the first word and proper nouns. \"Job ads fell for a third month\", not \"Job Ads Fell For A Third Month\".",
  "title-quote-marks":
    "Say it in our own words without the quotes. A quoted phrase in a headline is nearly always the publisher's.",
  "title-attribution":
    "Delete the \", according to X\" / \", the report shows\" tail. The source is printed beside the item already.",
  "title-vendor-subject":
    "Rewrite so the subject is what changed for a reader, not the company that announced it.",
  "title-register": "Replace the word with plain English.",
  "title-copies-source":
    "Write a headline that says what the story means for a woman working in or entering tech in New Zealand. Read the candidate's text, and say the thing the publisher's own headline does not. A headline does not need a number — the summary carries the figures.",
  "summary-empty": "Write two sentences, or delete the item.",
  "summary-length": "Cut to the fact and what it means. About 35 words.",
  "summary-sentences":
    "Two sentences. A third earns its place only when it says what the number means for the reader.",
  "summary-register": "Replace the word with plain English.",
  "summary-padding":
    "Delete the sentence or replace it with a fact. \"This initiative aims to…\" and \"This highlights…\" tell a reader nothing.",
  "set-one-per-publisher":
    "Swap the second one out, unless it is genuinely better than anything else available — see Step 4a.",
  "set-all-open-with-number":
    "Rewrite one headline to lead with the change rather than the figure.",
  "set-duplicate-headline":
    "Delete one of them. A reader who has read one has read both.",
  "hero-label-length":
    "The label is read as the continuation of the number, so keep it to a phrase.",
  "hero-label-case": "Sentence case.",
  "hero-context-length": "One or two plain sentences.",
  "hero-context-sentences": "Two sentences at most.",
  "hero-register": "Replace the word with plain English.",
};

/** Prints one issue: what it is, what is wrong, and the single thing to do. */
export function printIssue(entry: PulseCopyIssue, indent = "    "): void {
  const label = RULE_TITLES[entry.rule] ?? entry.rule;
  const mark = entry.severity === "error" ? "MUST FIX" : "look at";
  console.log(`${indent}[${mark}] ${label}`);
  console.log(`${indent}  ${entry.message}`);
  const fix = RULE_FIXES[entry.rule];
  if (fix) console.log(`${indent}  → ${fix}`);
}

/**
 * Prints a whole set of issues grouped by the item they belong to.
 *
 * Grouped rather than flat because that is how they get fixed: an agent
 * rewriting item 2 wants every complaint about item 2 in one place, not
 * interleaved with the hero stat's.
 */
export function printIssuesByItem(
  issues: readonly PulseCopyIssue[],
  bites: readonly { title: string; sourceLabel?: string }[]
): void {
  const byIndex = new Map<number, PulseCopyIssue[]>();
  for (const entry of issues) {
    byIndex.set(entry.index, [...(byIndex.get(entry.index) ?? []), entry]);
  }
  for (const index of [...byIndex.keys()].sort((a, b) => a - b)) {
    const heading =
      index < 0
        ? "  The section as a whole"
        : `  Item ${index + 1} — "${bites[index]?.title ?? "?"}" [${bites[index]?.sourceLabel ?? "?"}]`;
    console.log(heading);
    byIndex.get(index)!.forEach((entry) => printIssue(entry));
    console.log("");
  }
}
