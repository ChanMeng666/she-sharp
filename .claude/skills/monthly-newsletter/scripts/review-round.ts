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
 * The round comes from two places, deliberately: the NAMES and roles are
 * committed in `lib/email/newsletter-reviewers.ts`, and the ADDRESSES are in
 * `state/reviewers.local.json`, which is gitignored. Most reviewers hold
 * personal off-domain mailboxes and an address in git is permanent, so the
 * addresses stay out of history while the who stays auditable in a diff.
 *
 * The default round is the founder plus the newsletter team. Marketing and
 * events are on the roster with their roles recorded but are NOT on it;
 * `--reviewers` adds anyone for one issue.
 *
 * IT REFUSES RATHER THAN SHRINKS. If a person on the committed roster has no
 * address in the local file, this exits non-zero and names them. A round that
 * quietly left somebody out would look exactly like one that reached everybody,
 * and the person most likely to be missing from a stale local file is the
 * founder — whose approval is the next stage.
 *
 * IT SENDS NOTHING. `scripts/newsletter/send-test.ts` sends; a human runs it.
 * This only decides who, applies the same 25-address ceiling that script
 * enforces at its own line 84, and prints the two commands that follow.
 *
 * Usage (from the repo root):
 *   npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts --issue 2026-08
 *   npx tsx .claude/skills/monthly-newsletter/scripts/review-round.ts --issue 2026-08 \
 *     --reviewers "someone@example.com,another@example.com"
 *
 * Exit codes: 0 when a round was resolved; 1 when it could not be, which is the
 * point — the caller fixes the roster or the local file rather than proceeding
 * without somebody.
 */

import { basename } from "node:path";

import {
  resolveRequestedRound,
  ReviewerAddressError,
  type ResolvedRound,
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
  '    --issue <YYYY-MM> [--reviewers "a@example.com,b@example.com"] [--json]',
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

/** Prints the round and the commands that follow it. */
function report(issue: string, round: ResolvedRound, fromExplicitList: boolean): void {
  const issuePath = `lib/data/json/newsletter-issues/${issue}.json`;
  const list = round.addresses.join(",");

  console.log("");
  console.log(
    `Review round for ${issue} — ${round.peopleCount} person(s), ${round.addresses.length} address(es)`
  );
  console.log("===================================");
  if (round.people.length > 0) {
    for (const { reviewer, addresses } of round.people) {
      console.log(`  ${reviewer.name} (${reviewer.role})`);
      for (const address of addresses) console.log(`      ${address}`);
    }
  } else {
    for (const address of round.addresses) console.log(`  ${address}`);
  }
  console.log("");
  console.log(
    fromExplicitList
      ? "  Source: --reviewers, typed on the command line. If these people belong on every"
      : "  Source: the committed roster in lib/email/newsletter-reviewers.ts, with addresses"
  );
  console.log(
    fromExplicitList
      ? "  issue, add their NAMES to lib/email/newsletter-reviewers.ts and their addresses"
      : "  from state/reviewers.local.json (gitignored — never commit or paste it)."
  );
  if (fromExplicitList) {
    console.log("  to state/reviewers.local.json, which is gitignored.");
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
    "    npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts record-review \\"
  );
  console.log(`      --issue ${issue} --to "${list}" --people ${round.peopleCount}`);
  console.log("");
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (!args.issue || !/^\d{4}-(0[1-9]|1[0-2])$/.test(args.issue)) {
    throw new Error(`--issue must be a YYYY-MM issue id.\n${USAGE}`);
  }

  let round: ResolvedRound;
  try {
    round = resolveRequestedRound(args.reviewers);
  } catch (error) {
    if (error instanceof ReviewerAddressError) {
      console.error("");
      console.error(`Cannot resolve a review round for ${args.issue}.`);
      console.error("");
      console.error(error.message);
      console.error("");
      return 1;
    }
    throw error;
  }

  if (round.addresses.length > MAX_RECIPIENTS) {
    throw new Error(
      `${round.addresses.length} addresses exceeds the cap of ${MAX_RECIPIENTS}. A review ` +
        "round this size is a mailing list — check what was pasted."
    );
  }

  if (args.json) {
    // Addresses are printed here on purpose: the caller asked for the list they
    // are about to send to. Do not pipe this into a file that gets committed.
    console.log(
      JSON.stringify(
        {
          issue: args.issue,
          peopleCount: round.peopleCount,
          addresses: round.addresses,
          source: args.reviewers ? "--reviewers" : "roster",
        },
        null,
        2
      )
    );
    return 0;
  }

  report(args.issue, round, args.reviewers !== null);
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
