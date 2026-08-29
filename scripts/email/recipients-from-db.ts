/**
 * Builds a recipients file for `build-batch.ts` from the subscriber table.
 *
 * This is the bridge that replaces Resend segments. `normalize-recipients.ts`
 * turns a CSV of event registrants into a recipients file; this does the same
 * job for the one list that is not a CSV — the people who asked for the
 * newsletter — and writes the identical shape, so `build-batch.ts` needed no
 * change to be fed from the database.
 *
 * Four things it is careful about:
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
 * - **Narrowing is applied after suppression, and can only remove.** `--only`,
 *   `--restrict-to-hashes` and `--limit` all run against what
 *   `selectMailable()` already returned, in that order, so no selection can
 *   hide a suppressed address behind a smaller number. `--restrict-to-hashes`
 *   is *a send-order filter, never a consent route* — and on this path that is
 *   structurally true rather than merely intended: its input is already
 *   `selectMailable()`'s output, so a hash in the file that is not a mailable
 *   subscriber adds nobody, by construction. There is deliberately no flag that
 *   puts a row in.
 *
 * Usage:
 *   npx tsx scripts/email/recipients-from-db.ts --key <k> [--out-dir tmp/emails]
 *     [--limit <n>] [--only <address>] [--restrict-to-hashes <path>] [--json]
 *
 * Flags:
 *   --key      Names the output `recipients-<key>.json`. Kebab-case.
 *   --out-dir  Defaults to tmp/emails.
 *   --limit    Keep only the first N mailable subscribers. For a ramped first
 *              send; it can only ever narrow the list.
 *   --only     Keep only this one address. The safe way to build a real batch
 *              aimed at a test mailbox — it cannot widen the list either, since
 *              the address still has to be a confirmed subscriber.
 *   --restrict-to-hashes
 *              Path to a JSON file of `hashEmail()` digests, as
 *              `scripts/mailchimp/recent-openers.ts` writes. Keeps only the
 *              subscribers whose hash is in it — which is how a ramp reaches
 *              the WARM cohort rather than whichever rows the query returned
 *              first, which is all `--limit` can offer.
 *   --json     Machine-readable summary.
 */

import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { client } from "../../lib/db/drizzle";
import { listOptouts } from "../../lib/email/optouts";
import { listMailableCandidates } from "../../lib/newsletter/subscribers";
import { hashEmail, selectMailable } from "./mailable";
import {
  loadRestrictHashes,
  narrowByHash,
  RestrictHashesError,
  type RestrictSet,
} from "./restrict-hashes";

/** How many hashes to show before summarising the rest. */
const PREVIEW = 10;

interface Args {
  key: string;
  outDir: string;
  limit: number | null;
  only: string | null;
  restrictToHashes: string | null;
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

  // `readOption()` here returns null when the next token is another flag, which
  // for most flags only means "not given". For this one it would be a silent
  // disarming: `--restrict-to-hashes --json` would drop the cohort on the floor
  // and build a batch for every mailable subscriber. Caught, not trusted.
  const restrictToHashes = readOption(argv, "--restrict-to-hashes");
  if (argv.includes("--restrict-to-hashes") && restrictToHashes === null) {
    fail(
      "--restrict-to-hashes needs a file path.",
      "Given without one it would narrow nothing, silently, and build a batch",
      "for every mailable subscriber."
    );
  }

  return {
    key,
    outDir: readOption(argv, "--out-dir") ?? "tmp/emails",
    limit,
    only: readOption(argv, "--only"),
    restrictToHashes,
    json: argv.includes("--json"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Read before the database is touched, so a mistyped path costs milliseconds
  // rather than a Neon round trip. It is APPLIED further down, after
  // suppression.
  let restrict: RestrictSet | null = null;
  if (args.restrictToHashes) {
    try {
      restrict = loadRestrictHashes(args.restrictToHashes);
    } catch (error) {
      if (error instanceof RestrictHashesError) {
        const [message, ...details] = error.lines;
        fail(message, ...details);
      }
      throw error;
    }
  }

  const candidates = await listMailableCandidates();
  const optouts = await listOptouts();
  const { mailable, excluded, returned } = selectMailable(candidates, optouts);

  // --only, --restrict-to-hashes and --limit are applied AFTER suppression,
  // never before. Filtering first would let a narrow selection hide the fact
  // that the wider list is full of suppressed addresses — the counts printed
  // below would look clean and mean nothing.
  let selected = mailable;
  let restricted: typeof mailable = [];
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
  // After --only, so a cohort file can never widen a single-address test send
  // back out. Before --limit, so `--limit 50` means the first 50 of the WARM
  // cohort — the other order takes the first 50 rows and then intersects them,
  // and the count that comes out is nobody's intention.
  if (restrict) {
    const split = narrowByHash(selected, restrict);
    selected = split.kept;
    restricted = split.dropped;
    if (selected.length === 0) {
      fail(
        `--restrict-to-hashes matched no mailable subscriber.`,
        "Every hash in it has to belong to a confirmed subscriber that survived",
        "suppression.",
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
    /**
     * The narrowing filter this run applied, for audit. Same key and shape as
     * `normalize-recipients.ts` writes, so a later reader can explain why 1,545
     * rows became 412 without first having to work out which producer built the
     * file.
     */
    restrictedTo: restrict ? { path: restrict.path, hashes: restrict.hashes.size } : null,
    excluded: [
      ...excluded.map((row) => ({ reason: row.reason })),
      // The same reason string the CSV path uses, so `build-newsletter-batch.ts`
      // — which groups `excluded` by reason — reports the narrowing in the send
      // preflight without having to know two spellings of it.
      ...restricted.map(() => ({ reason: "outside the restrict-to-hashes cohort" })),
    ],
    counts: {
      subscribed: candidates.length,
      // Suppression only. The cohort filter gets a line of its own: folding the
      // two together would make the suppression number lie about who was
      // refused a send, which is the one number here nobody may misread.
      suppressed: excluded.length,
      restricted: restricted.length,
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
    if (restrict) {
      console.log(`  Outside the warm cohort    ${restricted.length}`);
      console.log(
        `  Cohort file                ${restrict.hashes.size} hash(es) — send-order filter, not a consent source`
      );
      console.log(`                             ${restrict.path}`);
    }
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
