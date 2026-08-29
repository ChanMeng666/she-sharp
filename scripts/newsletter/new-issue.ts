/**
 * Starts one month's newsletter issue on this machine.
 *
 *   npx tsx scripts/newsletter/new-issue.ts 2026-09 [--force]
 *
 * Writes `lib/data/json/newsletter-issues/<id>.json` from `assembleAutoData()`
 * (the machine snapshot of events + stats) plus `emptyEditorialStub()` (the
 * empty, schema-valid shape of the human-owned copy). That is Step 1 of the
 * `/monthly-newsletter` skill.
 *
 * **It needs no API key and no `CRON_SECRET`.** No OpenAI call, no Redis, no
 * HTTP request to production — after the cloud drafting step was deleted, a
 * developer can start a month's newsletter with nothing but a clone of this
 * repo. The month's first diff is therefore a human giving the issue a voice,
 * not a human rewriting a machine's guess at one, which is what actually
 * happened every month the cron ran.
 *
 * It **refuses to overwrite an existing issue** unless `--force`. That guard is
 * inherited from the cron it replaces, and it matters more here: the file it
 * would clobber is one a human has been editing all month.
 *
 * Output shape is two-space-indented JSON with a trailing newline, matching the
 * pretty-print the skill used to run by hand after pulling the staged draft, so
 * the diffs stay readable.
 */

import "dotenv/config";

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assembleAutoData } from "../../lib/newsletter/assemble";
import { emptyEditorialStub } from "../../lib/newsletter/editorial-stub";
import {
  issueIdSchema,
  newsletterIssueSchema,
  type NewsletterIssueData,
} from "../../lib/newsletter/schema";

const ISSUES_DIR = path.resolve(process.cwd(), "lib/data/json/newsletter-issues");

/** Prints usage and exits non-zero. */
function usage(message: string): never {
  console.error(`error: ${message}\n`);
  console.error("usage: npx tsx scripts/newsletter/new-issue.ts <YYYY-MM> [--force]\n");
  console.error("  <YYYY-MM>   the issue month, e.g. 2026-09");
  console.error("  --force     overwrite an existing issue file (destroys hand edits)");
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const positional = args.filter((a) => !a.startsWith("--"));

  const unknown = args.filter((a) => a.startsWith("--") && a !== "--force");
  if (unknown.length > 0) usage(`unknown flag(s): ${unknown.join(", ")}`);
  if (positional.length !== 1) usage("expected exactly one issue id, e.g. 2026-09");

  const issueId = positional[0];
  if (!issueIdSchema.safeParse(issueId).success) {
    usage(`invalid issue id: ${issueId} (expected "YYYY-MM")`);
  }

  const [year, month] = issueId.split("-").map(Number);
  const outPath = path.join(ISSUES_DIR, `${issueId}.json`);

  const existed = existsSync(outPath);
  if (existed && !force) {
    console.error(`error: ${path.relative(process.cwd(), outPath)} already exists.\n`);
    console.error(
      "Refusing to overwrite — this file is edited by hand all month. Re-run with\n" +
        "--force only if you genuinely mean to start the issue over."
    );
    process.exit(1);
  }

  const auto = assembleAutoData(year, month);
  const issue: NewsletterIssueData = newsletterIssueSchema.parse({
    id: issueId,
    meta: {
      status: "draft",
      generatedAt: new Date().toISOString(),
      broadcastId: null,
      scheduledAt: null,
    },
    editorial: emptyEditorialStub(auto, month - 1),
    auto,
  });

  mkdirSync(ISSUES_DIR, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(issue, null, 2)}\n`, "utf8");

  const relative = path.relative(process.cwd(), outPath).replace(/\\/g, "/");
  console.log(`Wrote ${relative}${existed ? " (overwritten with --force)" : ""}`);
  console.log(
    `  ${auto.recapEvents.length} recap event(s), ${auto.upcomingEvents.length} upcoming, ` +
      `${auto.photoStrip.length} photo(s) in the strip`
  );
  console.log("\nNext:");
  console.log(`  1. Register it in lib/newsletter/issues-registry.ts (Step 2).`);
  console.log(`  2. Curate the photos:  npx tsx scripts/newsletter/photos.ts ${relative}`);
  console.log(`  3. Write the editorial block by hand (Step 4) — the stub is a shape, not copy.`);
}

main();
