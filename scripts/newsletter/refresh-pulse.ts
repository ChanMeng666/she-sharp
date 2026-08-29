/**
 * Rebuilds ONLY the `editorial.pulse` block of one newsletter issue.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Pulse is the one part of `editorial` that is machine-produced. Everything
 * else in that block — the founder's note, the subject line, the photo choices —
 * is written by a person and must never be regenerated. But until this script
 * there was exactly one way to get fresh Pulse data: re-run the whole draft
 * generator, which rewrites `editorial` wholesale and takes the founder's note
 * with it. So in practice nobody refreshed the Pulse, and a stale section was
 * cheaper than the risk.
 *
 * That is the wrong trade for the section whose entire job is to be current.
 * This script reads the issue, replaces `editorial.pulse` and nothing else, and
 * writes the file back in the same shape. The `auto` block is untouched too —
 * that is the photo and event snapshot, and it has its own pipeline.
 *
 * It is also the only way to refresh a *deployed* issue's Pulse without a
 * deploy: `buildPulse()` runs here, against the live sources, on a laptop.
 *
 * WHAT IT CANNOT DO
 * -----------------
 * It cannot invent a news item. `buildPulse()` drops any item whose URL was not
 * fetched or whose numbers are not verbatim in the source, so a month with thin
 * sources produces fewer items — see `.claude/skills/monthly-newsletter/SKILL.md`,
 * which states the honest fill rate. **A short Pulse is a correct Pulse.** If
 * this script returns one item, the answer is not to write a second one by hand
 * unless you can source it yourself to the same standard.
 *
 * Dry run by default, because it overwrites a committed file: `--apply` must be
 * spelled out. The diff is printed either way, so the normal loop is to run it,
 * read what would change, then re-run with `--apply`.
 *
 * Usage:
 *   npx tsx scripts/newsletter/refresh-pulse.ts 2026-08            # dry run
 *   npx tsx scripts/newsletter/refresh-pulse.ts 2026-08 --apply
 *   npx tsx scripts/newsletter/refresh-pulse.ts 2026-08 --json
 */

import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildPulse, fetchPulseSources } from "../../lib/newsletter/pulse";
import { newsletterIssueSchema } from "../../lib/newsletter/schema";

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");

/** `YYYY-MM`, the id every issue file is named after. */
const ISSUE_ID = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Prints an error and exits, in the house shape. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** "August 2026" from "2026-08" — the label `buildPulse` frames copy with. */
function monthLabel(issueId: string): string {
  const [year, month] = issueId.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const issueId = argv.find((arg) => !arg.startsWith("--"));
  const apply = argv.includes("--apply");
  const asJson = argv.includes("--json");

  if (!issueId || !ISSUE_ID.test(issueId)) {
    fail(
      "An issue id is required, as YYYY-MM.",
      "Usage: npx tsx scripts/newsletter/refresh-pulse.ts 2026-08 [--apply] [--json]"
    );
  }

  const path = join(ISSUE_DIR, `${issueId}.json`);
  if (!existsSync(path)) fail(`No issue file at ${path}.`);

  // Parsed rather than spread blindly: if the file on disk is already invalid,
  // that is worth knowing before this script writes to it.
  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  newsletterIssueSchema.parse(raw);

  console.log(`Refreshing the Pulse for ${issueId} (${monthLabel(issueId)})`);
  console.log("  Fetching live sources…");

  const sources = await fetchPulseSources();
  console.log(
    `  SEEK report: ${sources.seekArticle ? "found" : "not found"}` +
      `   news items fetched: ${sources.newsItems.length}`
  );

  const pulse = await buildPulse(sources, { monthLabel: monthLabel(issueId) });

  const editorial = raw.editorial as Record<string, unknown>;
  const before = editorial.pulse;

  console.log("\nBefore:");
  for (const line of describe(before)) console.log(line);
  console.log("\nAfter:");
  for (const line of describe(pulse)) console.log(line);

  // The number that decides whether this run was worth committing. A drop from
  // three items to one is not a bug — see the header — but it IS something the
  // operator should see before overwriting a good section with a thin one.
  const countOf = (p: unknown) => {
    const q = p as { newsBites?: unknown[]; newsBite?: unknown } | null;
    return q?.newsBites?.length ?? (q?.newsBite ? 1 : 0);
  };
  const wasCount = countOf(before);
  const nowCount = countOf(pulse);
  if (nowCount < wasCount) {
    console.log(
      `\n  ! This would REDUCE the news list from ${wasCount} to ${nowCount} item(s).` +
        `\n    Thin sources this month, or a source stopped resolving. Check before applying —` +
        `\n    a shorter Pulse is correct, but overwriting a good one with a thin one is not.`
    );
  }

  if (asJson) console.log(JSON.stringify(pulse, null, 2));

  if (!apply) {
    console.log("\n--apply not given: nothing written.");
    return;
  }

  editorial.pulse = pulse;
  // Re-validate the whole issue AFTER the swap, so a malformed pulse cannot be
  // written into a file the renderer will later fail on.
  newsletterIssueSchema.parse(raw);

  // Same shape Step 1 of the skill writes: two-space indent, trailing newline,
  // key order preserved. Anything else makes the next diff unreadable.
  writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${path}`);
  console.log("  Only editorial.pulse changed. Re-render to check: ");
  console.log(`    npx tsx scripts/newsletter/preview.ts lib/data/json/newsletter-issues/${issueId}.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
