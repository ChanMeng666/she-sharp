/**
 * NZ Tech Pulse house-style checker — the report a curator can act on.
 *
 * Usage:
 *   npx tsx scripts/newsletter/lint-pulse.ts                # every issue on disk
 *   npx tsx scripts/newsletter/lint-pulse.ts 2026-08        # one issue
 *   npx tsx scripts/newsletter/lint-pulse.ts --preflight    # what a run will use
 *
 * WHY THIS EXISTS
 * ---------------
 * The CLI half of `lib/newsletter/pulse-copy.ts`, and the exact counterpart of
 * `scripts/deck/lint-deck.ts`. `pulse-apply.ts` already checks the agent's draft
 * and refuses on any error, but the Pulse is then CURATED BY HAND — items get
 * deleted, headlines get rewritten — and a hand-written headline breaks the house
 * style just as easily as a written-by-agent one. Nothing checks the file on disk
 * after that edit except this.
 *
 * It is what makes the standard mechanical rather than a matter of whose taste
 * happened to run the skill. Run it after Step 4a's curation, and again before
 * the issue ships.
 *
 * Exit 1 when anything must be fixed; exit 0 when only advisories remain.
 */

import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { pulsePreflightLines } from "../../lib/newsletter/pulse";
import {
  lintPulseCopy,
  sourceTitleFromUrl,
  type PulseCopyIssue,
} from "../../lib/newsletter/pulse-copy";
import { printIssue } from "./pulse-report";

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");
const ISSUE_ID = /^\d{4}-(0[1-9]|1[0-2])$/;

interface IssuePulse {
  heroStat?: { value?: string; label: string; context: string } | null;
  newsBites?: { title: string; summary: string; url: string; sourceLabel?: string }[] | null;
  newsBite?: { title: string; summary: string; url: string; sourceLabel?: string } | null;
}

/** Checks one issue file and prints its report. Returns the must-fix count. */
function reportIssue(issueId: string): number {
  const path = join(ISSUE_DIR, `${issueId}.json`);
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    editorial?: { pulse?: IssuePulse | null };
  };
  const pulse = raw.editorial?.pulse ?? null;

  console.log("");
  console.log(`${issueId}`);

  if (!pulse) {
    console.log("  No pulse section in this issue — nothing to check.");
    return 0;
  }

  // The legacy single-bite key still exists on issues generated before the array
  // did, and it renders. Check whichever one this file actually uses.
  const bites = pulse.newsBites?.length
    ? pulse.newsBites
    : pulse.newsBite
      ? [pulse.newsBite]
      : [];

  console.log(
    `  heroStat: ${pulse.heroStat ? `${pulse.heroStat.value ?? "—"} ${pulse.heroStat.label}` : "(none)"}`
  );
  console.log(`  newsBites: ${bites.length}`);

  /*
   * An issue fixture stores the item's title, summary, source label and URL —
   * NOT the publisher's own headline. So the load-bearing rule ("this headline
   * is theirs, not ours") has nothing to compare against unless it recovers one.
   * `sourceTitleFromUrl` reads it from the article slug, which every publisher
   * in this pipeline uses, and returns null rather than guessing when it cannot.
   * Say which items it could and could not check, because a rule that silently
   * did not run reads exactly like a rule that passed.
   */
  const unchecked = bites.filter((bite) => !sourceTitleFromUrl(bite.url));
  if (unchecked.length > 0) {
    console.log(
      `  ! ${unchecked.length} item(s) have no title slug in their URL, so the ` +
        `"is this the publisher's headline?" check could not run on them.`
    );
  }

  const issues = lintPulseCopy({ heroStat: pulse.heroStat, newsBites: bites });
  console.log("");

  if (issues.length === 0) {
    console.log("  Nothing to fix. This Pulse is in house voice.");
    return 0;
  }

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

  const errors = issues.filter((entry) => entry.severity === "error").length;
  console.log(`  ${errors} must fix, ${issues.length - errors} to look at.`);
  return errors;
}

function main(): void {
  const argv = process.argv.slice(2);

  if (argv.includes("--preflight")) {
    console.log("NZ Tech Pulse — who writes it, and what a candidate run will read");
    console.log("");
    for (const line of pulsePreflightLines()) console.log(line);
    console.log("");
    return;
  }

  const requested = argv.filter((arg) => !arg.startsWith("--"));
  for (const id of requested) {
    if (!ISSUE_ID.test(id)) {
      console.error(`Error: "${id}" is not an issue id. Use YYYY-MM, e.g. 2026-08.`);
      process.exit(1);
    }
  }

  const ids = requested.length
    ? requested
    : readdirSync(ISSUE_DIR)
        .filter((name) => name.endsWith(".json"))
        .map((name) => name.replace(/\.json$/, ""))
        .filter((name) => ISSUE_ID.test(name))
        .sort();

  console.log("She Sharp — NZ Tech Pulse house-style check");
  const total = ids.reduce((count, id) => count + reportIssue(id), 0);
  console.log("");

  if (total > 0) {
    console.log(
      `${total} thing${total === 1 ? "" : "s"} must be fixed before this section is in house voice.`
    );
    console.log(
      "The rules and where each one came from: lib/newsletter/pulse-copy.ts"
    );
    process.exit(1);
  }

  console.log("All checks passed.");
}

main();
