/**
 * Append-only run log of every community broadcast this skill has created.
 *
 * A Resend broadcast cannot be recalled once it is `sent`, so the expensive
 * mistake is not a bad send — it is the SECOND send of the same announcement
 * after a session crashed, a context window rolled over, or a colleague asked
 * "did that go out?". This ledger exists so that question is answered from a
 * file on disk instead of from memory: `check` short-circuits a repeat before a
 * single API call is made, and `record` writes the id back after each state
 * change so the next session can see it.
 *
 * The ledger is a LOG, not a lock. Resend remains the authority on what was
 * actually delivered (`resend broadcasts get <id> --json`); this file only
 * records what this skill believes it did. When the two disagree, believe
 * Resend — and then correct the ledger with `record`.
 *
 * Path model: run from the repo root. The skill root is resolved relative to
 * this file, so `state/broadcasts.json` is found regardless of cwd.
 *
 * Usage:
 *   npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts show [--key <k>] [--json]
 *   npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts record --key <k>
 *       --broadcast-id <id> --status draft|scheduled|sent --segment <name>
 *       --html-sha256 <sha> [--scheduled-at <iso>] [--digest "..."]
 *   npx tsx .claude/skills/email-the-community/scripts/broadcast-ledger.ts check --key <k> [--html-sha256 <sha>] [--json]
 *
 * Output:
 *   show   — one block per recorded broadcast (or just `--key`'s), newest first.
 *   record — the stored entry, after an atomic write.
 *   check  — a `verdict:` line the skill acts on: `proceed`, `resume-draft`,
 *            `content-changed` or `no-op`. ALWAYS exits 0 — it is an advisory
 *            for the skill to read, not a gate that kills the run.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/email-the-community */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const STATE_PATH = resolve(SKILL_ROOT, "state", "broadcasts.json");

// ---------------------------------------------------------------------------
// Ledger model
// ---------------------------------------------------------------------------

/**
 * Where a broadcast is in its lifecycle, as this skill last observed it.
 *
 * `draft` is the only reversible state (delete it, or update it in place);
 * `scheduled` can still be cancelled with `resend broadcasts delete`; `sent`
 * is final.
 */
export type BroadcastStatus = "draft" | "scheduled" | "sent";

const STATUSES: readonly BroadcastStatus[] = ["draft", "scheduled", "sent"];

export interface BroadcastEntry {
  /** Resend broadcast id returned by `broadcasts create`. */
  broadcastId: string;
  status: BroadcastStatus;
  /** Segment NAME (human-readable), e.g. "Newsletter". */
  segment: string;
  /** sha256 of the exact broadcast-mode HTML that was uploaded. */
  htmlSha256: string;
  createdAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
  /** One or two sentences on what the announcement said, for the next session. */
  digest: string;
}

export interface Ledger {
  version: number;
  lastRunAt: string | null;
  broadcasts: Record<string, BroadcastEntry>;
}

const EMPTY_LEDGER: Ledger = { version: 1, lastRunAt: null, broadcasts: {} };

/** Reads the ledger, tolerating a missing or corrupt file by starting empty. */
export function loadLedger(): Ledger {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY_LEDGER);
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8")) as Partial<Ledger>;
    return {
      version: parsed.version ?? 1,
      lastRunAt: parsed.lastRunAt ?? null,
      broadcasts: parsed.broadcasts ?? {},
    };
  } catch {
    return structuredClone(EMPTY_LEDGER);
  }
}

/**
 * Writes the ledger deterministically and atomically.
 *
 * Keys are sorted and fields emitted in a fixed order so a git diff shows only
 * what changed; the temp-file rename means a crash mid-write can never leave a
 * half-written ledger that would read as "nothing was ever sent".
 *
 * @param ledger The ledger to persist.
 */
export function saveLedger(ledger: Ledger): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  const ordered: Ledger = {
    version: ledger.version ?? 1,
    lastRunAt: ledger.lastRunAt,
    broadcasts: {},
  };
  for (const key of Object.keys(ledger.broadcasts).sort()) {
    const entry = ledger.broadcasts[key];
    ordered.broadcasts[key] = {
      broadcastId: entry.broadcastId,
      status: entry.status,
      segment: entry.segment,
      htmlSha256: entry.htmlSha256,
      createdAt: entry.createdAt,
      scheduledAt: entry.scheduledAt,
      sentAt: entry.sentAt,
      digest: entry.digest,
    };
  }
  const tmp = `${STATE_PATH}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  renameSync(tmp, STATE_PATH);
}

/** sha256 of a file's exact bytes — the identity of one rendered broadcast. */
export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

type Command = "show" | "record" | "check";

interface Args {
  command: Command;
  key: string | null;
  broadcastId: string | null;
  status: BroadcastStatus | null;
  segment: string | null;
  htmlSha256: string | null;
  scheduledAt: string | null;
  digest: string | null;
  json: boolean;
}

const USAGE = [
  "Usage:",
  "  broadcast-ledger.ts show [--key <k>] [--json]",
  "  broadcast-ledger.ts record --key <k> --broadcast-id <id> \\",
  "      --status draft|scheduled|sent --segment <name> --html-sha256 <sha> \\",
  "      [--scheduled-at <iso>] [--digest \"...\"]",
  "  broadcast-ledger.ts check --key <k> [--html-sha256 <sha>] [--json]",
].join("\n");

/**
 * Parses argv into a fully defaulted {@link Args}.
 *
 * @param argv `process.argv.slice(2)`.
 * @returns The parsed arguments.
 * @throws Error with the usage block when the command is unknown or a flag is
 *   missing its value.
 */
function parseArgs(argv: string[]): Args {
  const first = argv[0];
  if (first !== "show" && first !== "record" && first !== "check") {
    throw new Error(`Unknown command: ${first ?? "(none)"}\n${USAGE}`);
  }

  const args: Args = {
    command: first,
    key: null,
    broadcastId: null,
    status: null,
    segment: null,
    htmlSha256: null,
    scheduledAt: null,
    digest: null,
    json: false,
  };

  /** Reads the value that follows a flag, or throws naming the flag. */
  const value = (flag: string, i: number): string => {
    const raw = argv[i];
    if (raw === undefined || raw.startsWith("--")) {
      throw new Error(`${flag} requires a value.\n${USAGE}`);
    }
    return raw;
  };

  for (let i = 1; i < argv.length; i++) {
    const flag = argv[i];
    switch (flag) {
      case "--key":
        args.key = value(flag, ++i);
        break;
      case "--broadcast-id":
        args.broadcastId = value(flag, ++i);
        break;
      case "--status": {
        const raw = value(flag, ++i);
        if (!STATUSES.includes(raw as BroadcastStatus)) {
          throw new Error(`--status must be one of ${STATUSES.join(" | ")}, got: ${raw}`);
        }
        args.status = raw as BroadcastStatus;
        break;
      }
      case "--segment":
        args.segment = value(flag, ++i);
        break;
      case "--html-sha256":
        args.htmlSha256 = value(flag, ++i);
        break;
      case "--scheduled-at":
        args.scheduledAt = value(flag, ++i);
        break;
      case "--digest":
        args.digest = value(flag, ++i);
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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** Renders one entry as an indented block. */
function formatEntry(key: string, entry: BroadcastEntry): string {
  return [
    `  ${key}`,
    `    broadcast : ${entry.broadcastId}`,
    `    status    : ${entry.status}`,
    `    segment   : ${entry.segment}`,
    `    html      : sha256:${entry.htmlSha256.slice(0, 16)}…`,
    `    created   : ${entry.createdAt}`,
    `    scheduled : ${entry.scheduledAt ?? "—"}`,
    `    sent      : ${entry.sentAt ?? "—"}`,
    `    digest    : ${entry.digest.length > 0 ? entry.digest : "—"}`,
  ].join("\n");
}

/** `show` — print the whole ledger, or one key. */
function runShow(args: Args): void {
  const ledger = loadLedger();
  const keys = args.key ? [args.key] : Object.keys(ledger.broadcasts);

  if (args.json) {
    const subset: Record<string, BroadcastEntry> = {};
    for (const key of keys) {
      const entry = ledger.broadcasts[key];
      if (entry) subset[key] = entry;
    }
    console.log(
      JSON.stringify({ version: ledger.version, lastRunAt: ledger.lastRunAt, broadcasts: subset }, null, 2)
    );
    return;
  }

  console.log("");
  console.log("Broadcast ledger");
  console.log("===================================");
  console.log(`  file      : ${STATE_PATH}`);
  console.log(`  lastRunAt : ${ledger.lastRunAt ?? "never"}`);
  console.log("===================================");

  const present = keys.filter((key) => ledger.broadcasts[key] !== undefined);
  if (present.length === 0) {
    console.log(
      args.key
        ? `\n  no entry for "${args.key}" — nothing has been broadcast under that key.`
        : "\n  (empty) — this skill has never created a broadcast."
    );
    console.log("");
    return;
  }

  // Newest first: the entry a human is most likely asking about.
  present.sort((a, b) => ledger.broadcasts[b].createdAt.localeCompare(ledger.broadcasts[a].createdAt));
  for (const key of present) {
    console.log("");
    console.log(formatEntry(key, ledger.broadcasts[key]));
  }
  console.log("");
  console.log(`  ${present.length} broadcast(s) recorded.`);
  console.log("");
}

/** `record` — upsert one entry and stamp `lastRunAt`. */
function runRecord(args: Args): void {
  const missing: string[] = [];
  if (!args.key) missing.push("--key");
  if (!args.broadcastId) missing.push("--broadcast-id");
  if (!args.status) missing.push("--status");
  if (!args.segment) missing.push("--segment");
  if (!args.htmlSha256) missing.push("--html-sha256");
  if (missing.length > 0) {
    throw new Error(`record needs ${missing.join(", ")}.\n${USAGE}`);
  }

  const key = args.key as string;
  const status = args.status as BroadcastStatus;
  const now = new Date().toISOString();
  const ledger = loadLedger();
  const previous = ledger.broadcasts[key];

  const entry: BroadcastEntry = {
    broadcastId: args.broadcastId as string,
    status,
    segment: args.segment as string,
    htmlSha256: args.htmlSha256 as string,
    // The first sighting is the creation time; later state changes keep it.
    createdAt: previous?.createdAt ?? now,
    scheduledAt: args.scheduledAt ?? previous?.scheduledAt ?? null,
    sentAt: status === "sent" ? (previous?.sentAt ?? now) : (previous?.sentAt ?? null),
    digest: args.digest ?? previous?.digest ?? "",
  };

  ledger.broadcasts[key] = entry;
  ledger.lastRunAt = now;
  saveLedger(ledger);

  console.log("");
  console.log(previous ? `Updated "${key}" (was ${previous.status}):` : `Recorded "${key}":`);
  console.log(formatEntry(key, entry));
  console.log("");
  console.log(`  written to ${STATE_PATH}`);
  console.log("");
}

type Verdict = "proceed" | "resume-draft" | "content-changed" | "no-op";

/** `check` — decide whether creating a broadcast under this key is safe. */
function runCheck(args: Args): void {
  if (!args.key) throw new Error(`check needs --key.\n${USAGE}`);
  const key = args.key;
  const ledger = loadLedger();
  const entry = ledger.broadcasts[key];

  let verdict: Verdict;
  const lines: string[] = [];

  if (!entry) {
    verdict = "proceed";
    lines.push(`proceed — no broadcast has ever been recorded under "${key}".`);
  } else if (entry.status !== "draft") {
    verdict = "no-op";
    lines.push(`no-op — "${key}" already ${entry.status} as ${entry.broadcastId}.`);
    lines.push(
      entry.status === "sent"
        ? `  It went out at ${entry.sentAt ?? "an unrecorded time"} to "${entry.segment}". A sent`
        : `  It is scheduled for ${entry.scheduledAt ?? "an unrecorded time"} to "${entry.segment}". A scheduled`
    );
    lines.push(
      entry.status === "sent"
        ? "  broadcast cannot be recalled — STOP and tell the user rather than creating a second one."
        : "  broadcast can still be cancelled with `resend broadcasts delete " +
            `${entry.broadcastId}\` — STOP and ask the user which they want.`
    );
  } else if (args.htmlSha256 && args.htmlSha256 !== entry.htmlSha256) {
    verdict = "content-changed";
    lines.push(`content-changed — a DRAFT already exists for "${key}" (${entry.broadcastId}),`);
    lines.push("  but the HTML you just rendered is different from the one it holds.");
    lines.push(`    draft html : sha256:${entry.htmlSha256.slice(0, 16)}…`);
    lines.push(`    your html  : sha256:${args.htmlSha256.slice(0, 16)}…`);
    lines.push("  Pick one: delete the old draft (`resend broadcasts delete " + `${entry.broadcastId}\`)`);
    lines.push("  and create it again, or use a new key. Do NOT create a second draft under");
    lines.push("  this key — two drafts with one name is how the wrong one gets sent.");
  } else {
    verdict = "resume-draft";
    lines.push(`resume-draft — "${key}" exists as a DRAFT (${entry.broadcastId}) with the same HTML.`);
    lines.push("  Nothing has been delivered. Continue from the scheduling step rather than");
    lines.push("  creating a duplicate draft.");
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        { key, verdict, entry: entry ?? null, message: lines.join("\n") },
        null,
        2
      )
    );
    return;
  }

  console.log("");
  console.log(`Ledger check — ${key}`);
  console.log("===================================");
  for (const line of lines) console.log(line);
  console.log("");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "show":
      runShow(args);
      break;
    case "record":
      runRecord(args);
      break;
    case "check":
      runCheck(args);
      break;
  }
}

void main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
