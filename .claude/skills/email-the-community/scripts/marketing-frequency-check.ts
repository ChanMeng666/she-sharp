/**
 * The month's marketing-send cap, asked from THIS skill's side.
 *
 * WHAT THE NUMBER IS. Marketing campaigns **this repository has recorded** for
 * the current NZ month — not the number the subscriber list received. Mailchimp
 * went on sending event campaigns after it stopped sending the newsletter on
 * 2026-08-31, and leaves no trace in these ledgers, so every
 * command here prints `BLIND_SPOT_NOTICE` beside its figure. In August 2026
 * this check would have said 0/3 for a month in which the list took five
 * marketing emails. The notice is meant to be deleted; the condition is in it.
 *
 * WHY THIS EXISTS. `marketing-frequency.ts` (in `/monthly-newsletter`) already
 * counts every marketing campaign across every skill, and the newsletter's own
 * `issue-ledger.ts check` refuses on it. But the cap was one-directional: only
 * the newsletter consulted it. `/email-the-community` — and therefore
 * `/promote-event`, which hands over into it — could still originate the fourth
 * send of a month without anything noticing. A multi-stage event promotion makes
 * that the likely case rather than the unlikely one: three campaign stages plus
 * a monthly newsletter is four emails to the same ~1,549 people.
 *
 * The reason is not politeness. The Resend account complaint ceiling is
 * **0.08%** — about 1.25 complaints on a full send — and the account is shared,
 * so breaching it takes password resets and donation receipts down with the
 * marketing mail (`docs/deployment/EMAIL_AUTHENTICATION.md`). Frequency is the
 * main driver of complaints. So this refuses rather than warns, and it exits
 * NON-ZERO so Step 7.2 can be written `check && build` and cannot be skipped by
 * an operator who read past a warning.
 *
 * WHAT IT READS, ALL READ-ONLY:
 *   - `state/broadcasts.json` — this skill's own ledger, via `readCommunitySends`.
 *   - `../monthly-newsletter/state/issues.json` — the newsletter's ledger,
 *     parsed here rather than imported, so that a missing or damaged newsletter
 *     state file cannot stop an announcement. `issue-ledger.ts` throws on a
 *     corrupt file, which is right for its own gate and wrong for this one.
 *   - `state/frequency-overrides.json` — this skill's record of the times a
 *     human decided to send past the cap, and why.
 *
 * NOTHING HERE SENDS EMAIL, and nothing here writes to either ledger.
 *
 * Usage:
 *   marketing-frequency-check.ts check --key <k> [--json]
 *   marketing-frequency-check.ts override --key <k> --reason "<why>" [--by <name>]
 *   marketing-frequency-check.ts show [--json]
 *
 * Exit codes:
 *   0 within the cap as recorded here (or a recorded override covers it)
 *   1 bad arguments
 *   2 the cap would be exceeded and no override is on record
 *
 * Exit 0 is "nothing in these ledgers objects", not "the list has had a quiet
 * month". No network call, no env var, no dependency: this is a pre-send gate
 * and it must give the same answer offline as on.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessFrequency,
  BLIND_SPOT_NOTICE,
  COUNT_LABEL,
  currentNzMonth,
  DEFAULT_MONTHLY_CAP,
  nzCalendarMonth,
  readCommunitySends,
  type MarketingSend,
} from "../../monthly-newsletter/scripts/marketing-frequency";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** …/.claude/skills/email-the-community */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");

/** The newsletter skill's ledger, read where it lives. */
export const NEWSLETTER_LEDGER_PATH = resolve(
  SKILL_ROOT,
  "..",
  "monthly-newsletter",
  "state",
  "issues.json"
);

/** Where this skill records a decision to send past the cap. */
export const OVERRIDES_PATH = resolve(SKILL_ROOT, "state", "frequency-overrides.json");

/**
 * Shortest reason this gate will accept.
 *
 * An override with no reason is the failure this whole feature would otherwise
 * add: a flag that turns the cap off is not a control, it is a switch. Twenty
 * characters does not make a reason good, but it does make "ok" and "-" fail,
 * and it forces the operator to write a sentence somebody can read back in a
 * month and judge.
 */
export const MIN_REASON_LENGTH = 20;

// ---------------------------------------------------------------------------
// The newsletter's sends
// ---------------------------------------------------------------------------

/**
 * The newsletter issues that have touched inboxes, read defensively.
 *
 * Deliberately NOT `import { newsletterSends } from "…/issue-ledger"`: that
 * module's `loadLedger` throws on a corrupt file, which is the right choice for
 * the gate in front of the newsletter's own send and the wrong one here. An
 * announcement must stay buildable when the other skill's state file is absent
 * or damaged; the cost is under-counting, which `check` reports out loud, and
 * the alternative cost is a skill that cannot run because a file it does not
 * own is broken.
 *
 * The counting rule matches `newsletterSends()` exactly: a ramped send is ONE
 * campaign, dated at its first chunk, because the cap is about how often a
 * person's inbox is touched and a ramp touches each inbox once.
 *
 * @param path Override only in tests.
 * @returns One {@link MarketingSend} per issue with at least one batch recorded.
 */
export function readNewsletterSends(
  path: string = NEWSLETTER_LEDGER_PATH
): MarketingSend[] {
  if (!existsSync(path)) return [];

  let issues: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    const raw =
      parsed && typeof parsed === "object" && "issues" in parsed
        ? (parsed as { issues?: unknown }).issues
        : null;
    if (!raw || typeof raw !== "object") return [];
    issues = raw as Record<string, unknown>;
  } catch {
    return [];
  }

  const sends: MarketingSend[] = [];
  for (const [issueId, value] of Object.entries(issues)) {
    if (!value || typeof value !== "object") continue;
    const batches = (value as { batches?: unknown }).batches;
    if (!Array.isArray(batches) || batches.length === 0) continue;

    const times = batches
      .map((batch) =>
        batch && typeof batch === "object" ? (batch as { at?: unknown }).at : null
      )
      .filter((at): at is string => typeof at === "string" && at.length > 0)
      .sort((a, b) => a.localeCompare(b));
    if (times.length === 0) continue;

    sends.push({
      source: "monthly-newsletter",
      key: issueId,
      at: times[0],
      month: nzCalendarMonth(times[0]),
      what: `newsletter issue ${issueId} (${batches.length} chunk(s) recorded)`,
    });
  }
  return sends;
}

/** Every marketing send both skills know about. */
export function allSends(
  communityPath?: string,
  newsletterPath?: string
): MarketingSend[] {
  return [...readCommunitySends(communityPath), ...readNewsletterSends(newsletterPath)];
}

// ---------------------------------------------------------------------------
// Overrides
// ---------------------------------------------------------------------------

/** One recorded decision to send past the month's cap. */
export interface OverrideRecord {
  at: string;
  /** The NZ month it covers. An override never outlives its month. */
  month: string;
  /** The broadcast key it was taken for. It covers that campaign and no other. */
  key: string;
  reason: string;
  by: string;
  /** What the count was when the decision was taken, so it can be judged later. */
  observedCount: number;
  cap: number;
}

export interface OverrideFile {
  version: number;
  overrides: OverrideRecord[];
}

const EMPTY_OVERRIDES: OverrideFile = { version: 1, overrides: [] };

/** Reads the override record, tolerating a missing or corrupt file as empty. */
export function loadOverrides(path: string = OVERRIDES_PATH): OverrideFile {
  if (!existsSync(path)) return structuredClone(EMPTY_OVERRIDES);
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<OverrideFile>;
    return {
      version: parsed.version ?? 1,
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : [],
    };
  } catch {
    return structuredClone(EMPTY_OVERRIDES);
  }
}

/** Writes the override record atomically. */
export function saveOverrides(file: OverrideFile, path: string = OVERRIDES_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  renameSync(tmp, path);
}

/**
 * The override that covers one campaign in one month, if any.
 *
 * Scoped to BOTH, on purpose. A month-wide exemption would make the fifth send
 * as free as the fourth, and a key-only one would never expire. Matching on the
 * pair means a decision taken for this campaign, in this month, and nothing
 * else — the next one is argued again.
 */
export function findOverride(
  file: OverrideFile,
  key: string,
  month: string
): OverrideRecord | null {
  return (
    file.overrides.find((entry) => entry.key === key && entry.month === month) ?? null
  );
}

/** Rejects a reason that would not tell anyone anything in a month's time. */
export function validateReason(raw: string | null): string | null {
  const reason = (raw ?? "").trim();
  if (reason.length === 0) return "an override needs --reason: say why, in a sentence.";
  if (reason.length < MIN_REASON_LENGTH) {
    return (
      `--reason is ${reason.length} characters; at least ${MIN_REASON_LENGTH} are ` +
      "needed. Write what makes this month's extra send worth the complaint risk, " +
      "not a word that gets past the check."
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type Command = "check" | "override" | "show";

interface Args {
  command: Command;
  key: string | null;
  reason: string | null;
  by: string | null;
  json: boolean;
}

const USAGE = [
  "Usage:",
  "  marketing-frequency-check.ts check --key <broadcast-key> [--json]",
  '  marketing-frequency-check.ts override --key <broadcast-key> --reason "<why>" [--by <name>]',
  "  marketing-frequency-check.ts show [--json]",
  "",
  "Exit codes: 0 within the cap · 1 bad arguments · 2 the cap would be exceeded.",
].join("\n");

/** Parses argv into a fully defaulted {@link Args}. */
function parseArgs(argv: string[]): Args {
  const first = argv[0];
  if (first !== "check" && first !== "override" && first !== "show") {
    throw new Error(`Unknown command: ${first ?? "(none)"}\n${USAGE}`);
  }

  const args: Args = { command: first, key: null, reason: null, by: null, json: false };
  const value = (flag: string, index: number): string => {
    const raw = argv[index];
    if (raw === undefined || raw.startsWith("--")) {
      throw new Error(`${flag} requires a value.\n${USAGE}`);
    }
    return raw;
  };

  for (let i = 1; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--key":
        args.key = value("--key", ++i);
        break;
      case "--reason":
        args.reason = value("--reason", ++i);
        break;
      case "--by":
        args.by = value("--by", ++i);
        break;
      case "--json":
        args.json = true;
        break;
      default:
        throw new Error(`Unknown flag: ${argv[i]}\n${USAGE}`);
    }
  }
  return args;
}

/** Renders one send as an aligned line. */
function formatSend(send: MarketingSend): string {
  return `    ${send.at}  ${send.source.padEnd(20)}${send.key} — ${send.what}`;
}

/**
 * Prints what the count above could not see.
 *
 * Called by every command that shows a figure, and unconditionally: a caveat
 * that only appears when somebody thought it was needed is one that is missing
 * on the day it mattered.
 */
function printBlindSpots(): void {
  console.log("");
  for (const line of BLIND_SPOT_NOTICE) console.log(line);
}

/** `check` — the gate Step 7.2 runs. */
function runCheck(args: Args): number {
  if (!args.key) throw new Error(`check needs --key.\n${USAGE}`);
  const key = args.key;
  const month = currentNzMonth();
  const cap = DEFAULT_MONTHLY_CAP;
  // The campaign in hand is excluded so a resumed build — a second chunk, a
  // re-render after a fix — does not count itself as a competing campaign.
  const verdict = assessFrequency(allSends(), month, cap, {
    source: "email-the-community",
    key,
  });
  const override = findOverride(loadOverrides(), key, month);
  const covered = verdict.exceeded && override !== null;

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          key,
          month,
          cap,
          // Named so a consumer of the JSON cannot read `existing` as the
          // number of marketing emails the list actually received.
          counts: COUNT_LABEL,
          existing: verdict.existing,
          exceeded: verdict.exceeded,
          blindSpots: verdict.blindSpots,
          override,
          verdict: !verdict.exceeded ? "within-cap" : covered ? "override" : "refused",
        },
        null,
        2
      )
    );
    return verdict.exceeded && !covered ? 2 : 0;
  }

  console.log("");
  console.log(`Marketing frequency — ${month} (NZ), ${COUNT_LABEL}`);
  console.log("===================================");
  console.log(`  key    ${key}`);
  console.log(`  cap    ${cap} marketing send(s) per calendar month, to the subscriber list`);
  console.log(
    `  so far ${verdict.existing.length} — ${COUNT_LABEL}, across every skill in it`
  );
  for (const send of verdict.existing) console.log(formatSend(send));
  console.log("===================================");

  if (!verdict.exceeded) {
    console.log("");
    console.log(
      `within cap — this would be send ${verdict.existing.length + 1} of ${cap}, by what is ${COUNT_LABEL}.`
    );
    printBlindSpots();
    console.log("");
    return 0;
  }

  if (covered && override) {
    console.log("");
    console.log(`OVERRIDE ON RECORD — proceeding past the cap.`);
    console.log(`    recorded ${override.at} by ${override.by}`);
    console.log(`    reason   ${override.reason}`);
    console.log("");
    console.log("Read that reason back to the user in the Step 6 plan block. They are");
    console.log("approving an extra email to people who did not ask for a fourth.");
    printBlindSpots();
    console.log("");
    return 0;
  }

  console.log("");
  console.log(`REFUSED: this would be marketing send ${verdict.existing.length + 1} of a`);
  console.log(`cap of ${cap} for ${month} — counting every skill in this repo, and`);
  console.log(`nothing sent from outside it.`);
  console.log("");
  console.log("The cap is a deliverability control, not a style rule. The Resend account");
  console.log("complaint ceiling is 0.08% — about 1.25 complaints on a full send — and the");
  console.log("account is shared, so breaching it takes password resets and donation");
  console.log("receipts down with the marketing mail. Frequency is what drives complaints.");
  console.log("");
  console.log("Your options, in the order to try them:");
  console.log("  1. Send it next month. Nothing is lost; an announcement is rarely a day late.");
  console.log("  2. Fold it into the monthly newsletter, which is already going out.");
  console.log("  3. If it genuinely cannot wait, record the decision and why:");
  console.log("");
  console.log(`     npx tsx ${scriptPathForHelp()} override \\`);
  console.log(`       --key ${key} --by "<who decided>" \\`);
  console.log(`       --reason "<why this month's extra send is worth the risk>"`);
  console.log("");
  console.log("     The override covers THIS key in THIS month and expires with it.");
  printBlindSpots();
  console.log("");
  return 2;
}

/** The path to print in help text, relative to the repo root. */
function scriptPathForHelp(): string {
  return ".claude/skills/email-the-community/scripts/marketing-frequency-check.ts";
}

/** `override` — record a decision to send past the cap, with its reason. */
function runOverride(args: Args): number {
  if (!args.key) throw new Error(`override needs --key.\n${USAGE}`);
  const problem = validateReason(args.reason);
  if (problem) {
    console.error(`Refusing to record the override: ${problem}`);
    console.error("");
    console.error("An override that records no reason is not a control, it is an off switch.");
    console.error("Somebody has to be able to read this back next month and judge it.");
    return 1;
  }

  const month = currentNzMonth();
  const verdict = assessFrequency(allSends(), month, DEFAULT_MONTHLY_CAP, {
    source: "email-the-community",
    key: args.key,
  });

  const file = loadOverrides();
  const record: OverrideRecord = {
    at: new Date().toISOString(),
    month,
    key: args.key,
    reason: (args.reason as string).trim(),
    by: args.by?.trim() || "unrecorded",
    observedCount: verdict.existing.length,
    cap: DEFAULT_MONTHLY_CAP,
  };
  // One override per key per month: re-running replaces rather than stacks, so
  // the file cannot grow a pile of near-identical justifications.
  file.overrides = [
    ...file.overrides.filter(
      (entry) => !(entry.key === record.key && entry.month === record.month)
    ),
    record,
  ].sort((a, b) => a.at.localeCompare(b.at));
  saveOverrides(file);

  console.log("");
  console.log(`Override recorded for ${record.key} in ${record.month}:`);
  console.log(`    by       ${record.by}`);
  console.log(`    reason   ${record.reason}`);
  console.log(`    observed ${record.observedCount} send(s) already, cap ${record.cap}`);
  console.log("");
  console.log(`  written to ${OVERRIDES_PATH}`);
  console.log("");
  console.log("Say this in the Step 6 plan block, in these words, before the user approves:");
  console.log(
    `    This is marketing email ${record.observedCount + 1} to this list in ${record.month}, past our cap of ${record.cap}.`
  );
  console.log(`    Recorded reason: ${record.reason}`);
  console.log("");
  return 0;
}

/** `show` — this month's sends and any override on record. */
function runShow(args: Args): number {
  const month = currentNzMonth();
  const sends = allSends().filter((send) => send.month === month);
  const overrides = loadOverrides().overrides.filter((entry) => entry.month === month);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          month,
          cap: DEFAULT_MONTHLY_CAP,
          counts: COUNT_LABEL,
          sends,
          overrides,
          blindSpots: BLIND_SPOT_NOTICE,
        },
        null,
        2
      )
    );
    return 0;
  }

  console.log("");
  console.log(`Marketing sends — ${month} (NZ), ${COUNT_LABEL}`);
  console.log("===================================");
  console.log(`  cap  ${DEFAULT_MONTHLY_CAP} per calendar month, to the subscriber list`);
  if (sends.length === 0) {
    console.log("  (none recorded here — which is not the same as none sent)");
  } else {
    for (const send of sends) console.log(formatSend(send));
  }
  if (overrides.length > 0) {
    console.log("");
    console.log("  Overrides on record for this month:");
    for (const entry of overrides) {
      console.log(`    ${entry.key} — ${entry.by}: ${entry.reason}`);
    }
  }
  printBlindSpots();
  console.log("");
  return 0;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "check":
      return runCheck(args);
    case "override":
      return runOverride(args);
    case "show":
      return runShow(args);
  }
}

// `import.meta.url` resolves the real path while `process.argv[1]` keeps the
// path as typed, so a junctioned worktree makes the usual equality guard
// silently skip main(). Comparing the basename is enough here and cannot
// no-op green.
const invokedDirectly = basename(process.argv[1] ?? "") === "marketing-frequency-check.ts";
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
