/**
 * Read/write the committed run log at state/inbox-state.json.
 *
 * IMPORTANT — this file is NOT the idempotency source of truth.
 * `contact_form_submissions.reviewed_at` is. A row with `reviewed_at` set has
 * been dealt with, full stop; a row missing from `handled` here has NOT
 * necessarily been skipped (a session can send an email and die before
 * recording). Never gate a send on this file — always re-run
 * `reconcile-inbox.ts` against the database first.
 *
 * What this file IS for: a human-readable trail of what each session actually
 * did (which Resend message went out, what it said), plus a Slack watermark so
 * the next session can re-fetch only new notifications instead of the whole
 * channel history. It is committed so that trail survives across machines.
 *
 * Usage:
 *   npx tsx .claude/skills/reply-to-contact-messages/scripts/inbox-state.ts show
 *
 *   npx tsx .../inbox-state.ts record --submission-id 12 --outcome replied \
 *     --resend-id 4ef9…  --digest "Sponsor enquiry from Acme; sent the partnership deck link."
 *
 *   npx tsx .../inbox-state.ts record --submission-id 5 --outcome no-reply-needed \
 *     --digest "QA test row from a team member — marked reviewed, no email sent."
 *
 *   npx tsx .../inbox-state.ts record --submission-id 12 --outcome replied \
 *     --watermark 1753600000.123456   # also advance the Slack watermark
 *
 * Flags (record):
 *   --submission-id <n>                  Required. contact_form_submissions.id.
 *   --outcome replied|no-reply-needed    Required.
 *   --resend-id <id>                     Resend message id (omit for no-reply-needed).
 *   --digest "<text>"                    One-line note on what was decided/sent.
 *   --watermark <ts>                     Latest Slack ts processed this run.
 *
 * File shape:
 * {
 *   "version": 1,
 *   "watermarkTs": null,
 *   "lastRunAt": null,
 *   "handled": { "<submissionId>": { "outcome", "at", "resendId", "digest" } }
 * }
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/reply-to-contact-messages */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
export const STATE_PATH = resolve(SKILL_ROOT, "state", "inbox-state.json");

export type Outcome = "replied" | "no-reply-needed";

export interface HandledEntry {
  outcome: Outcome;
  /** ISO timestamp of when this submission was recorded as handled. */
  at: string;
  resendId: string;
  digest: string;
}

export interface InboxState {
  version: number;
  /** Latest Slack ts already reconciled; feed to fetch-contact-notifications --since. */
  watermarkTs: string | null;
  lastRunAt: string | null;
  handled: Record<string, HandledEntry>;
}

const EMPTY_STATE: InboxState = { version: 1, watermarkTs: null, lastRunAt: null, handled: {} };

export function loadState(): InboxState {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY_STATE);
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8")) as Partial<InboxState>;
    return {
      version: parsed.version ?? 1,
      watermarkTs: parsed.watermarkTs ?? null,
      lastRunAt: parsed.lastRunAt ?? null,
      handled: parsed.handled ?? {},
    };
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

/**
 * Write deterministically (submission ids in numeric order, stable key order,
 * trailing newline) via a temp-file rename, so a crash cannot leave a truncated
 * state file and so git diffs stay to the lines that actually changed.
 */
export function saveState(state: InboxState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  const handled: Record<string, HandledEntry> = {};
  for (const key of Object.keys(state.handled).sort((a, b) => Number(a) - Number(b))) {
    const e = state.handled[key];
    handled[key] = { outcome: e.outcome, at: e.at, resendId: e.resendId, digest: e.digest };
  }
  const ordered: InboxState = {
    version: state.version ?? 1,
    watermarkTs: state.watermarkTs ?? null,
    lastRunAt: state.lastRunAt ?? null,
    handled,
  };
  const tmp = `${STATE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(ordered, null, 2) + "\n");
  renameSync(tmp, STATE_PATH);
}

// ---- CLI ------------------------------------------------------------------

const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const exact = argv.indexOf(name);
  if (exact >= 0) return argv[exact + 1];
  const inline = argv.find((a) => a.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : undefined;
}

function usage(): never {
  console.error("Usage:");
  console.error("  inbox-state.ts show");
  console.error(
    "  inbox-state.ts record --submission-id <n> --outcome replied|no-reply-needed " +
      '[--resend-id <id>] [--digest "…"] [--watermark <ts>]',
  );
  process.exit(2);
}

function main(): void {
  const command = argv[0];

  if (command === "show") {
    const state = loadState();
    process.stdout.write(JSON.stringify(state, null, 2) + "\n");
    const count = Object.keys(state.handled).length;
    console.error(
      `# ${count} submission(s) recorded · watermark ${state.watermarkTs ?? "—"} · last run ${state.lastRunAt ?? "—"}`,
    );
    return;
  }

  if (command !== "record") usage();

  const submissionIdRaw = flagValue("--submission-id");
  const submissionId = Number(submissionIdRaw);
  if (!submissionIdRaw || !Number.isInteger(submissionId) || submissionId <= 0) {
    console.error("ERROR: --submission-id is required and must be a positive integer.");
    usage();
  }

  const outcome = flagValue("--outcome");
  if (outcome !== "replied" && outcome !== "no-reply-needed") {
    console.error('ERROR: --outcome must be "replied" or "no-reply-needed".');
    usage();
  }

  const watermark = flagValue("--watermark");
  if (watermark !== undefined && !/^\d+\.\d+$/.test(watermark)) {
    console.error('ERROR: --watermark must be a Slack ts like "1753600000.123456".');
    process.exit(2);
  }

  const state = loadState();
  const now = new Date().toISOString();
  const prior = state.handled[String(submissionId)];

  state.handled[String(submissionId)] = {
    outcome,
    at: now,
    // Keep a prior value when the flag is omitted on a re-record, so a rerun to
    // fix the digest cannot erase the Resend id that proves the email went out.
    resendId: flagValue("--resend-id") ?? prior?.resendId ?? "",
    digest: flagValue("--digest") ?? prior?.digest ?? "",
  };
  state.lastRunAt = now;
  if (watermark) state.watermarkTs = watermark;

  saveState(state);

  process.stdout.write(
    JSON.stringify(
      { submissionId, ...state.handled[String(submissionId)], watermarkTs: state.watermarkTs },
      null,
      2,
    ) + "\n",
  );
}

main();
