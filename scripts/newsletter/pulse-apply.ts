/**
 * Step 3 of 3 — validate what the agent wrote, and only then write
 * `editorial.pulse` into the issue fixture.
 *
 * WHY THIS EXISTS
 * ---------------
 * The writing moved to whichever AI agent is running the skill. The checking
 * did not, and this is where it happens. **Every guard that used to run on the
 * model's output runs here, unchanged, on the agent's:** a URL must be one the
 * candidate file actually contains, every number must appear verbatim in that
 * item's own retrieved text, the hero number must be a literal substring of the
 * SEEK report, no two items may share a URL, a normalised headline or a
 * publisher, a SEEK bite must not repeat the hero's figure, and the full house
 * style must pass with no errors.
 *
 * The whole safety argument for handing the writing to a different agent every
 * month is that these run on the output regardless of who wrote it. If anything
 * they matter more now than they did against a pinned model at temperature 0.
 *
 * A REFUSAL IS THE GUARD WORKING
 * ------------------------------
 * On any violation this writes NOTHING and prints what to fix. That is the
 * correct outcome, not an error to route around: the fix is always to correct
 * the copy and run it again, and never to edit the guard, relax a rule, or hand-
 * edit the number into the issue file. `docs/development/CONTENT_RULES.md`
 * exists because numbers reached the public that nobody could source, and this
 * is the section where that is easiest to do by accident.
 *
 * It also cannot invent a news item. If the month's sources are thin the honest
 * answer is a two-item Pulse — 宁缺毋滥 — and a short Pulse is a correct Pulse.
 *
 * WHAT IT TOUCHES
 * ---------------
 * `editorial.pulse` and nothing else, keeping the careful approach of the
 * `refresh-pulse.ts` this replaces: parse the whole issue first so an
 * already-invalid file is caught before anything is written, swap the one key,
 * re-validate the whole issue, then write with the two-space indent and newline
 * Step 1 uses so the next diff is readable. The founder's note, the subject
 * line, the photo choices and the entire `auto` snapshot are untouched.
 *
 * Dry run by default, because it overwrites a committed file: `--apply` must be
 * spelled out.
 *
 * Usage:
 *   npx tsx scripts/newsletter/pulse-apply.ts 2026-09                             # dry run
 *   npx tsx scripts/newsletter/pulse-apply.ts 2026-09 --from tmp/newsletter/pulse-draft-2026-09.json
 *   npx tsx scripts/newsletter/pulse-apply.ts 2026-09 --apply
 *   npx tsx scripts/newsletter/pulse-apply.ts 2026-09 --json
 */

import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  applyPulseDraft,
  pulseDraftSchema,
  type PulseDraft,
} from "../../lib/newsletter/pulse";
import { newsletterIssueSchema } from "../../lib/newsletter/schema";
import {
  corpusFromCandidateFile,
  draftPath,
  ISSUE_ID,
  monthLabel,
  readCandidateFile,
} from "./pulse-candidate-file";
import { printIssuesByItem } from "./pulse-report";

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");

/** Prints an error and exits, in the house shape. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** One line describing a pulse, for the before/after diff. */
function describe(pulse: unknown): string[] {
  const p = pulse as {
    heroStat?: { value?: string; label?: string };
    newsBites?: { title?: string; sourceLabel?: string }[];
    newsBite?: { title?: string; sourceLabel?: string } | null;
    didYouKnow?: { text?: string };
  } | null;
  if (!p) return ["  (no pulse)"];

  const lines: string[] = [];
  lines.push(`  heroStat    ${p.heroStat?.value ?? "—"}  ${p.heroStat?.label ?? ""}`);
  const bites = p.newsBites ?? (p.newsBite ? [p.newsBite] : []);
  if (bites.length === 0) {
    lines.push("  newsBites   (none)");
  } else {
    bites.forEach((bite, i) => {
      lines.push(`  newsBites ${i + 1} [${bite.sourceLabel ?? "?"}] ${bite.title ?? ""}`);
    });
  }
  lines.push(`  didYouKnow  ${(p.didYouKnow?.text ?? "").slice(0, 72)}…`);
  return lines;
}

/** How many news items a stored pulse carries, legacy key included. */
function countOf(pulse: unknown): number {
  const p = pulse as { newsBites?: unknown[]; newsBite?: unknown } | null;
  return p?.newsBites?.length ?? (p?.newsBite ? 1 : 0);
}

/**
 * Reads the agent's draft.
 *
 * Parse failures are reported as prose rather than as a zod dump: the reader is
 * an agent that has just written this file and can fix it, and "newsBites[1] is
 * missing url" is actionable where a schema trace is a puzzle.
 */
function readDraft(path: string, issueId: string): PulseDraft {
  if (!existsSync(path)) {
    fail(
      `No draft at ${path}.`,
      "Write the section first — the candidate file says exactly where and in what shape:",
      `  npx tsx scripts/newsletter/pulse-candidates.ts ${issueId}`
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(
      `${path} is not valid JSON.`,
      error instanceof Error ? error.message : String(error)
    );
  }

  const parsed = pulseDraftSchema.safeParse(raw);
  if (!parsed.success) {
    fail(
      `${path} does not match the draft shape.`,
      ...parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
      ),
      "",
      'The shape is { "heroStat": {value,label,context} | null, "newsBites": [{title,summary,url}] }.',
      "The candidate file's `draftShape` carries a complete worked example."
    );
  }
  return parsed.data;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const issueId = argv.find((arg) => !arg.startsWith("--"));
  const apply = argv.includes("--apply");
  const asJson = argv.includes("--json");

  const fromIndex = argv.indexOf("--from");
  const from =
    fromIndex >= 0 && argv[fromIndex + 1] && !argv[fromIndex + 1].startsWith("--")
      ? argv[fromIndex + 1]
      : null;

  if (!issueId || !ISSUE_ID.test(issueId)) {
    fail(
      "An issue id is required, as YYYY-MM.",
      "Usage: npx tsx scripts/newsletter/pulse-apply.ts 2026-09 [--from <draft.json>] [--apply] [--json]"
    );
  }

  const issuePath = join(ISSUE_DIR, `${issueId}.json`);
  if (!existsSync(issuePath)) fail(`No issue file at ${issuePath}.`);

  // Parsed rather than spread blindly: if the file on disk is already invalid,
  // that is worth knowing before this script writes to it.
  const raw = JSON.parse(readFileSync(issuePath, "utf8")) as Record<string, unknown>;
  newsletterIssueSchema.parse(raw);

  const candidateFile = readCandidateFile(issueId);
  const draftFile = from ?? draftPath(issueId);
  const draft = readDraft(draftFile, issueId);

  console.log(`NZ Tech Pulse — checking the draft for ${issueId} (${monthLabel(issueId)})`);
  console.log("");
  console.log(`  candidates  ${candidateFile.candidates.length}, fetched ${candidateFile.generatedAt}`);
  console.log(`  draft       ${draftFile.replace(/\\/g, "/")}`);
  console.log("");

  const result = applyPulseDraft(draft, corpusFromCandidateFile(candidateFile), {
    monthLabel: candidateFile.monthLabel,
  });

  // Reported before any verdict: an agent that lost a sentence to the trim
  // should see that it happened even on a run that passes everything else.
  for (const note of result.notes) console.log(`  note: ${note}`);
  if (result.notes.length > 0) console.log("");

  if (result.heroFromEvergreen) {
    console.log(
      "  Hero stat: from the EVERGREEN pool (rotated by month), not from SEEK.\n" +
        "    Correct when the draft wrote heroStat: null or no report was fetched.\n"
    );
  }

  if (result.problems.length > 0) {
    console.log(`  ${result.problems.length} thing(s) the guards refused:`);
    console.log("");
    for (const problem of result.problems) console.log(`    - ${problem}`);
    console.log("");
  }

  if (result.styleIssues.length > 0) {
    console.log("  House style:");
    console.log("");
    printIssuesByItem(result.styleIssues, result.bites);
  }

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          refused: result.pulse === null,
          problems: result.problems,
          styleIssues: result.styleIssues,
          notes: result.notes,
          proposed: result.proposed,
          pulse: result.pulse,
        },
        null,
        2
      )
    );
  }

  if (result.pulse === null) {
    console.error("REFUSED — nothing was written.");
    console.error("");
    console.error(
      "  A refusal is the guard working, not a bug to route around. Fix the copy in\n" +
        `  ${draftFile.replace(/\\/g, "/")} and run this again. Never edit a guard,\n` +
        "  never relax a rule, and never hand-write a number into the issue file: every\n" +
        "  number must appear verbatim in its own candidate's `text`, and every url must\n" +
        "  be copied from the candidate file.\n" +
        "\n" +
        "  Dropping an item you cannot source is always allowed. Two items is a correct\n" +
        "  outcome; a third one you had to reach for is not."
    );
    process.exit(1);
  }

  const editorial = raw.editorial as Record<string, unknown>;
  const before = editorial.pulse;

  console.log("Before:");
  for (const line of describe(before)) console.log(line);
  console.log("");
  console.log("After:");
  for (const line of describe(result.pulse)) console.log(line);

  // The number that decides whether this run was worth committing. A drop from
  // three items to one is not a bug — see the header — but it IS something the
  // operator should see before overwriting a good section with a thin one.
  const wasCount = countOf(before);
  const nowCount = countOf(result.pulse);
  if (nowCount < wasCount) {
    console.log(
      `\n  ! This would REDUCE the news list from ${wasCount} to ${nowCount} item(s).` +
        `\n    Thin sources this month, or you dropped an item you could not source. Check` +
        `\n    before applying — a shorter Pulse is correct, but overwriting a good one` +
        `\n    with a thin one is not.`
    );
  }

  if (result.proposed !== nowCount) {
    console.log(
      `\n  ! You proposed ${result.proposed} item(s) and ${nowCount} are being written.`
    );
  }

  if (!apply) {
    console.log("\nEvery check passed. --apply not given: nothing written.");
    return;
  }

  editorial.pulse = result.pulse;
  // Re-validate the whole issue AFTER the swap, so a malformed pulse cannot be
  // written into a file the renderer will later fail on.
  newsletterIssueSchema.parse(raw);

  // Same shape Step 1 of the skill writes: two-space indent, trailing newline,
  // key order preserved. Anything else makes the next diff unreadable.
  writeFileSync(issuePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${issuePath}`);
  console.log("  Only editorial.pulse changed. Now:");
  console.log(`    npx tsx scripts/newsletter/lint-pulse.ts ${issueId}`);
  console.log(
    `    npx tsx scripts/newsletter/preview.ts lib/data/json/newsletter-issues/${issueId}.json`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
