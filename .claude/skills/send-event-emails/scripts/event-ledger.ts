/**
 * The committed memory of which event-stage emails have actually gone out.
 *
 * Email is the one action in this repo that cannot be undone. A batch send is a
 * loop over chunk files, and a loop can die halfway — rate limit, expired token,
 * a closed laptop. Without a record, the only two options after a half-finished
 * send are "send nothing more" (some registrants never get the room number) or
 * "start again" (the first eighty get it twice). This ledger makes the third
 * option possible: record every chunk the moment it succeeds, then resume from
 * the next one.
 *
 * It stores sha256 hashes of lowercased addresses, never addresses. That is what
 * lets the file be committed: the team keeps a durable "who has been emailed"
 * record in git without putting a single attendee's address in the repository.
 * `scripts/email/build-batch.ts --exclude-hashes` reads exactly this shape (it
 * walks any JSON tree for `recipientHashes` arrays), so `hashes` output feeds
 * straight back in as the de-duplication input for the next run.
 *
 * Usage:
 *   npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts show [--slug <s>] [--json]
 *   npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts start --slug <s> --stage <st> --manifest <manifest.json> [--force]
 *   npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts record-chunk --slug <s> --stage <st> --chunk <n> --resend-id <id> [--resend-id <id> …] [--manifest <p>]
 *   npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts finish --slug <s> --stage <st> --digest "…"
 *   npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts hashes --slug <s> --stage <st> [--out <path>]
 *
 * Flags:
 *   --slug        Event slug, exactly as `resolve-event.ts` printed it.
 *   --stage       welcome | week-before | day-before | thank-you.
 *   --manifest    A `batch-<key>-<stage>.manifest.json` from build-batch.ts.
 *                 Recorded at `start` and reused by `record-chunk`.
 *   --chunk       1-based chunk number, matching the manifest's ordering.
 *   --resend-id   An id returned by `resend emails batch`. Repeatable — the
 *                 batch endpoint returns one id per message, so pass them all
 *                 (or just the first; the count is what matters for an audit).
 *   --force       Re-open a stage already marked complete. Requires a human to
 *                 have named the event AND the stage out loud.
 *   --out         Write `hashes` output to a file instead of stdout.
 *   --json        Machine-readable output (show).
 *
 * The state file is committed. Never hand-edit it — go through this script so
 * ordering stays deterministic and diffs stay small.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** …/.claude/skills/send-event-emails */
const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
/** repo root — three levels above the skill root (…/.claude/skills/<skill>) */
const REPO_ROOT = resolve(SKILL_ROOT, "..", "..", "..");
const STATE_PATH = resolve(SKILL_ROOT, "state", "event-emails.json");

/**
 * Stores a path in the committed ledger as a repo-relative POSIX path.
 *
 * The ledger is committed, so an absolute `D:\…` path would make every teammate's
 * diff churn and would be meaningless on anyone else's machine. Paths outside the
 * repo are kept absolute — there is nothing better to say about them.
 */
function toPortablePath(path: string): string {
  const absolute = resolve(path);
  const rel = relative(REPO_ROOT, absolute);
  if (rel.length === 0 || rel.startsWith("..") || isAbsolute(rel)) return absolute;
  return rel.split("\\").join("/");
}

/** Resolves a ledger-stored path back to something the filesystem accepts. */
function fromPortablePath(path: string): string {
  return isAbsolute(path) ? path : resolve(REPO_ROOT, path);
}

/** The four stages this skill sends. Anything else is almost certainly a typo. */
const KNOWN_STAGES = ["welcome", "week-before", "day-before", "thank-you"] as const;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type StageStatus = "in-progress" | "complete";

interface StageState {
  startedAt: string;
  /** Set when the stage is finished; null while chunks remain. */
  sentAt: string | null;
  recipientCount: number;
  /** sha256 of each lowercased address ALREADY emailed in this stage. */
  recipientHashes: string[];
  chunksSent: number;
  chunksTotal: number;
  resendIds: string[];
  status: StageStatus;
  /** Where `record-chunk` reads chunk membership from. */
  manifestPath: string;
  /**
   * Fingerprint of the manifest's chunk composition.
   *
   * Rebuilding with `--exclude-hashes` produces a SMALLER manifest whose chunk
   * numbering restarts at 1, so `chunksSent` from the previous manifest is
   * meaningless against it. Comparing this catches the swap and resets the
   * counter instead of letting `finish` declare a stage complete that never
   * sent its remaining chunks.
   */
  manifestFingerprint: string;
}

interface EventState {
  stages: Record<string, StageState>;
  digest: string;
}

interface Ledger {
  version: number;
  events: Record<string, EventState>;
}

const EMPTY_LEDGER: Ledger = { version: 1, events: {} };

function loadLedger(): Ledger {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY_LEDGER);
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8")) as Partial<Ledger>;
    return { version: parsed.version ?? 1, events: parsed.events ?? {} };
  } catch (error) {
    fail(
      `${STATE_PATH} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      "This file is the only record of who has already been emailed. Do NOT send",
      "anything until it is readable again — restore it from git rather than",
      "deleting it, or the next run will re-mail everyone."
    );
  }
}

/**
 * Writes the ledger deterministically and atomically.
 *
 * Slugs and stages are sorted and keys emitted in a fixed order so a commit
 * diff shows only what changed. The temp-file rename means a crash mid-write
 * cannot leave a truncated ledger — which would read as "nobody has been
 * emailed" and cause a duplicate send.
 */
function saveLedger(ledger: Ledger): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });

  const ordered: Ledger = { version: ledger.version ?? 1, events: {} };
  for (const slug of Object.keys(ledger.events).sort()) {
    const event = ledger.events[slug];
    const stages: Record<string, StageState> = {};
    for (const stage of Object.keys(event.stages ?? {}).sort()) {
      const state = event.stages[stage];
      stages[stage] = {
        startedAt: state.startedAt,
        sentAt: state.sentAt,
        recipientCount: state.recipientCount,
        recipientHashes: [...state.recipientHashes].sort(),
        chunksSent: state.chunksSent,
        chunksTotal: state.chunksTotal,
        resendIds: state.resendIds,
        status: state.status,
        manifestPath: state.manifestPath,
        manifestFingerprint: state.manifestFingerprint,
      };
    }
    ordered.events[slug] = { stages, digest: event.digest ?? "" };
  }

  const temp = `${STATE_PATH}.tmp`;
  writeFileSync(temp, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  renameSync(temp, STATE_PATH);
}

// ---------------------------------------------------------------------------
// Manifest reading
// ---------------------------------------------------------------------------

interface ManifestChunk {
  file: string;
  count: number;
  recipientHashes: string[];
  idempotencyKey: string;
}

interface BatchManifest {
  key: string;
  stage: string;
  chunks: ManifestChunk[];
  totalRecipients: number;
}

/** Reads and shape-checks a build-batch.ts manifest. */
function readManifest(path: string): BatchManifest {
  const absolute = resolve(path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(
      `could not read the manifest at ${absolute}`,
      error instanceof Error ? error.message : String(error),
      "Rebuild it with: npx tsx scripts/email/build-batch.ts <spec.json> --recipients … --stage <stage>"
    );
  }

  const manifest = raw as Partial<BatchManifest>;
  if (!Array.isArray(manifest.chunks) || manifest.chunks.length === 0) {
    fail(`${absolute} has no "chunks" array — it is not a build-batch.ts manifest.`);
  }
  for (const chunk of manifest.chunks) {
    if (!Array.isArray(chunk.recipientHashes)) {
      fail(`${absolute} has a chunk with no "recipientHashes" — regenerate it.`);
    }
  }

  return {
    key: typeof manifest.key === "string" ? manifest.key : "",
    stage: typeof manifest.stage === "string" ? manifest.stage : "",
    chunks: manifest.chunks,
    totalRecipients:
      typeof manifest.totalRecipients === "number"
        ? manifest.totalRecipients
        : manifest.chunks.reduce((sum, chunk) => sum + (chunk.count ?? 0), 0),
  };
}

/**
 * Order-sensitive fingerprint of which addresses sit in which chunk.
 *
 * Two manifests with the same fingerprint are interchangeable, so a resumed run
 * can keep counting from where it stopped. Any other change — a rebuild after
 * `--exclude-hashes`, a different chunk size, a re-export with one more
 * registrant — produces a different fingerprint and forces the counter back to
 * zero rather than silently mis-numbering the remaining chunks.
 */
function fingerprintManifest(manifest: BatchManifest): string {
  const composition = manifest.chunks
    .map((chunk) => [...chunk.recipientHashes].sort().join(","))
    .join("|");
  return `sha256:${createHash("sha256").update(composition).digest("hex").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// CLI plumbing
// ---------------------------------------------------------------------------

function fail(message: string, ...details: string[]): never {
  console.error(`Error: ${message}`);
  for (const line of details) console.error(line);
  process.exit(1);
}

const VALUE_FLAGS = new Set([
  "--slug",
  "--stage",
  "--manifest",
  "--chunk",
  "--resend-id",
  "--digest",
  "--out",
]);

function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || (value.startsWith("--") && VALUE_FLAGS.has(value))) {
    fail(`${flag} requires a value.`);
  }
  return value;
}

/** Collects every occurrence of a repeatable `--flag value`. */
function readAllOptions(argv: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== flag) continue;
    const value = argv[index + 1];
    if (value === undefined) fail(`${flag} requires a value.`);
    values.push(value);
  }
  return values;
}

function requireSlug(argv: string[]): string {
  const slug = readOption(argv, "--slug");
  if (!slug) fail("--slug is required (the slug resolve-event.ts printed).");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    fail(`--slug "${slug}" must be kebab-case — copy it from resolve-event.ts.`);
  }
  return slug;
}

function requireStage(argv: string[]): string {
  const stage = readOption(argv, "--stage");
  if (!stage) fail(`--stage is required. One of: ${KNOWN_STAGES.join(", ")}.`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(stage)) {
    fail(`--stage "${stage}" must be kebab-case.`);
  }
  if (!(KNOWN_STAGES as readonly string[]).includes(stage)) {
    // Not fatal — a one-off ("venue-change") is legitimate. But the stage name
    // is half the de-duplication key, so a typo silently creates a second stage
    // that will happily re-mail everyone.
    console.error(
      `Note: "${stage}" is not one of the standard stages (${KNOWN_STAGES.join(", ")}).\n` +
        "      Check the spelling — a typo here creates a NEW stage that shares no\n" +
        "      already-sent hashes with the one you meant."
    );
  }
  return stage;
}

/** Normalizes an address the same way build-batch.ts does, then hashes it. */
function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** Renders one stage as an aligned console block. */
function describeStage(stage: string, state: StageState): string[] {
  const remaining = state.chunksTotal - state.chunksSent;
  const lines = [
    `    ${stage}`,
    `      status        ${state.status}${state.status === "in-progress" && remaining > 0 ? ` — ${remaining} chunk(s) still to send` : ""}`,
    `      chunks        ${state.chunksSent}/${state.chunksTotal}`,
    `      emailed       ${state.recipientHashes.length} of ${state.recipientCount} recipient(s)`,
    `      started       ${state.startedAt}`,
  ];
  if (state.sentAt) lines.push(`      finished      ${state.sentAt}`);
  if (state.resendIds.length > 0) {
    lines.push(`      resend ids    ${state.resendIds.length} recorded (first: ${state.resendIds[0]})`);
  }
  return lines;
}

function commandShow(argv: string[]): void {
  const ledger = loadLedger();
  const slug = readOption(argv, "--slug");
  const json = argv.includes("--json");

  const slugs = slug ? [slug] : Object.keys(ledger.events).sort();

  if (json) {
    const events: Record<string, EventState> = {};
    for (const key of slugs) if (ledger.events[key]) events[key] = ledger.events[key];
    console.log(JSON.stringify({ version: ledger.version, events }, null, 2));
    return;
  }

  if (slugs.length === 0) {
    console.log("No event emails recorded yet — the ledger is empty.");
    return;
  }

  for (const key of slugs) {
    const event = ledger.events[key];
    if (!event) {
      console.log(`${key}`);
      console.log("  nothing recorded for this event yet.");
      console.log("");
      continue;
    }
    console.log(key);
    if (event.digest) console.log(`  ${event.digest}`);
    const stages = Object.keys(event.stages).sort();
    if (stages.length === 0) console.log("    (no stages)");
    for (const stage of stages) {
      for (const line of describeStage(stage, event.stages[stage])) console.log(line);
    }
    console.log("");
  }

  const unfinished = slugs
    .flatMap((key) =>
      Object.entries(ledger.events[key]?.stages ?? {}).map(([stage, state]) => ({ key, stage, state }))
    )
    .filter((entry) => entry.state.status === "in-progress");

  if (unfinished.length > 0) {
    console.log("Unfinished sends — resume these, never restart them:");
    for (const entry of unfinished) {
      console.log(
        `  ${entry.key} / ${entry.stage} — chunks ${entry.state.chunksSent + 1}..${entry.state.chunksTotal} of ${entry.state.chunksTotal} still to go`
      );
    }
  }
}

function commandStart(argv: string[]): void {
  const slug = requireSlug(argv);
  const stage = requireStage(argv);
  const manifestPath = readOption(argv, "--manifest");
  if (!manifestPath) fail("--manifest is required (the manifest build-batch.ts wrote).");
  const force = argv.includes("--force");

  const manifest = readManifest(manifestPath);
  const ledger = loadLedger();
  const event = ledger.events[slug] ?? { stages: {}, digest: "" };
  const existing = event.stages[stage];

  if (existing && existing.status === "complete" && !force) {
    fail(
      `${slug} / ${stage} is already complete (${existing.recipientHashes.length} recipients, finished ${existing.sentAt}).`,
      "",
      "Sent email cannot be recalled, so this refuses by default. Two legitimate cases:",
      "  - New registrations since the send → build with --exclude-hashes so the",
      "    already-emailed are skipped, then re-run this with --force.",
      "  - A genuine correction the user asked for by name → --force.",
      "Anything else: leave it alone."
    );
  }

  if (existing && existing.status === "in-progress") {
    console.log(
      `RESUMING — ${slug} / ${stage} was already started: ${existing.chunksSent}/${existing.chunksTotal} chunks sent, ` +
        `${existing.recipientHashes.length} recipient(s) already emailed.`
    );
    console.log("");
  }

  const fingerprint = fingerprintManifest(manifest);
  const rebuilt = existing !== undefined && existing.manifestFingerprint !== fingerprint;
  if (rebuilt && existing) {
    console.log(
      "The batch was rebuilt since this stage started, so chunk numbering restarts at 1."
    );
    console.log(
      `The ${existing.recipientHashes.length} recipient(s) already emailed stay recorded and are excluded from`
    );
    console.log(`the new manifest — check that against build-batch.ts's "Skipped" line.`);
    console.log("");
  }

  const alreadyEmailed = existing?.recipientHashes ?? [];

  const state: StageState = {
    startedAt: existing?.startedAt ?? nowIso(),
    sentAt: null,
    // A rebuilt manifest holds only the people still to reach, so the stage's
    // true size is those plus everyone already emailed. Without this the report
    // reads "3 of 1", which looks like a bug in the ledger rather than the
    // intended arithmetic of a resumed send.
    recipientCount: rebuilt ? alreadyEmailed.length + manifest.totalRecipients : manifest.totalRecipients,
    recipientHashes: alreadyEmailed,
    chunksSent: rebuilt ? 0 : existing?.chunksSent ?? 0,
    chunksTotal: manifest.chunks.length,
    resendIds: existing?.resendIds ?? [],
    status: "in-progress",
    manifestPath: toPortablePath(manifestPath),
    manifestFingerprint: fingerprint,
  };

  event.stages[stage] = state;
  ledger.events[slug] = event;
  saveLedger(ledger);

  console.log(`Started ${slug} / ${stage}`);
  console.log(`  Manifest      ${state.manifestPath}`);
  console.log(`  Recipients    ${state.recipientCount}`);
  console.log(`  Chunks        ${state.chunksTotal}`);
  console.log(`  Already sent  ${state.chunksSent} chunk(s), ${state.recipientHashes.length} recipient(s)`);
  console.log("");
  console.log("Record EVERY chunk the moment it succeeds — not at the end:");
  console.log(
    `  npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts record-chunk --slug ${slug} --stage ${stage} --chunk 1 --resend-id <id>`
  );
}

function commandRecordChunk(argv: string[]): void {
  const slug = requireSlug(argv);
  const stage = requireStage(argv);
  const chunkRaw = readOption(argv, "--chunk");
  if (!chunkRaw) fail("--chunk is required (the 1-based chunk number you just sent).");
  const chunk = Number(chunkRaw);
  if (!Number.isInteger(chunk) || chunk < 1) fail(`--chunk must be a positive integer (got "${chunkRaw}").`);

  const resendIds = readAllOptions(argv, "--resend-id");
  if (resendIds.length === 0) {
    fail(
      "--resend-id is required.",
      "It is the proof the chunk actually left Resend. Recording a chunk that did",
      "not send is how a hundred people silently never get the email."
    );
  }

  const ledger = loadLedger();
  const event = ledger.events[slug];
  const state = event?.stages[stage];
  if (!state) {
    fail(
      `${slug} / ${stage} was never started.`,
      "Run `event-ledger.ts start --slug … --stage … --manifest …` first — it reads the",
      "manifest that says which addresses are in which chunk."
    );
  }

  const manifestPath = fromPortablePath(readOption(argv, "--manifest") ?? state.manifestPath);
  const manifest = readManifest(manifestPath);

  const fingerprint = fingerprintManifest(manifest);
  if (state.manifestFingerprint && state.manifestFingerprint !== fingerprint) {
    fail(
      `the manifest at ${manifestPath} is not the one this stage was started with.`,
      "",
      "It has been rebuilt, so chunk numbers no longer mean what the ledger thinks",
      `they mean — recording "chunk ${chunk}" now would credit the wrong people.`,
      "",
      "Re-run `start` with the new manifest first; it keeps the already-emailed",
      "hashes and resets the chunk counter to match."
    );
  }

  if (chunk > manifest.chunks.length) {
    fail(
      `chunk ${chunk} does not exist — the manifest has ${manifest.chunks.length} chunk(s).`,
      `Manifest: ${manifestPath}`
    );
  }

  const hashes = manifest.chunks[chunk - 1].recipientHashes.map((hash) => hash.toLowerCase());
  const before = new Set(state.recipientHashes);
  const added = hashes.filter((hash) => !before.has(hash));

  if (added.length === 0) {
    console.log(
      `Chunk ${chunk} of ${slug} / ${stage} was already recorded — nothing changed. ` +
        "Safe to ignore; this command is idempotent."
    );
    return;
  }

  state.recipientHashes = [...before, ...added];
  state.chunksSent = Math.max(state.chunksSent, chunk);
  state.resendIds = [...state.resendIds, ...resendIds];
  state.manifestPath = toPortablePath(manifestPath);
  state.manifestFingerprint = fingerprint;
  saveLedger(ledger);

  const remaining = state.chunksTotal - state.chunksSent;
  console.log(
    `Recorded chunk ${chunk}/${state.chunksTotal} — ${added.length} recipient(s), ` +
      `${state.recipientHashes.length} emailed so far.`
  );
  if (remaining > 0) {
    console.log(`  ${remaining} chunk(s) left. Wait 600ms, then send chunk ${state.chunksSent + 1}.`);
  } else {
    console.log(
      `  All chunks sent. Close the stage:\n` +
        `  npx tsx .claude/skills/send-event-emails/scripts/event-ledger.ts finish --slug ${slug} --stage ${stage} --digest "…"`
    );
  }
}

function commandFinish(argv: string[]): void {
  const slug = requireSlug(argv);
  const stage = requireStage(argv);
  const digest = readOption(argv, "--digest");

  const ledger = loadLedger();
  const event = ledger.events[slug];
  const state = event?.stages[stage];
  if (!state) fail(`${slug} / ${stage} was never started — nothing to finish.`);

  if (state.chunksSent < state.chunksTotal) {
    const missing = Math.max(state.recipientCount - state.recipientHashes.length, 1);
    fail(
      `${slug} / ${stage} is not finished: ${state.chunksSent}/${state.chunksTotal} chunks sent.`,
      "",
      `Chunks ${state.chunksSent + 1}..${state.chunksTotal} have NOT been emailed. Send them and`,
      "record each one, then finish. Marking it complete now would silently drop",
      `${missing} ${missing === 1 ? "person" : "people"} from this stage.`
    );
  }

  state.status = "complete";
  state.sentAt = nowIso();
  if (digest !== null) event.digest = digest;
  saveLedger(ledger);

  console.log(`Completed ${slug} / ${stage}`);
  console.log(`  Recipients    ${state.recipientHashes.length}`);
  console.log(`  Chunks        ${state.chunksSent}/${state.chunksTotal}`);
  console.log(`  Finished      ${state.sentAt}`);
  if (event.digest) console.log(`  Digest        ${event.digest}`);
  console.log("");
  console.log("Commit state/event-emails.json — it is what stops the next run re-mailing these people.");
}

function commandHashes(argv: string[]): void {
  const slug = requireSlug(argv);
  const stage = requireStage(argv);
  const out = readOption(argv, "--out");

  const ledger = loadLedger();
  const state = ledger.events[slug]?.stages[stage];

  // An unknown stage is not an error: before the first send there is nothing to
  // exclude, and emitting an empty list keeps the caller's command identical on
  // the first run and every resumed one.
  const payload = {
    slug,
    stage,
    status: state?.status ?? "not-started",
    chunksSent: state?.chunksSent ?? 0,
    chunksTotal: state?.chunksTotal ?? 0,
    recipientHashes: state?.recipientHashes ?? [],
  };
  const text = `${JSON.stringify(payload, null, 2)}\n`;

  if (out) {
    const absolute = resolve(out);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, text, "utf8");
    console.log(`Wrote ${absolute} — ${payload.recipientHashes.length} already-emailed hash(es).`);
    console.log("");
    console.log("Feed it to the builder so those people are skipped:");
    console.log(
      `  npx tsx scripts/email/build-batch.ts <spec.json> --recipients <recipients-*.json> --stage ${stage} --exclude-hashes "${absolute}"`
    );
    return;
  }

  process.stdout.write(text);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const USAGE = [
  "Usage:",
  "  event-ledger.ts show [--slug <s>] [--json]",
  "  event-ledger.ts start --slug <s> --stage <st> --manifest <manifest.json> [--force]",
  "  event-ledger.ts record-chunk --slug <s> --stage <st> --chunk <n> --resend-id <id>",
  "  event-ledger.ts finish --slug <s> --stage <st> --digest \"…\"",
  "  event-ledger.ts hashes --slug <s> --stage <st> [--out <path>]",
  "",
  `Stages: ${KNOWN_STAGES.join(", ")}`,
].join("\n");

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  switch (command) {
    case "show":
      commandShow(argv);
      return;
    case "start":
      commandStart(argv);
      return;
    case "record-chunk":
      commandRecordChunk(argv);
      return;
    case "finish":
      commandFinish(argv);
      return;
    case "hashes":
      commandHashes(argv);
      return;
    default:
      if (command) console.error(`Unknown command: ${command}`);
      console.error(USAGE);
      process.exit(1);
  }
}

void main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
