/**
 * The approval chain for one newsletter issue, recorded on disk and enforced.
 *
 * WHY THIS EXISTS, AND HOW IT DIFFERS FROM THE ONE NEXT DOOR.
 *
 * `.claude/skills/email-the-community/scripts/broadcast-ledger.ts` is the
 * pattern this follows, and it is worth saying plainly that its `check`
 * "ALWAYS exits 0" on purpose: it answers "has this announcement already gone
 * out?", a question with four sensible answers (proceed / resume-draft /
 * content-changed / no-op), and the skill reads the verdict and decides. An
 * advisory is the right shape for a question whose answer is not yes-or-no.
 *
 * This one answers a different question — "has this issue cleared the approval
 * chain?" — and that question has exactly two answers. So this `check` **exits
 * non-zero when the chain is incomplete**, which is what lets the skill's build
 * step be written as one line that cannot be half-run:
 *
 *   npx tsx .claude/skills/monthly-newsletter/scripts/issue-ledger.ts check --issue 2026-08 \
 *     && npx tsx scripts/newsletter/build-newsletter-batch.ts 2026-08 --recipients …
 *
 * A guard that returns a verdict is one an operator can read and shrug at. A
 * guard that fails the command is one they cannot. The newsletter is the bigger
 * send of the two — the first ever from `newsletter_subscribers`, 1,549 real
 * people — and until this file existed it had strictly weaker crash recovery
 * than the announcement skill, which is the wrong way round.
 *
 * THE CHAIN, IN ORDER. Three stages, and the order is the point:
 *
 *   1. TEST     — the caller's own mailbox, named by them. One person proving
 *                 the render in their own inbox.
 *   2. REVIEW   — the founder together with internal staff, one email each.
 *                 This is HOW the founder sees the issue.
 *   3. APPROVAL — the founder's word, with the evidence for it. Only this gates
 *                 the broadcast.
 *
 * The old Step 6b had 2 gated on 3: the review round required "the founder has
 * explicitly approved widening", which asked her to approve an issue she had
 * not been shown. `check` therefore also enforces that the timestamps run
 * forwards — an approval dated before the review round it is supposed to follow
 * is that same inversion wearing a timestamp.
 *
 * NO ADDRESS IS EVER WRITTEN HERE. `state/issues.json` is committed. The record
 * keeps a count and a truncated sha256 per recipient — enough to prove the same
 * mailbox was used twice, or that a review round had six distinct people in it,
 * and not enough to mail anybody. This is the same one-way design as
 * `lib/data/json/email-suppression-hashes.json`.
 *
 * NOTHING HERE SENDS EMAIL. It records what a human did and refuses when they
 * have not done it.
 *
 * Usage (run from the repo root):
 *   issue-ledger.ts show [--issue <id>] [--json]
 *   issue-ledger.ts record-test     --issue <id> --to "<addr>[,<addr>…]" [--note "…"]
 *   issue-ledger.ts record-review   --issue <id> --to "<addr>[,<addr>…]" [--people <n>] [--note "…"]
 *   issue-ledger.ts record-approval --issue <id> --evidence "<what proves it>" [--by "<name>"]
 *   issue-ledger.ts record-batch    --issue <id> --chunk <n> --of <m> --recipients <count>
 *                                   [--idempotency-key <k>]
 *   issue-ledger.ts check --issue <id> [--json] [--override-frequency "<reason>"]
 *
 * Exit codes:
 *   show, record-*  0 on success, 1 on a bad argument or a refused record.
 *   check           0 only when all three stages are on the record, in order,
 *                   and the month's marketing frequency cap is not exceeded.
 *                   1 otherwise. This is the gate.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessFrequency,
  currentNzMonth,
  DEFAULT_MONTHLY_CAP,
  nzCalendarMonth,
  readCommunitySends,
  type MarketingSend,
} from "./marketing-frequency";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** …/.claude/skills/monthly-newsletter */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const DEFAULT_STATE_PATH = resolve(SKILL_ROOT, "state", "issues.json");

/**
 * Test-only redirection of the state file.
 *
 * The tests have to be able to drive this ledger into every refusing state,
 * and they cannot do that against the committed file. The variable is named
 * loudly and every command prints a banner when it is set, so a run that has
 * been redirected can never be mistaken for a run against the real record —
 * a silent redirect would be a way to walk past the whole gate.
 */
const ENV_STATE_PATH = "NEWSLETTER_ISSUE_LEDGER_PATH_FOR_TESTS";

/** Where this process reads and writes the ledger. */
export function statePath(): string {
  return process.env[ENV_STATE_PATH] ?? DEFAULT_STATE_PATH;
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/** A stage-1 or stage-2 send: when, how many, and who — as hashes. */
export interface StageRecord {
  at: string;
  /**
   * ADDRESSES mailed, not people.
   *
   * The two differ: the founder holds two mailboxes, one organisational and one
   * academic, and the round goes to both. Naming this field for what it counts
   * is cheaper than a reader assuming it means people and quietly concluding
   * that a three-address round reached three reviewers.
   */
  recipientCount: number;
  /**
   * Distinct PEOPLE the round reached, when the caller knew it.
   *
   * Null when the round was typed as a bare `--reviewers` list, because nothing
   * maps those addresses back to people. `review-round.ts` fills it in from the
   * roster, so the usual case is a real number.
   */
  people: number | null;
  /** First 16 hex chars of sha256(lowercased, trimmed address). Never an address. */
  recipientHashes: string[];
  note: string;
}

/** Stage 3. `evidence` is mandatory: an approval nobody can point at is not one. */
export interface ApprovalRecord {
  at: string;
  by: string;
  evidence: string;
}

/** One chunk of a ramped send, so an interrupted ramp is resumable. */
export interface BatchRecord {
  at: string;
  chunk: number;
  of: number;
  recipientCount: number;
  idempotencyKey: string | null;
}

/** A recorded decision to send past the month's frequency cap. */
export interface FrequencyOverride {
  at: string;
  reason: string;
  /** Campaigns already on the record for that month when the override was taken. */
  observedCount: number;
  cap: number;
  month: string;
}

export interface IssueEntry {
  issueId: string;
  createdAt: string;
  test: StageRecord | null;
  review: StageRecord | null;
  approval: ApprovalRecord | null;
  batches: BatchRecord[];
  frequencyOverride: FrequencyOverride | null;
}

export interface IssueLedger {
  version: number;
  lastRunAt: string | null;
  /** Marketing sends allowed per NZ calendar month, across every skill. */
  frequencyCapPerMonth: number;
  issues: Record<string, IssueEntry>;
}

const EMPTY_LEDGER: IssueLedger = {
  version: 1,
  lastRunAt: null,
  frequencyCapPerMonth: DEFAULT_MONTHLY_CAP,
  issues: {},
};

/**
 * Reads the ledger, tolerating a missing file by starting empty.
 *
 * A CORRUPT file is NOT tolerated, and that is the opposite of the community
 * ledger's choice. There, starting fresh on a parse error risks one duplicate
 * announcement. Here it would silently erase the record of an approval and let
 * a `check` pass on an issue nobody signed off, so a damaged file has to be a
 * loud failure that a human fixes.
 *
 * @param path Where to read from; defaults to {@link statePath}.
 * @throws Error when the file exists but is not a readable ledger.
 */
export function loadLedger(path: string = statePath()): IssueLedger {
  if (!existsSync(path)) return structuredClone(EMPTY_LEDGER);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(
      `The issue ledger at ${path} is not valid JSON (${
        error instanceof Error ? error.message : String(error)
      }).\n` +
        "Refusing to start from an empty ledger: that would erase the record of every\n" +
        "approval and let `check` pass on an issue nobody signed off. Restore the file\n" +
        "from git (`git checkout -- <path>`) and re-record anything missing."
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`The issue ledger at ${path} is not an object. Restore it from git.`);
  }

  const raw = parsed as Partial<IssueLedger>;
  return {
    version: raw.version ?? 1,
    lastRunAt: raw.lastRunAt ?? null,
    frequencyCapPerMonth: raw.frequencyCapPerMonth ?? DEFAULT_MONTHLY_CAP,
    issues: raw.issues ?? {},
  };
}

/**
 * Writes the ledger deterministically and atomically.
 *
 * Keys sorted and fields in a fixed order so a git diff shows only what
 * changed; temp-file-then-rename so a crash mid-write cannot leave a truncated
 * file, which — given the strict `loadLedger` above — would block the next run
 * rather than quietly reading as "nothing was ever approved".
 */
export function saveLedger(ledger: IssueLedger, path: string = statePath()): void {
  mkdirSync(dirname(path), { recursive: true });
  const ordered: IssueLedger = {
    version: ledger.version ?? 1,
    lastRunAt: ledger.lastRunAt,
    frequencyCapPerMonth: ledger.frequencyCapPerMonth ?? DEFAULT_MONTHLY_CAP,
    issues: {},
  };
  /** An explicit `people: null` beats a missing key a reader has to interpret. */
  const stage = (record: StageRecord | null): StageRecord | null =>
    record === null ? null : { ...record, people: record.people ?? null };

  for (const key of Object.keys(ledger.issues).sort()) {
    const e = ledger.issues[key];
    ordered.issues[key] = {
      issueId: e.issueId,
      createdAt: e.createdAt,
      test: stage(e.test),
      review: stage(e.review),
      approval: e.approval,
      batches: [...e.batches].sort((a, b) => a.chunk - b.chunk),
      frequencyOverride: e.frequencyOverride,
    };
  }
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  renameSync(tmp, path);
}

/**
 * A recipient's identity, without the recipient.
 *
 * Truncated to 16 hex characters deliberately: enough to distinguish the
 * mailboxes in a review round and to notice the same one recorded twice, short
 * enough that the committed file is not a lookup table for a dictionary of
 * known addresses.
 */
export function maskAddress(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
}

const EMAIL_REGEX = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const ISSUE_ID_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Splits and validates a `--to` argument.
 *
 * @throws Error naming the offending value, so a typo is fixed rather than
 *   silently recorded as a send that did not happen.
 */
export function parseAddresses(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (!email) continue;
    if (!EMAIL_REGEX.test(email)) {
      throw new Error(`"${email}" is not a valid email address.`);
    }
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  if (out.length === 0) throw new Error("--to contained no addresses.");
  return out;
}

/** A blank entry for an issue nothing has been recorded against yet. */
function newEntry(issueId: string, now: string): IssueEntry {
  return {
    issueId,
    createdAt: now,
    test: null,
    review: null,
    approval: null,
    batches: [],
    frequencyOverride: null,
  };
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

export type ChainProblem =
  | "no-record"
  | "missing-test"
  | "missing-review"
  | "missing-approval"
  | "empty-evidence"
  | "out-of-order"
  | "frequency-cap";

export interface ChainVerdict {
  issueId: string;
  ok: boolean;
  problems: ChainProblem[];
  lines: string[];
  month: string;
  cap: number;
  existingThisMonth: MarketingSend[];
  overrideApplied: FrequencyOverride | null;
}

/** Every newsletter issue that has put mail in an inbox, as a marketing send. */
export function newsletterSends(ledger: IssueLedger): MarketingSend[] {
  const sends: MarketingSend[] = [];
  for (const entry of Object.values(ledger.issues)) {
    // A ramp is ONE campaign. It is dated at its first chunk, because that is
    // when a subscriber's inbox was first touched; counting each chunk would
    // make a five-chunk send look like five campaigns and lock out the rest of
    // the month for no reason.
    if (entry.batches.length === 0) continue;
    const first = [...entry.batches].sort((a, b) => a.at.localeCompare(b.at))[0];
    sends.push({
      source: "monthly-newsletter",
      key: entry.issueId,
      at: first.at,
      month: nzCalendarMonth(first.at),
      what: `newsletter issue ${entry.issueId} (${entry.batches.length} chunk(s) recorded)`,
    });
  }
  return sends;
}

/**
 * Decides whether an issue may be built into a batch.
 *
 * @param ledger The ledger to judge against.
 * @param issueId The issue in hand.
 * @param communityPath Override only in tests.
 * @param now Override only in tests.
 */
export function assessChain(
  ledger: IssueLedger,
  issueId: string,
  communityPath?: string,
  now: Date = new Date()
): ChainVerdict {
  const entry = ledger.issues[issueId];
  const problems: ChainProblem[] = [];
  const lines: string[] = [];

  const cap = ledger.frequencyCapPerMonth ?? DEFAULT_MONTHLY_CAP;
  const month = currentNzMonth(now);
  const sends = [...newsletterSends(ledger), ...readCommunitySends(communityPath)];
  const frequency = assessFrequency(sends, month, cap, {
    source: "monthly-newsletter",
    key: issueId,
  });

  if (!entry) {
    problems.push("no-record");
    lines.push(`No approval chain has been started for "${issueId}".`);
    lines.push("  Nothing has been tested, reviewed or approved. Run Step 6 first.");
  } else {
    if (!entry.test) {
      problems.push("missing-test");
      lines.push("STAGE 1 (test send) is missing.");
      lines.push("  Send the issue to your own mailbox, then record it:");
      lines.push(
        `    issue-ledger.ts record-test --issue ${issueId} --to "you@example.com"`
      );
    }
    if (!entry.review) {
      problems.push("missing-review");
      lines.push("STAGE 2 (review round) is missing.");
      lines.push("  The founder and internal staff have not been sent this issue, so");
      lines.push("  nobody outside you has seen it. Run Step 6b, then record it:");
      lines.push(
        `    issue-ledger.ts record-review --issue ${issueId} --to "a@…,b@…"`
      );
    }
    if (!entry.approval) {
      problems.push("missing-approval");
      lines.push("STAGE 3 (founder approval) is missing.");
      lines.push("  Record it only once she has actually said yes, with what proves it:");
      lines.push(
        `    issue-ledger.ts record-approval --issue ${issueId} --by "Mahsa" \\`
      );
      lines.push(`      --evidence "Slack permalink, or the email, or 'said so on the call'"`);
    } else if (entry.approval.evidence.trim().length === 0) {
      problems.push("empty-evidence");
      lines.push("STAGE 3 has no evidence recorded. An approval nobody can point at");
      lines.push("  is not an approval — re-record it with --evidence.");
    }

    // The ordering guard. The bug this whole chain replaces was an approval
    // gate placed BEFORE the review round that shows her the issue; a chain
    // whose timestamps run backwards is that same inversion, recorded.
    const t = entry.test?.at;
    const r = entry.review?.at;
    const a = entry.approval?.at;
    if (t && r && r < t) {
      problems.push("out-of-order");
      lines.push("The review round is dated BEFORE the test send.");
      lines.push("  Stage 1 proves the render; stage 2 shows it to people. Reversed,");
      lines.push("  the reviewers saw something you had not yet checked.");
    }
    if (r && a && a < r) {
      problems.push("out-of-order");
      lines.push("The founder's approval is dated BEFORE the review round.");
      lines.push("  She cannot have approved an issue she had not been sent. This is the");
      lines.push("  exact inversion the old Step 6b encoded; fix the record, or the order.");
    }
  }

  const override = entry?.frequencyOverride ?? null;
  const overrideApplies =
    override !== null && override.month === month && frequency.exceeded;

  if (frequency.exceeded && !overrideApplies) {
    problems.push("frequency-cap");
    lines.push(
      `FREQUENCY CAP: ${frequency.existing.length} marketing send(s) already on the record for ${month}, cap is ${cap}.`
    );
    for (const s of frequency.existing) {
      lines.push(`    ${s.at}  ${s.source}  ${s.key} — ${s.what}`);
    }
    lines.push("  Sending again this month would put a fourth marketing email in the same");
    lines.push("  inboxes. The account complaint ceiling is 0.08% — about 1.25 complaints on");
    lines.push("  a full send — and breaching it takes password resets and donation receipts");
    lines.push("  down with the newsletter. Frequency is the main driver of complaints.");
    lines.push("  If it is genuinely the right call, record the decision and why:");
    lines.push(
      `    issue-ledger.ts check --issue ${issueId} --override-frequency "<the reason>"`
    );
  }

  return {
    issueId,
    ok: problems.length === 0,
    problems,
    lines,
    month,
    cap,
    existingThisMonth: frequency.existing,
    overrideApplied: overrideApplies ? override : null,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type Command =
  | "show"
  | "record-test"
  | "record-review"
  | "record-approval"
  | "record-batch"
  | "check";

const COMMANDS: readonly Command[] = [
  "show",
  "record-test",
  "record-review",
  "record-approval",
  "record-batch",
  "check",
];

interface Args {
  command: Command;
  issue: string | null;
  to: string | null;
  note: string | null;
  evidence: string | null;
  by: string | null;
  chunk: number | null;
  of: number | null;
  recipients: number | null;
  people: number | null;
  idempotencyKey: string | null;
  overrideFrequency: string | null;
  json: boolean;
}

const USAGE = [
  "Usage:",
  "  issue-ledger.ts show [--issue <id>] [--json]",
  '  issue-ledger.ts record-test     --issue <id> --to "<addr>[,<addr>…]" [--note "…"]',
  '  issue-ledger.ts record-review   --issue <id> --to "<addr>[,<addr>…]" [--people <n>] [--note "…"]',
  '  issue-ledger.ts record-approval --issue <id> --evidence "<what proves it>" [--by "<name>"]',
  "  issue-ledger.ts record-batch    --issue <id> --chunk <n> --of <m> --recipients <count>",
  "                                  [--idempotency-key <k>]",
  '  issue-ledger.ts check --issue <id> [--json] [--override-frequency "<reason>"]',
].join("\n");

function parseArgs(argv: string[]): Args {
  const first = argv[0] as Command | undefined;
  if (!first || !COMMANDS.includes(first)) {
    throw new Error(`Unknown command: ${first ?? "(none)"}\n${USAGE}`);
  }

  const args: Args = {
    command: first,
    issue: null,
    to: null,
    note: null,
    evidence: null,
    by: null,
    chunk: null,
    of: null,
    recipients: null,
    people: null,
    idempotencyKey: null,
    overrideFrequency: null,
    json: false,
  };

  const value = (flag: string, i: number): string => {
    const raw = argv[i];
    if (raw === undefined || raw.startsWith("--")) {
      throw new Error(`${flag} requires a value.\n${USAGE}`);
    }
    return raw;
  };

  const number = (flag: string, i: number): number => {
    const raw = value(flag, i);
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`${flag} must be a non-negative integer, got: ${raw}`);
    }
    return n;
  };

  for (let i = 1; i < argv.length; i++) {
    const flag = argv[i];
    switch (flag) {
      case "--issue":
        args.issue = value(flag, ++i);
        break;
      case "--to":
        args.to = value(flag, ++i);
        break;
      case "--note":
        args.note = value(flag, ++i);
        break;
      case "--evidence":
        args.evidence = value(flag, ++i);
        break;
      case "--by":
        args.by = value(flag, ++i);
        break;
      case "--chunk":
        args.chunk = number(flag, ++i);
        break;
      case "--of":
        args.of = number(flag, ++i);
        break;
      case "--recipients":
        args.recipients = number(flag, ++i);
        break;
      case "--people":
        args.people = number(flag, ++i);
        break;
      case "--idempotency-key":
        args.idempotencyKey = value(flag, ++i);
        break;
      case "--override-frequency":
        args.overrideFrequency = value(flag, ++i);
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

/** Validates and returns `--issue`. */
function requireIssue(args: Args): string {
  if (!args.issue) throw new Error(`--issue is required.\n${USAGE}`);
  if (!ISSUE_ID_REGEX.test(args.issue)) {
    throw new Error(`--issue must be a YYYY-MM issue id, got: ${args.issue}`);
  }
  return args.issue;
}

function formatStage(label: string, stage: StageRecord | null): string[] {
  if (!stage) return [`    ${label.padEnd(9)}: — not recorded`];
  const who =
    (stage.people ?? null) === null
      ? `${stage.recipientCount} address(es)`
      : `${stage.people} person(s) / ${stage.recipientCount} address(es)`;
  return [
    `    ${label.padEnd(9)}: ${stage.at}  ${who}`,
    `                 ${stage.recipientHashes.map((h) => `${h}…`).join(" ")}`,
    ...(stage.note ? [`                 note: ${stage.note}`] : []),
  ];
}

function formatEntry(entry: IssueEntry): string[] {
  const lines = [`  ${entry.issueId}   (started ${entry.createdAt})`];
  lines.push(...formatStage("1 test", entry.test));
  lines.push(...formatStage("2 review", entry.review));
  lines.push(
    entry.approval
      ? `    3 approve: ${entry.approval.at}  by ${entry.approval.by}\n                 evidence: ${entry.approval.evidence}`
      : "    3 approve: — not recorded"
  );
  if (entry.batches.length === 0) {
    lines.push("    batches  : — none sent");
  } else {
    const total = entry.batches.reduce((sum, b) => sum + b.recipientCount, 0);
    lines.push(`    batches  : ${entry.batches.length} recorded, ${total} recipient(s)`);
    for (const b of entry.batches) {
      lines.push(
        `                 chunk ${b.chunk}/${b.of}  ${b.recipientCount} recipient(s)  ${b.at}` +
          (b.idempotencyKey ? `  key ${b.idempotencyKey}` : "")
      );
    }
  }
  if (entry.frequencyOverride) {
    const o = entry.frequencyOverride;
    lines.push(
      `    override : ${o.at}  ${o.month} was at ${o.observedCount}/${o.cap} — ${o.reason}`
    );
  }
  return lines;
}

function runShow(args: Args): number {
  const ledger = loadLedger();
  const keys = args.issue ? [args.issue] : Object.keys(ledger.issues);

  if (args.json) {
    const subset: Record<string, IssueEntry> = {};
    for (const key of keys) if (ledger.issues[key]) subset[key] = ledger.issues[key];
    console.log(
      JSON.stringify(
        {
          version: ledger.version,
          lastRunAt: ledger.lastRunAt,
          frequencyCapPerMonth: ledger.frequencyCapPerMonth,
          issues: subset,
        },
        null,
        2
      )
    );
    return 0;
  }

  console.log("");
  console.log("Newsletter issue ledger");
  console.log("===================================");
  console.log(`  file      : ${statePath()}`);
  console.log(`  lastRunAt : ${ledger.lastRunAt ?? "never"}`);
  console.log(`  cap       : ${ledger.frequencyCapPerMonth} marketing send(s) / NZ month`);
  console.log("===================================");

  const present = keys.filter((k) => ledger.issues[k] !== undefined);
  if (present.length === 0) {
    console.log(
      args.issue
        ? `\n  no record for "${args.issue}" — nothing has been tested, reviewed or approved.`
        : "\n  (empty) — no issue has entered the approval chain."
    );
    console.log("");
    return 0;
  }

  present.sort((a, b) => b.localeCompare(a));
  for (const key of present) {
    console.log("");
    for (const line of formatEntry(ledger.issues[key])) console.log(line);
  }
  console.log("");
  return 0;
}

function runRecordStage(args: Args, stage: "test" | "review"): number {
  const issueId = requireIssue(args);
  if (!args.to) throw new Error(`record-${stage} needs --to.\n${USAGE}`);
  const addresses = parseAddresses(args.to);

  const now = new Date().toISOString();
  const ledger = loadLedger();
  const entry = ledger.issues[issueId] ?? newEntry(issueId, now);

  const record: StageRecord = {
    at: now,
    recipientCount: addresses.length,
    people: args.people,
    recipientHashes: addresses.map(maskAddress),
    note: args.note ?? "",
  };
  entry[stage] = record;
  ledger.issues[issueId] = entry;
  ledger.lastRunAt = now;
  saveLedger(ledger);

  console.log("");
  console.log(
    `Recorded stage ${stage === "test" ? "1 (test send)" : "2 (review round)"} for ${issueId}:`
  );
  console.log(`  when       : ${now}`);
  console.log(`  addresses  : ${record.recipientCount}`);
  console.log(`  people     : ${record.people ?? "not recorded (a bare --reviewers list)"}`);
  console.log(`  hashes     : ${record.recipientHashes.map((h) => `${h}…`).join(" ")}`);
  console.log(`  written to ${statePath()} — addresses are NOT stored.`);
  console.log("");
  return 0;
}

function runRecordApproval(args: Args): number {
  const issueId = requireIssue(args);
  const evidence = (args.evidence ?? "").trim();
  if (evidence.length === 0) {
    throw new Error(
      [
        "record-approval needs --evidence.",
        "",
        "An approval with nothing behind it is not an approval — it is somebody's",
        "recollection, written into a file that will outlive the conversation. Give the",
        "thing a later reader could check: a Slack permalink, the subject line of her",
        'email, or plainly "said so on the 10am call, 2026-08-30".',
        "",
        USAGE,
      ].join("\n")
    );
  }

  const now = new Date().toISOString();
  const ledger = loadLedger();
  const entry = ledger.issues[issueId] ?? newEntry(issueId, now);

  if (!entry.review) {
    throw new Error(
      [
        `Refusing to record an approval for ${issueId}: stage 2 (the review round) is not`,
        "on the record, so the founder has not been sent this issue.",
        "",
        "The review round is HOW she sees it; her approval is what gates the send. Doing",
        "these the other way round is the bug this ledger was built to stop. Send the",
        "review round (Step 6b), record it, then come back.",
      ].join("\n")
    );
  }

  entry.approval = { at: now, by: args.by ?? "the founder", evidence };
  ledger.issues[issueId] = entry;
  ledger.lastRunAt = now;
  saveLedger(ledger);

  console.log("");
  console.log(`Recorded stage 3 (founder approval) for ${issueId}:`);
  console.log(`  when     : ${now}`);
  console.log(`  by       : ${entry.approval.by}`);
  console.log(`  evidence : ${entry.approval.evidence}`);
  console.log("");
  return 0;
}

function runRecordBatch(args: Args): number {
  const issueId = requireIssue(args);
  if (args.chunk === null || args.of === null || args.recipients === null) {
    throw new Error(`record-batch needs --chunk, --of and --recipients.\n${USAGE}`);
  }

  const ledger = loadLedger();
  const verdict = assessChain(ledger, issueId);
  // Recording a batch against an unapproved issue would write a false record —
  // the ledger would then say the chain was clean for the NEXT check.
  const blocking = verdict.problems.filter((p) => p !== "frequency-cap");
  if (blocking.length > 0) {
    throw new Error(
      [
        `Refusing to record a batch for ${issueId}: the approval chain is incomplete.`,
        "",
        ...verdict.lines,
      ].join("\n")
    );
  }

  const now = new Date().toISOString();
  const entry = ledger.issues[issueId];
  entry.batches = entry.batches.filter((b) => b.chunk !== args.chunk);
  entry.batches.push({
    at: now,
    chunk: args.chunk,
    of: args.of,
    recipientCount: args.recipients,
    idempotencyKey: args.idempotencyKey,
  });
  ledger.lastRunAt = now;
  saveLedger(ledger);

  const done = entry.batches.length;
  console.log("");
  console.log(`Recorded chunk ${args.chunk}/${args.of} for ${issueId} (${args.recipients} recipient(s)).`);
  console.log(`  ${done}/${args.of} chunk(s) now on the record.`);
  if (done < args.of) {
    console.log(`  A resumed send excludes these — see Step 8f (--exclude-hashes).`);
  }
  console.log("");
  return 0;
}

function runCheck(args: Args): number {
  const issueId = requireIssue(args);
  const ledger = loadLedger();

  if (args.overrideFrequency !== null) {
    const reason = args.overrideFrequency.trim();
    if (reason.length === 0) {
      throw new Error("--override-frequency needs a reason.");
    }
    const before = assessChain(ledger, issueId);
    if (!before.problems.includes("frequency-cap")) {
      throw new Error(
        `--override-frequency was given for ${issueId}, but the month's cap is not exceeded ` +
          `(${before.existingThisMonth.length}/${before.cap} for ${before.month}). ` +
          "Refusing to record an override nothing needed: a ledger full of unnecessary\n" +
          "overrides is how a real one stops being noticed."
      );
    }
    const entry = ledger.issues[issueId] ?? newEntry(issueId, new Date().toISOString());
    entry.frequencyOverride = {
      at: new Date().toISOString(),
      reason,
      observedCount: before.existingThisMonth.length,
      cap: before.cap,
      month: before.month,
    };
    ledger.issues[issueId] = entry;
    ledger.lastRunAt = entry.frequencyOverride.at;
    saveLedger(ledger);
    console.log("");
    console.log(`Frequency cap OVERRIDDEN for ${issueId} (${before.month}).`);
    console.log(`  was ${before.existingThisMonth.length} send(s) against a cap of ${before.cap}`);
    console.log(`  reason: ${reason}`);
    console.log("  Recorded in the ledger, and it stays there.");
  }

  const verdict = assessChain(loadLedger(), issueId);

  if (args.json) {
    console.log(JSON.stringify(verdict, null, 2));
    return verdict.ok ? 0 : 1;
  }

  console.log("");
  console.log(`Approval chain — ${issueId}`);
  console.log("===================================");
  if (verdict.ok) {
    const entry = loadLedger().issues[issueId];
    console.log("PASS — all three stages are on the record, in order.");
    console.log(`  1 test    : ${entry.test?.at} to ${entry.test?.recipientCount} mailbox(es)`);
    console.log(
      `  2 review  : ${entry.review?.at} to ` +
        (entry.review?.people === null || entry.review?.people === undefined
          ? `${entry.review?.recipientCount} address(es)`
          : `${entry.review.people} reviewer(s) at ${entry.review.recipientCount} address(es)`)
    );
    console.log(`  3 approval: ${entry.approval?.at} by ${entry.approval?.by}`);
    console.log(`              evidence: ${entry.approval?.evidence}`);
    console.log(
      `  frequency : ${verdict.existingThisMonth.length}/${verdict.cap} marketing send(s) recorded for ${verdict.month}` +
        (verdict.overrideApplied ? "  (CAP OVERRIDDEN)" : "")
    );
    console.log("");
    return 0;
  }

  console.log(`FAIL — this issue must not be built into a batch.`);
  console.log("");
  for (const line of verdict.lines) console.log(line);
  console.log("");
  console.log(`  problems: ${verdict.problems.join(", ")}`);
  console.log("");
  return 1;
}

function main(): number {
  if (process.env[ENV_STATE_PATH]) {
    console.error(
      `WARNING: ${ENV_STATE_PATH} is set — this ledger is NOT the committed record.\n` +
        `         reading and writing ${process.env[ENV_STATE_PATH]}`
    );
  }

  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "show":
      return runShow(args);
    case "record-test":
      return runRecordStage(args, "test");
    case "record-review":
      return runRecordStage(args, "review");
    case "record-approval":
      return runRecordApproval(args);
    case "record-batch":
      return runRecordBatch(args);
    case "check":
      return runCheck(args);
  }
}

// `import.meta.url` resolves the real path while `process.argv[1]` keeps the
// path as typed, so a junctioned worktree makes the usual equality guard
// silently skip main(). Comparing the basename is enough here and cannot
// no-op green.
const invokedDirectly = basename(process.argv[1] ?? "") === "issue-ledger.ts";
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
