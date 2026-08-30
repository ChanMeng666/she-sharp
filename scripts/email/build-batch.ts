/**
 * Renders one `MessageSpec` for a whole recipient list and writes the chunked
 * JSON files that `resend emails batch --file` accepts.
 *
 * This is the step between "we agreed on the copy" and "mail leaves the
 * building", and it is deliberately the place where a bad send dies:
 *
 *  - The audience rule is enforced first (`assertSendAllowed`), so a marketing
 *    email aimed at event registrants stops here with an explanation rather
 *    than in someone's inbox.
 *  - Every message is rendered per recipient, and the first one is put through
 *    the strict broadcast gates. If the gates fail, nothing is written at all —
 *    a 120KB email or a WebP hero is a whole-list problem, not a per-message one.
 *  - Anyone whose hash appears in a previous run's manifest is skipped, so a
 *    resumed or repeated send cannot double-mail.
 *  - Each message carries a deterministic `X-Entity-Ref-ID` header derived from
 *    key + stage + address + subject, which is Resend's per-message
 *    de-duplication hook: re-running the same chunk cannot deliver twice.
 *
 * Nothing here sends. It writes files and prints the commands a human runs.
 *
 * Usage:
 *   npx tsx scripts/email/build-batch.ts <spec.json> --recipients <recipients-*.json> \
 *     --stage <name> [--exclude-hashes <ledger.json>] [--chunk 100] \
 *     [--out-dir tmp/emails] [--json]
 *
 * Flags:
 *   <spec.json>        A MessageSpec (see lib/email/message.ts).
 *   --recipients       A recipients-<key>.json from normalize-recipients.ts.
 *   --stage            Names this send within the campaign, e.g. "reminder-1".
 *                      Part of the idempotency key: change it and the same
 *                      person can be mailed again, keep it and they cannot.
 *   --exclude-hashes   A previous manifest/ledger JSON; every `recipientHashes`
 *                      array found anywhere inside it is skipped.
 *   --chunk            Messages per file (default 100, the Resend API maximum).
 *   --out-dir          Output directory (default tmp/emails).
 *   --json             Machine-readable summary instead of prose.
 *
 * Output:
 *   <out-dir>/batch-<key>-<stage>-<n>.json  — array of Resend batch email objects
 *   <out-dir>/batch-<key>-<stage>.manifest.json
 *     { key, recipientsKey, stage, chunks: [{ file, count, recipientHashes }],
 *       totalRecipients, skipped }
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMessageSpec, type MessageSpec } from "../../lib/email/message";
import { composeMessage } from "../../lib/email/compose";
import { runEmailGates, formatGateReport } from "../../lib/email/gates";
import { assertSendAllowed, describeTier, type AudienceTier } from "../../lib/email/audience";
import {
  buildUnsubscribeHeaders,
  substituteUnsubscribeUrl,
} from "../../lib/email/unsubscribe-headers";
import { getBaseUrl } from "../../lib/email/service";
import { hashEmail } from "./suppression";

/** Resend refuses more than 100 messages in one batch request. */
const MAX_CHUNK = 100;

/**
 * 600ms between chunks — a deliberate margin, not the documented limit.
 *
 * Resend's rate limit is **10 requests/second per team**, raisable on request,
 * and it is the same on every plan; this comment claimed "the free tier allows
 * 2/second" until 2026-08-30, which was wrong on both the number and the reason
 * (She Sharp has been on Transactional Pro since 2026-08-28). The pacing stays
 * because the limit is per *team*: a full-list send shares it with whatever
 * transactional mail the live site is emitting at the same moment, and 600ms
 * costs about ten seconds across sixteen chunks. Do not shorten it for speed.
 */
const CHUNK_DELAY_MS = 600;

/** Length of the per-message de-duplication key. */
const IDEMPOTENCY_KEY_LENGTH = 32;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecipientsFile {
  key: string;
  source?: string;
  tier: AudienceTier;
  consentSource?: string | null;
  consentDate?: string | null;
  recipients: { email: string; firstName?: string | null; lastName?: string | null }[];
  excluded?: { reason: string }[];
  counts?: Record<string, number>;
}

/** One entry of the array `resend emails batch --file` consumes. */
interface BatchEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}

interface ChunkManifest {
  file: string;
  count: number;
  /** sha256 of each lowercased address in this chunk — no plaintext in the ledger. */
  recipientHashes: string[];
  /** Batch-level idempotency key for the `resend emails batch` request. */
  idempotencyKey: string;
}

interface Manifest {
  key: string;
  recipientsKey: string;
  stage: string;
  createdAt: string;
  tier: AudienceTier;
  chunks: ChunkManifest[];
  totalRecipients: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface Args {
  spec: string;
  recipients: string;
  stage: string;
  excludeHashes: string | null;
  chunk: number;
  outDir: string;
  json: boolean;
}

function fail(message: string, ...details: string[]): never {
  console.error(`Error: ${message}`);
  for (const line of details) console.error(line);
  process.exit(1);
}

const VALUE_FLAGS = new Set(["--recipients", "--stage", "--exclude-hashes", "--chunk", "--out-dir"]);

function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (VALUE_FLAGS.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) continue;
    positional.push(arg);
  }

  const spec = positional[0];
  if (!spec) {
    fail(
      "no spec file given.",
      "Usage: npx tsx scripts/email/build-batch.ts <spec.json> --recipients <recipients-*.json> --stage <name>"
    );
  }

  const recipients = readOption(argv, "--recipients");
  if (!recipients) fail("--recipients is required (a recipients-<key>.json from normalize-recipients.ts).");

  const stage = readOption(argv, "--stage");
  if (!stage) {
    fail(
      "--stage is required.",
      'It names this send within the campaign ("invite", "reminder-1", "thanks") and',
      "is part of every message's idempotency key, so re-running the same stage cannot",
      "deliver twice."
    );
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(stage)) {
    fail(`--stage "${stage}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }

  const chunkRaw = readOption(argv, "--chunk");
  let chunk = MAX_CHUNK;
  if (chunkRaw !== null) {
    chunk = Number(chunkRaw);
    if (!Number.isInteger(chunk) || chunk < 1) fail(`--chunk must be a positive integer (got "${chunkRaw}").`);
    if (chunk > MAX_CHUNK) {
      fail(`--chunk cannot exceed ${MAX_CHUNK} — that is the Resend batch API's hard limit.`);
    }
  }

  return {
    spec,
    recipients,
    stage,
    excludeHashes: readOption(argv, "--exclude-hashes"),
    chunk,
    outDir: readOption(argv, "--out-dir") ?? "tmp/emails",
    json: argv.includes("--json"),
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function readJson(path: string, label: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return fail(`could not read the ${label} file: ${path}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fail(`${path} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Validates the parts of a recipients file this script depends on. */
function parseRecipientsFile(raw: unknown, path: string): RecipientsFile {
  if (typeof raw !== "object" || raw === null) fail(`${path} must contain a JSON object.`);
  const file = raw as Partial<RecipientsFile>;

  if (typeof file.key !== "string" || file.key.length === 0) {
    fail(`${path} is missing a "key". Regenerate it with normalize-recipients.ts.`);
  }
  if (![0, 1, 2, 3].includes(file.tier as number)) {
    fail(
      `${path} has no valid "tier" (got ${JSON.stringify(file.tier)}).`,
      "The tier decides what may be sent to this list, so it cannot be guessed."
    );
  }
  if (!Array.isArray(file.recipients)) fail(`${path} is missing a "recipients" array.`);

  const recipients = file.recipients.filter(
    (entry): entry is RecipientsFile["recipients"][number] =>
      typeof entry === "object" && entry !== null && typeof entry.email === "string"
  );
  if (recipients.length === 0) fail(`${path} contains no recipients.`);

  return {
    key: file.key,
    source: typeof file.source === "string" ? file.source : undefined,
    tier: file.tier as AudienceTier,
    consentSource: file.consentSource ?? null,
    consentDate: file.consentDate ?? null,
    recipients,
    excluded: Array.isArray(file.excluded) ? file.excluded : [],
    counts: file.counts,
  };
}

/**
 * Collects every `recipientHashes` array anywhere in a JSON tree.
 *
 * The ledger format is owned by the calling skill and may nest manifests under
 * runs, stages or dates. Walking for the key rather than assuming a shape means
 * a ledger reorganisation can never silently stop de-duplicating.
 *
 * @param value Any parsed JSON value.
 * @returns Every hash found, deduplicated and lowercased.
 */
export function collectRecipientHashes(value: unknown): Set<string> {
  const found = new Set<string>();

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "recipientHashes" && Array.isArray(child)) {
        for (const hash of child) {
          if (typeof hash === "string") found.add(hash.toLowerCase());
        }
        continue;
      }
      walk(child);
    }
  };

  walk(value);
  return found;
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/**
 * Deterministic per-message de-duplication key.
 *
 * Includes the subject hash so that editing the copy and re-sending is possible
 * (a genuinely different message gets a different key) while re-running the
 * same stage with the same copy is not (identical inputs, identical key).
 */
export function idempotencyKey(key: string, stage: string, email: string, subjectHash: string): string {
  return createHash("sha256")
    .update(`${key}|${stage}|${email}|${subjectHash}`)
    .digest("hex")
    .slice(0, IDEMPOTENCY_KEY_LENGTH);
}

/** Substitutes the literal `{firstName}` placeholder, matching compose.tsx. */
function personalizeSubject(subject: string, firstName: string | null | undefined): string {
  return subject.split("{firstName}").join(firstName?.trim() || "there");
}

/** Escapes a literal string for use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const specPath = resolve(args.spec);
  let spec: MessageSpec;
  try {
    spec = parseMessageSpec(readJson(specPath, "spec"));
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }

  const recipientsPath = resolve(args.recipients);
  const list = parseRecipientsFile(readJson(recipientsPath, "recipients"), recipientsPath);

  // Gate 1 — the audience rule. Before rendering, before writing, before anything.
  try {
    assertSendAllowed({ category: spec.category, tier: list.tier });

  // Gate 1b — a marketing batch must be able to sign an unsubscribe token.
  //
  // `buildUnsubscribeHeaders()` returns {} when EMAIL_UNSUBSCRIBE_SECRET is
  // unset, and the body-link gate below would still pass on the template's own
  // footer link, so without this check a whole list ships with no working
  // one-click opt-out and nothing says so. Resend's AUP requires a frictionless
  // opt-out and the complaint ceiling is 0.08% account-wide, so this is a hard
  // failure rather than a warning: better to build nothing than to build a send
  // nobody can escape.
  if (spec.category === "marketing" && !process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    fail(
      "EMAIL_UNSUBSCRIBE_SECRET is not set, so no unsubscribe token can be signed.",
      "A marketing batch without List-Unsubscribe headers is a send with no one-click",
      "opt-out. Set the secret (it is on Vercel production) and build again.",
      "Nothing has been written."
    );
  }

  // Gate 1c — a marketing batch must be built against the production origin.
  //
  // Every unsubscribe URL is baked into the message at build time, so a batch
  // built with the default localhost BASE_URL ships a whole list an opt-out link
  // that resolves to the recipient's own machine. This is the failure that put
  // `localhost:3000` into 25 real mentor invitations on 2026-03-19; the repo rule
  // since then is that any script building URLs guards at startup rather than
  // relying on a downstream check. The gates would also catch it, but only after
  // a render and only because the URL happens to appear in the body.
  if (spec.category === "marketing") {
    const baseUrl = getBaseUrl();
    if (!/^https:\/\//.test(baseUrl) || /localhost|127\.0\.0\.1/.test(baseUrl)) {
      fail(
        `BASE_URL is "${baseUrl}", which cannot be used for a marketing batch.`,
        "Unsubscribe links are baked into every message at build time, so they would",
        "point at a machine the recipient does not have. Set BASE_URL to the production",
        "origin (https://www.shesharp.org.nz) and build again.",
        "Nothing has been written."
      );
    }
  }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Gate 2 — already-sent hashes from a previous run's manifest/ledger.
  const alreadySent = args.excludeHashes
    ? collectRecipientHashes(readJson(resolve(args.excludeHashes), "exclude-hashes"))
    : new Set<string>();

  const pending = list.recipients.filter((recipient) => !alreadySent.has(hashEmail(recipient.email)));
  const skipped = list.recipients.length - pending.length;
  if (pending.length === 0) {
    console.log(
      `Nothing to build: all ${list.recipients.length} recipients already appear in ` +
        `${args.excludeHashes}. This stage is complete.`
    );
    return;
  }

  const subjectHash = createHash("sha256").update(spec.subject).digest("hex");
  const emails: BatchEmail[] = [];
  let firstRender: { html: string; text: string } | null = null;

  for (const recipient of pending) {
    const composed = await composeMessage(spec, {
      mode: "broadcast",
      recipient: { firstName: recipient.firstName, email: recipient.email },
    });

    // Swap the template's unsubscribe placeholder for this person's signed URL.
    // A no-op for anything that does not carry one, and it throws rather than
    // shipping a message whose opt-out link does not work.
    const rendered = {
      html: substituteUnsubscribeUrl(composed.html, recipient.email, getBaseUrl()),
      text: substituteUnsubscribeUrl(composed.text, recipient.email, getBaseUrl()),
    };

    // The batch endpoint substitutes NOTHING. Merge tags are a feature of Resend
    // broadcasts against Resend-held contacts, and `runEmailGates` still permits
    // `{{{contact.first_name}}}` because the broadcast path is legitimate — but
    // on this path a surviving tag reaches a real inbox as literal text. Checked
    // per message rather than once, because only the first render is gated.
    for (const [part, content] of [["html", rendered.html], ["text", rendered.text]] as const) {
      const leftover = content.match(/\{\{\{[^{}]*\}\}\}/);
      if (leftover) {
        fail(
          `A merge tag survived into the ${part}: ${leftover[0]}`,
          "The Resend batch endpoint substitutes nothing — merge tags only work for",
          "broadcasts against Resend-held contacts, so this would be delivered as",
          "literal text. Replace it with a value the template can render itself.",
          "Nothing has been written."
        );
      }
    }

    if (!firstRender) {
      firstRender = { html: rendered.html, text: rendered.text };
      // Gate 3 — the strict broadcast gates, on a real rendered message. Run
      // before the rest of the list is built so a failure costs one render.
      const report = runEmailGates(rendered.html, rendered.text, spec, { mode: "broadcast" });
      console.log(formatGateReport(report));
      console.log("");
      if (!report.ok) {
        console.error("Blocked: the rendered message failed the pre-send gates. Nothing written.");
        process.exit(1);
      }
    }

    const email: BatchEmail = {
      from: spec.from,
      to: [recipient.email],
      subject:
        spec.engine === "layout" ? personalizeSubject(spec.subject, recipient.firstName) : spec.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        // Resend's documented per-message de-duplication header. The batch
        // endpoint has no per-message `idempotencyKey` field — its
        // `--idempotency-key` is request-level — so this is where a per-person
        // key can live.
        "X-Entity-Ref-ID": idempotencyKey(spec.key, args.stage, recipient.email, subjectHash),
        // Marketing mail carries a signed, per-recipient one-click opt-out.
        // This path never touches `sendEmail()`, so nothing else would attach
        // them — and Resend only attached them to broadcasts, which this
        // replaces. The secret was checked before any rendering happened.
        ...(spec.category === "marketing"
          ? buildUnsubscribeHeaders(recipient.email, getBaseUrl())
          : {}),
      },
    };
    if (spec.replyTo) email.replyTo = spec.replyTo;
    if (spec.tags) email.tags = spec.tags;

    emails.push(email);
  }

  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });

  const chunks = chunkArray(emails, args.chunk);

  // A resumed build produces fewer chunks than the first one. Leaving the old
  // trailing files on disk would leave a paste-able command that re-sends to
  // people who have already been mailed, so they go.
  const stalePattern = new RegExp(`^batch-${escapeRegExp(spec.key)}-${escapeRegExp(args.stage)}-(\\d+)\\.json$`);
  for (const name of readdirSync(outDir)) {
    const match = stalePattern.exec(name);
    if (match && Number(match[1]) > chunks.length) rmSync(resolve(outDir, name));
  }

  const chunkManifests: ChunkManifest[] = chunks.map((chunk, index) => {
    const file = resolve(outDir, `batch-${spec.key}-${args.stage}-${index + 1}.json`);
    writeFileSync(file, `${JSON.stringify(chunk, null, 2)}\n`, "utf8");
    return {
      file,
      count: chunk.length,
      recipientHashes: chunk.map((email) => hashEmail(email.to[0])),
      idempotencyKey: idempotencyKey(spec.key, `${args.stage}-chunk-${index + 1}`, "batch", subjectHash),
    };
  });

  const manifest: Manifest = {
    key: spec.key,
    recipientsKey: list.key,
    stage: args.stage,
    createdAt: new Date().toISOString(),
    tier: list.tier,
    chunks: chunkManifests,
    totalRecipients: emails.length,
    skipped,
  };
  const manifestPath = resolve(outDir, `batch-${spec.key}-${args.stage}.manifest.json`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
          key: spec.key,
          recipientsKey: list.key,
          stage: args.stage,
          tier: list.tier,
          totalRecipients: emails.length,
          skipped,
          chunks: chunkManifests.map((chunk) => ({ file: chunk.file, count: chunk.count })),
        },
        null,
        2
      )
    );
    return;
  }

  const estimatedSeconds = ((chunks.length - 1) * CHUNK_DELAY_MS) / 1000;

  console.log(`Built ${chunks.length} chunk file(s) in ${outDir}`);
  console.log("");
  console.log(`  Message       ${spec.key} (${spec.engine}, ${spec.category})`);
  console.log(`  Stage         ${args.stage}`);
  console.log(`  Audience      ${describeTier(list.tier)}`);
  console.log(`  Recipients    ${emails.length}`);
  if (skipped > 0) {
    console.log(`  Skipped       ${skipped} already sent (from ${basename(args.excludeHashes ?? "")})`);
  }
  if (list.excluded && list.excluded.length > 0) {
    const counts = new Map<string, number>();
    for (const entry of list.excluded) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
    console.log(`  Excluded      ${list.excluded.length} earlier, at normalization:`);
    for (const [reason, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`                  ${count} × ${reason}`);
    }
  }
  console.log(`  Chunks        ${chunkManifests.map((chunk) => chunk.count).join(" + ")}`);
  console.log(`  Manifest      ${manifestPath}`);
  console.log(`  Est. runtime  ~${estimatedSeconds.toFixed(1)}s of rate-limit waiting`);

  if (spec.engine === "react") {
    console.log("");
    console.log(
      "  ! engine=\"react\" renders one identical body for everyone — composeMessage\n" +
        "    only personalizes {firstName} under engine=\"layout\". Switch engines if the\n" +
        "    copy needs per-person values."
    );
  }

  console.log("");
  console.log("Send (one command per chunk — check the first chunk's file before running):");
  console.log("");
  chunkManifests.forEach((chunk, index) => {
    console.log(`  # chunk ${index + 1}/${chunks.length} — ${chunk.count} recipient(s)`);
    console.log(
      `  resend emails batch --file "${chunk.file}" --idempotency-key ${chunk.idempotencyKey} --batch-validation strict`
    );
    if (index < chunkManifests.length - 1) console.log(`  Start-Sleep -Milliseconds ${CHUNK_DELAY_MS}`);
  });
  console.log("");
  console.log(
    `Note: \`resend emails batch\` has no --dry-run (only \`resend emails send\` does).\n` +
      `The equivalent preflight is what just ran: every message was rendered and the\n` +
      `first was put through the strict broadcast gates. \`--batch-validation strict\`\n` +
      `then makes Resend reject the whole chunk if any single message is invalid.\n` +
      `To eyeball one message first, open the chunk file and read its "html".`
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  void main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
