/**
 * Builds a recipients file for `build-batch.ts` from the subscriber table.
 *
 * This is the bridge that replaces Resend segments. `normalize-recipients.ts`
 * turns a CSV of event registrants into a recipients file; this does the same
 * job for the one list that is not a CSV — the people who asked for the
 * newsletter — and writes the identical shape, so `build-batch.ts` needed no
 * change to be fed from the database.
 *
 * Three things it is careful about:
 *
 * - **Tier 0 is asserted, not assumed.** Only `status = 'subscribed'` rows are
 *   read, and every one of them reached that status by clicking a confirmation
 *   link or by an import with recorded provenance. That is what makes `tier: 0`
 *   an honest claim rather than a convenient one.
 * - **Both suppression registers are applied**, through `selectMailable()`, the
 *   same function `suppression.ts reconcile` uses. The runtime table and the
 *   committed register are consulted; a confirmation later than a suppression
 *   brings someone back, except after a complaint.
 * - **No address is printed, ever.** Counts and truncated hashes only, so the
 *   output can go in a plan block, a PR or Slack. The file it writes does hold
 *   addresses, which is why it lands in `tmp/` — gitignored, and the same place
 *   every other recipients file lives.
 *
 * Usage:
 *   npx tsx scripts/email/recipients-from-db.ts --key <k> [--out-dir tmp/emails]
 *     [--limit <n>] [--only <address>] [--json]
 *
 * Flags:
 *   --key      Names the output `recipients-<key>.json`. Kebab-case.
 *   --out-dir  Defaults to tmp/emails.
 *   --limit    Keep only the first N mailable subscribers. For a ramped first
 *              send; it can only ever narrow the list.
 *   --only     Keep only this one address. The safe way to build a real batch
 *              aimed at a test mailbox — it cannot widen the list either, since
 *              the address still has to be a confirmed subscriber.
 *   --json     Machine-readable summary.
 */

import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { client } from "../../lib/db/drizzle";
import { listOptouts } from "../../lib/email/optouts";
import { listMailableCandidates } from "../../lib/newsletter/subscribers";
import { hashEmail, selectMailable } from "./mailable";

/** How many hashes to show before summarising the rest. */
const PREVIEW = 10;

interface Args {
  key: string;
  outDir: string;
  limit: number | null;
  only: string | null;
  json: boolean;
}

/** Prints an error and exits. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** Reads a flag's value from argv. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

/** Parses and validates the command line. */
function parseArgs(argv: string[]): Args {
  const key = readOption(argv, "--key");
  if (!key) fail("--key is required.", "It names the output file: recipients-<key>.json");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    fail(`--key "${key}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }

  const limitRaw = readOption(argv, "--limit");
  let limit: number | null = null;
  if (limitRaw !== null) {
    limit = Number(limitRaw);
    if (!Number.isInteger(limit) || limit < 1) {
      fail(`--limit must be a positive integer (got "${limitRaw}").`);
    }
  }

  return {
    key,
    outDir: readOption(argv, "--out-dir") ?? "tmp/emails",
    limit,
    only: readOption(argv, "--only"),
    json: argv.includes("--json"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const candidates = await listMailableCandidates();
  const optouts = await listOptouts();
  const { mailable, excluded, returned } = selectMailable(candidates, optouts);

  // --only and --limit are applied AFTER suppression, never before. Filtering
  // first would let a narrow selection hide the fact that the wider list is
  // full of suppressed addresses — the counts printed below would look clean
  // and mean nothing.
  let selected = mailable;
  if (args.only) {
    const wanted = hashEmail(args.only);
    selected = selected.filter((row) => row.emailHash.toLowerCase() === wanted);
    if (selected.length === 0) {
      fail(
        `--only matched no mailable subscriber.`,
        "The address has to be a confirmed subscriber that survived suppression.",
        "This flag can only narrow the list; it cannot add anyone."
      );
    }
  }
  if (args.limit !== null) selected = selected.slice(0, args.limit);

  const output = {
    key: args.key,
    source: "newsletter_subscribers (status = subscribed)",
    tier: 0 as const,
    consentSource:
      "Double opt-in via the website subscribe form, or an import with recorded provenance. " +
      "See newsletter_subscribers.consent_source per row.",
    consentDate: new Date().toISOString().slice(0, 10),
    recipients: selected.map((row) => ({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
    })),
    excluded: excluded.map((row) => ({ reason: row.reason })),
    counts: {
      subscribed: candidates.length,
      suppressed: excluded.length,
      resubscribed: returned.length,
      selected: selected.length,
    },
  };

  mkdirSync(resolve(args.outDir), { recursive: true });
  const outPath = resolve(args.outDir, `recipients-${args.key}.json`);
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  if (args.json) {
    console.log(JSON.stringify({ file: outPath, counts: output.counts }, null, 2));
  } else {
    console.log("");
    console.log(`  Confirmed subscribers      ${candidates.length}`);
    console.log(`  Held back by suppression   ${excluded.length}`);
    if (returned.length > 0) {
      console.log(`  Re-subscribed after a suppression (allowed)  ${returned.length}`);
      for (const row of returned.slice(0, PREVIEW)) {
        console.log(`      ${row.emailHash.slice(0, 12)}…  ${row.reason}`);
      }
      if (returned.length > PREVIEW) {
        console.log(`      … and ${returned.length - PREVIEW} more`);
      }
    }
    if (args.only) console.log(`  Narrowed by --only         1`);
    if (args.limit !== null) console.log(`  Capped by --limit          ${args.limit}`);
    console.log(`  WILL BE MAILED             ${selected.length}`);
    console.log("");
    console.log(`  Written to ${outPath}`);
    console.log("");
    console.log("  Next: build the batch, which runs the pre-send gates.");
    console.log(`    npx tsx scripts/email/build-batch.ts <spec.json> \\`);
    console.log(`      --recipients "${outPath}" --stage <name>`);
    console.log("");
  }

  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
