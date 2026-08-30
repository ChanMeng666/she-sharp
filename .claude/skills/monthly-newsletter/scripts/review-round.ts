/**
 * Resolves who gets stage 2 of a newsletter issue's approval chain, and prints
 * the exact commands to send it and record it.
 *
 * WHY THIS IS A SCRIPT AND NOT A SENTENCE IN THE SKILL. Until 2026-08-30 the
 * review round was described in prose: "a named reviewer list supplied by the
 * founder". Prose cannot be diffed, cannot be cross-checked against the
 * mailboxes that exist, and cannot refuse. The result was that the only address
 * anywhere in the loop was the developer's personal Gmail, hardcoded as "the
 * single approved test mailbox" in a skill run by the newsletter department.
 *
 * This resolves the round from `lib/email/newsletter-reviewers.ts` — the typed
 * roster, cross-checked by `newsletter-reviewers.test.ts` against the delivery
 * probe, so a reviewer whose mailbox does not exist fails a test rather than
 * silently hard-bouncing. While that roster names only the founder it REFUSES
 * to stand in for a round, and this script exits non-zero: a round of one
 * person is not a joint review, and shrinking to one silently is exactly the
 * failure mode this repository has recorded twice.
 *
 * IT SENDS NOTHING. `scripts/newsletter/send-test.ts` sends; a human runs it.
 * This only decides who, applies the same 25-address ceiling that script
 * enforces at its own line 84, and prints the two commands that follow.
 *
 * Usage (from the repo root):
 *   npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts \
 *     --issue 2026-08 --reviewers "first@shesharp.org.nz,second@shesharp.org.nz"
 *
 * Exit codes: 0 when a round was resolved; 1 when it could not be, which is the
 * point — the caller has to name the reviewers rather than proceed without them.
 */

import { basename } from "node:path";

import {
  requireReviewRoundRecipients,
  RosterIncompleteError,
  rosterIsComplete,
} from "../../../../lib/email/newsletter-reviewers";

/**
 * The same ceiling `send-test.ts` enforces (its `MAX_RECIPIENTS`).
 *
 * Duplicated deliberately rather than imported: this script must refuse a
 * mis-pasted roster BEFORE anyone runs the sender, and the sender must keep
 * refusing it whether or not this script was used. Two independent checks of
 * the same number is the intent; if they ever disagree the lower one wins,
 * because both are upper bounds.
 */
const MAX_RECIPIENTS = 25;

const USAGE = [
  "Usage:",
  "  npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts \\",
  '    --issue <YYYY-MM> [--reviewers "a@shesharp.org.nz,b@shesharp.org.nz"] [--json]',
].join("\n");

interface Args {
  issue: string | null;
  reviewers: string[] | null;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { issue: null, reviewers: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = (): string => {
      const raw = argv[++i];
      if (raw === undefined || raw.startsWith("--")) {
        throw new Error(`${flag} requires a value.\n${USAGE}`);
      }
      return raw;
    };
    switch (flag) {
      case "--issue":
        args.issue = value();
        break;
      case "--reviewers":
        args.reviewers = value().split(",");
        break;
      case "--json":
        args.json = true;
        break;
      default:
        throw new Error(`Unknown flag: ${flag}\n${USAGE}`);
    }
  }
  return args;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (!args.issue || !/^\d{4}-(0[1-9]|1[0-2])$/.test(args.issue)) {
    throw new Error(`--issue must be a YYYY-MM issue id.\n${USAGE}`);
  }

  let recipients: string[];
  try {
    recipients = requireReviewRoundRecipients(args.reviewers);
  } catch (error) {
    if (error instanceof RosterIncompleteError) {
      console.error("");
      console.error(`Cannot resolve a review round for ${args.issue}.`);
      console.error("");
      console.error(error.message);
      console.error("");
      return 1;
    }
    throw error;
  }

  if (recipients.length > MAX_RECIPIENTS) {
    throw new Error(
      `${recipients.length} reviewers exceeds the cap of ${MAX_RECIPIENTS}. A review ` +
        "round this size is a mailing list — check what was pasted."
    );
  }

  const issuePath = `lib/data/json/newsletter-issues/${args.issue}.json`;
  const list = recipients.join(",");

  if (args.json) {
    console.log(JSON.stringify({ issue: args.issue, recipients, source: args.reviewers ? "--reviewers" : "roster" }, null, 2));
    return 0;
  }

  console.log("");
  console.log(`Review round for ${args.issue} — ${recipients.length} reviewer(s)`);
  console.log("===================================");
  for (const r of recipients) console.log(`  ${r}`);
  console.log("");
  console.log(
    args.reviewers
      ? "  Source: --reviewers, supplied on the command line. Add these people to"
      : "  Source: the roster in lib/email/newsletter-reviewers.ts."
  );
  if (args.reviewers && !rosterIsComplete()) {
    console.log("  NEWSLETTER_REVIEWERS so the next issue does not have to be told again.");
  }
  console.log("");
  console.log("  Dry run first, and read the parsed list back:");
  console.log(`    npx tsx scripts/newsletter/send-test.ts ${issuePath} "${list}" --dry-run`);
  console.log("");
  console.log("  Then send — one email per address, so reviewers never see each other:");
  console.log(`    npx tsx scripts/newsletter/send-test.ts ${issuePath} "${list}"`);
  console.log("");
  console.log("  Then record stage 2, so the founder's approval has something to follow:");
  console.log(
    `    npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-review \\`
  );
  console.log(`      --issue ${args.issue} --to "${list}"`);
  console.log("");
  return 0;
}

if (basename(process.argv[1] ?? "") === "review-round.ts") {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
