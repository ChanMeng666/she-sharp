/**
 * The candidate file — the contract between the two halves of the Pulse loop.
 *
 * `pulse-candidates.ts` writes it, an AI agent reads it and writes a draft,
 * `pulse-apply.ts` reads BOTH and validates one against the other. Because the
 * apply step checks the draft against this file rather than against a fresh
 * fetch, the two must agree byte for byte about what each source said — so the
 * shape lives here, once, and neither script defines its own.
 *
 * WHY A FILE AND NOT A FETCH INSIDE `pulse-apply.ts`. Feeds move. If apply
 * re-fetched, an agent could write a perfectly sourced item at 9am and have it
 * refused at 9.05 because the feed rolled the article off page 1 — and the
 * refusal would say "url was not one we fetched", which is true and completely
 * misleading. Pinning the corpus makes a refusal mean what it says.
 *
 * It lives under `tmp/`, which is gitignored and is this repo's convention for
 * exactly this kind of regenerable working file. Nothing here is a source of
 * truth; delete it and run the candidates script again.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

import type { PulseSourceData } from "../../lib/newsletter/pulse";

/** `YYYY-MM`, the id every issue file is named after. */
export const ISSUE_ID = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "August 2026" from "2026-08" — the label the section's copy is framed with. */
export function monthLabel(issueId: string): string {
  const [year, month] = issueId.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** Where the candidate file for one issue lives. Relative to the repo root. */
export function candidatePath(issueId: string): string {
  return join("tmp", "newsletter", `pulse-candidates-${issueId}.json`);
}

/** Where the agent is asked to write its draft. Relative to the repo root. */
export function draftPath(issueId: string): string {
  return join("tmp", "newsletter", `pulse-draft-${issueId}.json`);
}

/**
 * One candidate, carrying everything an agent needs to choose and write well
 * and nothing it should not have.
 *
 * `text` is the load-bearing field: it is the SAME string
 * `assertNumbersVerbatim` checks a drafted item against. That equality is
 * deliberate and is the difference between a guard an agent can satisfy and one
 * it can only fail — a number visible here is a number it may use, and a number
 * not here is one it may not, with no third case.
 *
 * `sourceTitle` is the publisher's own headline. It is published so the agent
 * can see what NOT to write: the house style's load-bearing rule is that our
 * headline is ours, and `checkBiteTitle` compares against this exact string.
 */
export const candidateSchema = z.object({
  url: z.string().url(),
  /** Attribution printed beside the item in the email; a subscriber reads this. */
  sourceLabel: z.string().min(1),
  /** The publisher's own headline. Read it, then write a different one. */
  sourceTitle: z.string().min(1),
  /** Publication instant, or null for a source that covers a period (SEEK). */
  publishedAt: z.string().nullable(),
  /** Whole days since publication, or null when undated. For judging freshness. */
  ageDays: z.number().nullable(),
  /** Relevance tier from `rssRelevanceRank`; 0 is the most on-mission. */
  tier: z.number().int().min(0).max(4),
  /** That tier in words, so the ordering does not have to be inferred. */
  tierLabel: z.string().min(1),
  /** True for the SEEK employment report: eligible for AT MOST ONE bite. */
  isSeekReport: z.boolean(),
  /** The publisher's one-line teaser, for triage. Never printed verbatim. */
  teaser: z.string(),
  /** The retrieved text. Every number written about this item must be in here. */
  text: z.string().min(1),
});

export type PulseCandidate = z.infer<typeof candidateSchema>;

/** The whole candidate file. */
export const candidateFileSchema = z.object({
  issue: z.string().regex(ISSUE_ID),
  monthLabel: z.string().min(1),
  generatedAt: z.string().min(1),
  /** Where to write the draft, and the exact command that validates it. */
  writeDraftTo: z.string().min(1),
  applyWith: z.string().min(1),
  /** The JSON shape the draft must have, with one complete worked example. */
  draftShape: z.unknown(),
  /** `PULSE_EDITORIAL_BRIEF` — the mix, the priorities, the two SEEK rules. */
  editorialBrief: z.string().min(1),
  /** `PULSE_HOUSE_STYLE_RULES` — how an item must be written. */
  houseStyle: z.string().min(1),
  /** The SEEK report, which the hero statistic must come from. */
  heroSource: z
    .object({
      sourceLabel: z.string().min(1),
      sourceTitle: z.string().min(1),
      url: z.string().url(),
      text: z.string().min(1),
    })
    .nullable(),
  candidates: z.array(candidateSchema),
});

export type PulseCandidateFile = z.infer<typeof candidateFileSchema>;

/** Writes the candidate file, creating `tmp/newsletter/` if it is not there. */
export function writeCandidateFile(file: PulseCandidateFile): string {
  const path = candidatePath(file.issue);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  return path;
}

/** Reads and validates the candidate file, or throws with what to run instead. */
export function readCandidateFile(issueId: string): PulseCandidateFile {
  const path = candidatePath(issueId);
  if (!existsSync(path)) {
    throw new Error(
      `No candidate file at ${path}.\n` +
        `  Run this first:  npx tsx scripts/newsletter/pulse-candidates.ts ${issueId}`
    );
  }
  return candidateFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

/**
 * Rebuilds the fetched corpus from the candidate file, in the shape the guards
 * in `lib/newsletter/pulse.ts` expect.
 *
 * The SEEK report is deliberately NOT put back into `newsItems` here:
 * `applyPulseDraft` reconstructs that candidate itself with
 * `seekNewsCandidate()`, so there is exactly one construction of it and the
 * file the agent read cannot disagree with the map the guard checks.
 */
export function corpusFromCandidateFile(file: PulseCandidateFile): PulseSourceData {
  return {
    seekArticle: file.heroSource
      ? {
          title: file.heroSource.sourceTitle,
          url: file.heroSource.url,
          text: file.heroSource.text,
        }
      : null,
    newsItems: file.candidates
      .filter((candidate) => !candidate.isSeekReport)
      .map((candidate) => ({
        title: candidate.sourceTitle,
        url: candidate.url,
        source: candidate.sourceLabel,
        isoDate: candidate.publishedAt,
        snippet: candidate.teaser,
        sourceText: candidate.text,
      })),
  };
}
