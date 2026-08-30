/**
 * Renders one monthly newsletter issue for a whole recipient list and writes the
 * chunked JSON files that `resend emails batch --file` accepts.
 *
 * This is `scripts/email/build-batch.ts` for the one message that cannot be a
 * `MessageSpec`. The newsletter is a rich React Email template driven by a
 * validated issue file (`lib/data/json/newsletter-issues/YYYY-MM.json`), not by
 * a list of layout blocks, so `composeMessage` has nothing to compose. Rather
 * than widen `MessageSpec` to accommodate one template, this script reuses
 * build-batch's machinery — the same idempotency key, the same hash ledger, the
 * same manifest shape, the same chunk-file naming — and swaps the renderer.
 *
 * It exists because the newsletter is moving off Resend *broadcasts* onto the
 * transactional *batch* API. A broadcast attached its own unsubscribe link and
 * held its own contact list; the batch endpoint does neither, so both have to be
 * assembled here:
 *
 *  - The audience rule is enforced before anything is rendered
 *    (`assertSendAllowed`), so a newsletter aimed at event registrants stops
 *    here with an explanation rather than in someone's inbox.
 *  - Every message carries a signed, per-recipient `List-Unsubscribe` pair and
 *    a substituted opt-out URL in the body. Without `EMAIL_UNSUBSCRIBE_SECRET`
 *    neither can be produced, which is why that is the very first check.
 *  - The rendered message goes through the strict broadcast gates once. If they
 *    fail, nothing is written at all — a clipped 120KB issue or a WebP hero is a
 *    whole-list problem, not a per-message one.
 *  - Anyone whose hash appears in a previous run's manifest is skipped, so a
 *    resumed or repeated send cannot double-mail.
 *
 * Nothing here sends. It writes files and prints the commands a human runs.
 *
 * Usage:
 *   npx tsx scripts/newsletter/build-newsletter-batch.ts <YYYY-MM> \
 *     --recipients <recipients-*.json> [--stage newsletter] \
 *     [--exclude-hashes <ledger.json>] [--chunk 100] [--out-dir tmp/emails] [--json]
 *
 * Flags:
 *   <YYYY-MM>          The issue id, e.g. "2026-08". Must be registered in
 *                      lib/newsletter/issues-registry.ts.
 *   --recipients       A recipients-<key>.json from recipients-from-db.ts.
 *   --stage            Names this send within the campaign (default
 *                      "newsletter"). Part of the idempotency key: change it and
 *                      the same person can be mailed again, keep it and they
 *                      cannot.
 *   --exclude-hashes   A previous manifest/ledger JSON; every `recipientHashes`
 *                      array found anywhere inside it is skipped.
 *   --chunk            Messages per file (default 100, the Resend API maximum).
 *   --out-dir          Output directory (default tmp/emails).
 *   --json             Machine-readable summary instead of prose.
 *
 * Output:
 *   <out-dir>/batch-newsletter-<issueId>-<stage>-<n>.json
 *   <out-dir>/batch-newsletter-<issueId>-<stage>.manifest.json
 */

// Scripts read `.env`, not `.env.local`. The preflight below refuses without
// EMAIL_UNSUBSCRIBE_SECRET, so the secret has to be loaded before main() runs —
// it arrives transitively today (lib/db/drizzle.ts calls dotenv.config() and the
// import chain reaches it), and depending on that side effect would make the
// hardest gate in this file fail for an unrelated refactor.
import "dotenv/config";

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { assertSendAllowed, describeTier, type AudienceTier } from "../../lib/email/audience";
import { runEmailGates, formatGateReport } from "../../lib/email/gates";
import { hashEmail } from "../../lib/email/hash";
import type { MessageSpec } from "../../lib/email/message";
import { getSenderIdentity } from "../../lib/email/senders";
import { getBaseUrl } from "../../lib/email/service";
import {
  buildUnsubscribeHeaders,
  substituteUnsubscribeUrl,
} from "../../lib/email/unsubscribe-headers";
import { getIssue } from "../../lib/newsletter/issues-registry";
import { substituteReconfirmUrl } from "../../lib/newsletter/reconfirm-link";
import { renderNewsletter } from "../../lib/newsletter/render";
import { issueIdSchema } from "../../lib/newsletter/schema";
// Imported rather than reimplemented: two copies of an idempotency key that drift
// by one character stop de-duplicating and nothing says so.
import { idempotencyKey, collectRecipientHashes } from "../email/build-batch";

/** Resend refuses more than 100 messages in one batch request. */
const MAX_CHUNK = 100;

/** Resend's free tier allows 2 requests/second; 600ms between chunks is safe. */
const CHUNK_DELAY_MS = 600;

/** Where an unknown issue id has to be registered. */
const REGISTRY_FILE = "lib/newsletter/issues-registry.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecipientsFile {
  key: string;
  source?: string;
  tier: AudienceTier;
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
  issueId: string;
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
  issueId: string;
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

  const issueId = positional[0];
  if (!issueId) {
    fail(
      "no issue id given.",
      "Usage: npx tsx scripts/newsletter/build-newsletter-batch.ts <YYYY-MM> --recipients <recipients-*.json>"
    );
  }
  if (!issueIdSchema.safeParse(issueId).success) {
    fail(`"${issueId}" is not an issue id. Expected YYYY-MM, e.g. "2026-08".`);
  }

  const recipients = readOption(argv, "--recipients");
  if (!recipients) {
    fail("--recipients is required (a recipients-<key>.json from recipients-from-db.ts).");
  }

  // Unlike build-batch, --stage has a default: there is one newsletter per issue
  // and its id already distinguishes it, so requiring the flag would only invite
  // a typo that silently unlocks a second send to the same people.
  const stage = readOption(argv, "--stage") ?? "newsletter";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(stage)) {
    fail(`--stage "${stage}" must be kebab-case (lowercase letters, digits, hyphens).`);
  }

  const chunkRaw = readOption(argv, "--chunk");
  let chunk = MAX_CHUNK;
  if (chunkRaw !== null) {
    chunk = Number(chunkRaw);
    if (!Number.isInteger(chunk) || chunk < 1) {
      fail(`--chunk must be a positive integer (got "${chunkRaw}").`);
    }
    if (chunk > MAX_CHUNK) {
      fail(`--chunk cannot exceed ${MAX_CHUNK} — that is the Resend batch API's hard limit.`);
    }
  }

  return {
    issueId,
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
    fail(`${path} is missing a "key". Regenerate it with recipients-from-db.ts.`);
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
    recipients,
    excluded: Array.isArray(file.excluded) ? file.excluded : [],
    counts: file.counts,
  };
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/** Escapes a literal string for use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Reduces a string to the character set Resend accepts in a tag value.
 *
 * Resend rejects anything outside `[A-Za-z0-9_-]` with an opaque error, and only
 * after the send has been committed to. "2026-08" survives untouched; the strip
 * exists so a future id carrying a dot or a colon cannot fail at the API.
 */
function sanitizeTagValue(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "");
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


/**
 * Refuses content that still carries a Resend merge tag.
 *
 * The batch endpoint substitutes NOTHING — merge tags are a feature of
 * broadcasts against Resend-held contacts. `runEmailGates` still permits
 * `{{{contact.first_name}}}` because the broadcast path is legitimate, so the
 * check has to live here, on the path that cannot substitute it. A survivor
 * would be delivered to a real person as literal text.
 *
 * @param content Rendered html or text, after substitution.
 * @param part Which half, for the error message.
 * @returns The content unchanged when it is clean.
 */
function assertNoMergeTags(content: string, part: "html" | "text"): string {
  const leftover = content.match(/\{\{\{[^{}]*\}\}\}/);
  if (leftover) {
    fail(
      `A merge tag survived into the ${part}: ${leftover[0]}`,
      "The Resend batch endpoint substitutes nothing, so this would be delivered as",
      "literal text. Fix the template to render a real value instead.",
      "Nothing has been written."
    );
  }
  return content;
}

/**
 * Refuses content that still carries a `%%SHESHARP_…%%` placeholder.
 *
 * The substitution helpers throw when a placeholder survives their own pass,
 * which covers a substitution that ran and failed. It does not cover the case
 * that actually happens: a template grows a new placeholder and nobody adds the
 * matching call here, so the substitution never runs, nothing throws, and the
 * literal text ships to the whole list. This is the backstop for that.
 *
 * @param content Rendered html or text, after every substitution.
 * @param part Which half, for the error message.
 * @returns The content unchanged when it is clean.
 */
function assertNoPlaceholders(content: string, part: "html" | "text"): string {
  const leftover = content.match(/%%SHESHARP_[A-Z_]*%%/);
  if (leftover) {
    fail(
      `A per-recipient placeholder survived into the ${part}: ${leftover[0]}`,
      "Nothing substitutes it at send time, so it would be delivered as literal text.",
      "Add the matching substitution to this builder.",
      "Nothing has been written."
    );
  }
  return content;
}

/**
 * Applies every per-recipient substitution, in one place.
 *
 * One function so the gate preview below and the real messages cannot diverge:
 * a gate that reads a message assembled differently from the one that ships is
 * checking a stand-in.
 *
 * @param content Rendered html or text.
 * @param email The recipient the links are signed for.
 * @param baseUrl The site origin, with no trailing slash.
 * @param issueId The issue, recorded in the re-confirmation evidence.
 * @returns The recipient's copy.
 */
function personalise(
  content: string,
  email: string,
  baseUrl: string,
  issueId: string
): string {
  return substituteReconfirmUrl(
    substituteUnsubscribeUrl(content, email, baseUrl),
    email,
    baseUrl,
    issueId
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Gate 1 — a marketing batch must be able to sign an unsubscribe token.
  //
  // `buildUnsubscribeHeaders()` returns {} when EMAIL_UNSUBSCRIBE_SECRET is
  // unset, and the gates' body-link check would still pass on the template's own
  // footer link, so without this check a whole list ships with no working
  // one-click opt-out and nothing says so. Resend's AUP requires a frictionless
  // opt-out and the complaint ceiling is 0.08% account-wide, so this is a hard
  // failure rather than a warning: better to build nothing than to build a send
  // nobody can escape. It runs before the issue is even loaded — there is no
  // point rendering anything that cannot legally be sent.
  if (!process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    fail(
      "EMAIL_UNSUBSCRIBE_SECRET is not set, so no unsubscribe token can be signed.",
      "A marketing batch without List-Unsubscribe headers is a send with no one-click",
      "opt-out. Set the secret (it is on Vercel production) and build again.",
      "Nothing has been written."
    );
  }

  // The same startup guard build-batch.ts applies to marketing sends. Every
  // unsubscribe URL is baked into the message here, so a batch built against
  // the default localhost BASE_URL would ship the whole list an opt-out link
  // pointing at their own machine — the failure that put `localhost:3000` into
  // 25 real mentor invitations on 2026-03-19. This is the largest send in the
  // repo, so it is the last place to rely on someone remembering.
  {
    const baseUrl = getBaseUrl();
    if (!/^https:\/\//.test(baseUrl) || /localhost|127\.0\.0\.1/.test(baseUrl)) {
      fail(
        `BASE_URL is "${baseUrl}", which cannot be used for a newsletter batch.`,
        "Unsubscribe links are baked into every message at build time, so they would",
        "point at a machine the recipient does not have. Set BASE_URL to the production",
        "origin (https://www.shesharp.org.nz) and build again.",
        "Nothing has been written."
      );
    }
  }

  let issue;
  try {
    issue = getIssue(args.issueId);
  } catch (err) {
    return fail(
      `issue ${args.issueId} is registered but does not validate against newsletterIssueSchema.`,
      err instanceof Error ? err.message : String(err)
    );
  }
  if (!issue) {
    fail(
      `no newsletter issue "${args.issueId}" is registered.`,
      `Add the JSON at lib/data/json/newsletter-issues/${args.issueId}.json, then one`,
      `import line and one map entry in ${REGISTRY_FILE} — Next.js only bundles JSON`,
      "imported by a static path, so the registry is not optional."
    );
  }

  const recipientsPath = resolve(args.recipients);
  const list = parseRecipientsFile(readJson(recipientsPath, "recipients"), recipientsPath);

  // Gate 2 — the audience rule. The newsletter is marketing, so this refuses any
  // list above Tier 0: registering for an event is not a subscription.
  try {
    assertSendAllowed({ category: "marketing", tier: list.tier });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Gate 3 — already-sent hashes from a previous run's manifest/ledger.
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

  // Render ONCE, for everybody.
  //
  // build-batch renders per recipient because `composeMessage` personalises
  // `{firstName}` under engine="layout". The newsletter deliberately dropped
  // personalisation — the body is byte-identical for every subscriber and only
  // the signed tokens differ — so rendering it 1,563 times would be pure
  // waste (and would multiply the template's own work by the size of the list).
  // The per-recipient step below is a string substitution, nothing more.
  let rendered: { html: string; text: string; sizeKb: number };
  try {
    rendered = await renderNewsletter(issue, "broadcast");
  } catch (err) {
    return fail(
      `could not render issue ${args.issueId}.`,
      err instanceof Error ? err.message : String(err)
    );
  }

  const identity = getSenderIdentity("marketing");
  const subject = issue.editorial.subjectLine;
  const subjectHash = createHash("sha256").update(subject).digest("hex");
  const baseUrl = getBaseUrl();
  const key = `newsletter-${args.issueId}`;
  const tags = [
    { name: "stream", value: "marketing" },
    { name: "newsletter", value: sanitizeTagValue(args.issueId) },
  ];

  /**
   * A `MessageSpec` shim so the shared gates can inspect this send.
   *
   * The gates take a spec because every other sender has one; the newsletter's
   * content lives in a React template instead. Everything the spec-reading gates
   * actually check — From, Reply-To, subject, preheader, tags — is real and
   * comes from the same values the batch entries below carry, so the checks are
   * checking the send, not a stand-in. `blocks` is the one exception: the
   * template's structure is not expressible as layout blocks, which makes
   * `gateSingleCta` inert here. That is a known, accepted gap rather than a
   * silent one.
   */
  const gateSpec: MessageSpec = {
    key,
    engine: "react",
    category: "marketing",
    stream: "marketing",
    from: identity.from,
    replyTo: identity.replyTo,
    subject,
    preheader: issue.editorial.previewText,
    title: subject,
    blocks: [],
    tags,
  };

  // Gate 4 — the strict broadcast gates, on the first recipient's real message.
  // Substitution happens first so the gate reads a signed https opt-out URL
  // rather than the template's placeholder, which is what actually ships.
  const firstHtml = personalise(rendered.html, pending[0].email, baseUrl, args.issueId);
  const firstText = personalise(rendered.text, pending[0].email, baseUrl, args.issueId);
  const report = runEmailGates(firstHtml, firstText, gateSpec, { mode: "broadcast" });
  console.log(formatGateReport(report));
  console.log("");
  if (!report.ok) {
    console.error("Blocked: the rendered newsletter failed the pre-send gates. Nothing written.");
    process.exit(1);
  }

  const emails: BatchEmail[] = pending.map((recipient) => ({
    from: identity.from,
    to: [recipient.email],
    replyTo: identity.replyTo,
    subject,
    html: assertNoPlaceholders(
      assertNoMergeTags(personalise(rendered.html, recipient.email, baseUrl, args.issueId), "html"),
      "html"
    ),
    text: assertNoPlaceholders(
      assertNoMergeTags(personalise(rendered.text, recipient.email, baseUrl, args.issueId), "text"),
      "text"
    ),
    tags,
    headers: {
      // Resend's documented per-message de-duplication header. The batch
      // endpoint has no per-message `idempotencyKey` field — its
      // `--idempotency-key` is request-level — so this is where a per-person key
      // can live.
      "X-Entity-Ref-ID": idempotencyKey(key, args.stage, recipient.email, subjectHash),
      // The newsletter never touches `sendEmail()`, and the broadcast product
      // that used to attach these is exactly what this path replaces, so nothing
      // else would add them. The secret was checked before any rendering.
      ...buildUnsubscribeHeaders(recipient.email, baseUrl),
    },
  }));

  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });

  const chunks = chunkArray(emails, args.chunk);

  // A resumed build produces fewer chunks than the first one. Leaving the old
  // trailing files on disk would leave a paste-able command that re-sends to
  // people who have already been mailed, so they go.
  const stalePattern = new RegExp(
    `^batch-${escapeRegExp(key)}-${escapeRegExp(args.stage)}-(\\d+)\\.json$`
  );
  for (const name of readdirSync(outDir)) {
    const match = stalePattern.exec(name);
    if (match && Number(match[1]) > chunks.length) rmSync(resolve(outDir, name));
  }

  const chunkManifests: ChunkManifest[] = chunks.map((chunk, index) => {
    const file = resolve(outDir, `batch-${key}-${args.stage}-${index + 1}.json`);
    writeFileSync(file, `${JSON.stringify(chunk, null, 2)}\n`, "utf8");
    return {
      file,
      count: chunk.length,
      recipientHashes: chunk.map((email) => hashEmail(email.to[0])),
      idempotencyKey: idempotencyKey(key, `${args.stage}-chunk-${index + 1}`, "batch", subjectHash),
    };
  });

  const manifest: Manifest = {
    key,
    issueId: args.issueId,
    recipientsKey: list.key,
    stage: args.stage,
    createdAt: new Date().toISOString(),
    tier: list.tier,
    chunks: chunkManifests,
    totalRecipients: emails.length,
    skipped,
  };
  const manifestPath = resolve(outDir, `batch-${key}-${args.stage}.manifest.json`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
          key,
          issueId: args.issueId,
          recipientsKey: list.key,
          stage: args.stage,
          tier: list.tier,
          sizeKb: Number(rendered.sizeKb.toFixed(1)),
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
  console.log(`  Issue         ${args.issueId} — "${subject}"`);
  console.log(`  From          ${identity.from}  (reply-to ${identity.replyTo})`);
  console.log(`  Stage         ${args.stage}`);
  console.log(`  Audience      ${describeTier(list.tier)}`);
  console.log(`  Rendered      ${rendered.sizeKb.toFixed(1)}KB, once, identical for everyone`);
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
    `Pace the chunks: Resend allows 2 requests/second, so leave at least\n` +
      `${CHUNK_DELAY_MS}ms between commands rather than pasting them as one block.\n` +
      `\`resend emails batch\` has no --dry-run (only \`resend emails send\` does).\n` +
      `The equivalent preflight is what just ran: the issue was rendered and put\n` +
      `through the strict broadcast gates. \`--batch-validation strict\` then makes\n` +
      `Resend reject the whole chunk if any single message is invalid.\n` +
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
