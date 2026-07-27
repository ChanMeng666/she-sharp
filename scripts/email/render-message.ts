/**
 * Render a `MessageSpec` JSON file to HTML + text, gate it, and print the send command.
 *
 * This is the one place a She Sharp email becomes bytes. It exists so that
 * "write the copy" and "send the mail" are separate, auditable steps: the spec
 * is reviewable JSON, the render is a file on disk a human can open, and the
 * pre-send gates (`lib/email/gates.ts`) run BEFORE anyone types a `resend`
 * command. Nothing here talks to the network — the script only ever writes two
 * local files and prints a command for a human to run.
 *
 * Usage:
 *   npx tsx scripts/email/render-message.ts <spec.json> [options]
 *
 *   --mode broadcast|preview   Render mode (default: preview). "broadcast" is
 *                              what actually ships and is gated strictly.
 *   --draft-banner             Stamp a three-line "DRAFT — not sent" banner at
 *                              the top of the HTML so a forwarded preview can
 *                              never be mistaken for the real send.
 *   --recipient-json <path>    JSON file `{ "email": "...", "firstName": "..." }`
 *                              used to personalize `{firstName}` (layout engine only).
 *   --out-dir <dir>            Output directory (default: tmp/emails).
 *   --open                     Open the rendered HTML in the default browser.
 *   --json                     Print a machine-readable result object on stdout
 *                              (human output moves to stderr).
 *
 * Output:
 *   <out-dir>/<spec.key>.<mode>.html
 *   <out-dir>/<spec.key>.<mode>.txt
 *   plus a gate report and a copy-pasteable `resend …` command on the console.
 *   With --json, stdout carries
 *   `{ specKey, mode, htmlPath, textPath, sizeKb, gates, nextCommand }`.
 *
 * Exit code 1 on: unreadable/invalid spec, or any blocking gate failure. On a
 * gate failure the HTML/text files are STILL written, so the author can open
 * the render and see what tripped the gate.
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { z } from "zod";
import { parseMessageSpec, type MessageSpec } from "@/lib/email/message";
import { composeMessage } from "@/lib/email/compose";
import { runEmailGates, formatGateReport, type GateReport } from "@/lib/email/gates";

type Mode = "broadcast" | "preview";

interface Args {
  specPath: string;
  mode: Mode;
  draftBanner: boolean;
  recipientPath: string | null;
  outDir: string;
  open: boolean;
  json: boolean;
}

const USAGE =
  "Usage: npx tsx scripts/email/render-message.ts <spec.json> " +
  "[--mode broadcast|preview] [--draft-banner] [--open] [--out-dir tmp/emails] " +
  "[--recipient-json <path>] [--json]";

/** Recipient file shape — only what `ComposeOptions.recipient` consumes. */
const recipientSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().nullable().optional(),
});

type RecipientFile = z.infer<typeof recipientSchema>;

/**
 * Parses argv into a fully defaulted {@link Args}.
 *
 * @param argv `process.argv.slice(2)`.
 * @returns The parsed arguments.
 * @throws Error with the usage line when a flag is missing its value or the
 *   positional spec path is absent.
 */
function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let mode: Mode = "preview";
  let draftBanner = false;
  let recipientPath: string | null = null;
  let outDir = "tmp/emails";
  let open = false;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--mode": {
        const value = argv[++i];
        if (value !== "broadcast" && value !== "preview") {
          throw new Error(`--mode must be "broadcast" or "preview", got: ${value ?? "(nothing)"}`);
        }
        mode = value;
        break;
      }
      case "--draft-banner":
        draftBanner = true;
        break;
      case "--recipient-json": {
        const value = argv[++i];
        if (!value) throw new Error("--recipient-json requires a file path.");
        recipientPath = value;
        break;
      }
      case "--out-dir": {
        const value = argv[++i];
        if (!value) throw new Error("--out-dir requires a directory path.");
        outDir = value;
        break;
      }
      case "--open":
        open = true;
        break;
      case "--json":
        json = true;
        break;
      default:
        if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}\n${USAGE}`);
        positional.push(arg);
    }
  }

  if (positional.length === 0) throw new Error(USAGE);
  if (positional.length > 1) {
    throw new Error(`Expected exactly one spec file, got ${positional.length}.\n${USAGE}`);
  }

  return { specPath: positional[0], mode, draftBanner, recipientPath, outDir, open, json };
}

/** Opens a file in the default application (Windows `start`, macOS `open`, else `xdg-open`). */
function openInBrowser(filePath: string): void {
  const platform = process.platform;
  if (platform === "win32") {
    // `start` is a cmd builtin; the empty "" is the window title arg.
    spawn("cmd", ["/c", "start", "", filePath], { detached: true, stdio: "ignore" });
  } else if (platform === "darwin") {
    spawn("open", [filePath], { detached: true, stdio: "ignore" });
  } else {
    spawn("xdg-open", [filePath], { detached: true, stdio: "ignore" });
  }
}

/**
 * Quotes a value for a PowerShell double-quoted string.
 *
 * The printed command is meant to be pasted into the repo's primary shell, so
 * backtick, double quote and `$` all need PowerShell's backtick escape — a
 * backslash escape would silently corrupt a From header like
 * `She Sharp <hello@shesharp.org.nz>`.
 *
 * @param value Raw value.
 * @returns The value wrapped in double quotes, safely escaped.
 */
function psQuote(value: string): string {
  const escaped = value
    .replace(/`/g, "``")
    .replace(/"/g, '`"')
    .replace(/\$/g, "`$");
  return `"${escaped}"`;
}

/** Renders an absolute path relative to cwd when it lives inside the repo. */
function displayPath(absolute: string): string {
  const rel = relative(process.cwd(), absolute);
  if (rel.length === 0 || rel.startsWith("..") || isAbsolute(rel)) return absolute;
  return rel.split("\\").join("/");
}

/** Joins CLI lines with PowerShell's backtick line-continuation. */
function joinCommand(lines: string[]): string {
  return lines.map((line, i) => (i === lines.length - 1 ? line : `${line} \``)).join("\n");
}

/**
 * Builds the copy-pasteable next-step command for a rendered message.
 *
 * Transactional mail goes out as a single `resend emails send` with an
 * idempotency key derived from the rendered HTML, so re-running after an edit
 * is a new send while re-running the same bytes is a no-op. Marketing mail
 * cannot be sent that way — it needs a segment and an unsubscribe-bearing
 * broadcast — so a `resend broadcasts create` skeleton is printed instead, with
 * the segment/topic IDs left as placeholders for the operator to fill from
 * `audience-report.ts --include-resend`.
 *
 * @param spec The validated spec.
 * @param htmlPath Path to the rendered HTML file.
 * @param textPath Path to the rendered text file.
 * @param htmlSha8 First 8 hex chars of the HTML's SHA-256.
 * @returns The command, ready to print verbatim.
 */
function buildNextCommand(
  spec: MessageSpec,
  htmlPath: string,
  textPath: string,
  htmlSha8: string
): string {
  const lines: string[] = [];

  if (spec.category === "marketing") {
    lines.push("resend broadcasts create");
    lines.push(`  --from ${psQuote(spec.from)}`);
    lines.push(`  --subject ${psQuote(spec.subject)}`);
    if (spec.preheader) lines.push(`  --preview-text ${psQuote(spec.preheader)}`);
    lines.push(`  --name ${psQuote(spec.key)}`);
    if (spec.replyTo) lines.push(`  --reply-to ${psQuote(spec.replyTo)}`);
    lines.push("  --segment-id <SEGMENT_ID>");
    lines.push("  --topic-id <TOPIC_ID>");
    lines.push(`  --html-file ${psQuote(htmlPath)}`);
    lines.push(`  --text-file ${psQuote(textPath)}`);
    lines.push("  --dry-run");
    return joinCommand(lines);
  }

  lines.push("resend emails send");
  lines.push(`  --from ${psQuote(spec.from)}`);
  lines.push("  --to <RECIPIENT>");
  if (spec.replyTo) lines.push(`  --reply-to ${psQuote(spec.replyTo)}`);
  lines.push(`  --subject ${psQuote(spec.subject)}`);
  lines.push(`  --html-file ${psQuote(htmlPath)}`);
  lines.push(`  --text-file ${psQuote(textPath)}`);
  for (const tag of spec.tags ?? []) {
    lines.push(`  --tags ${tag.name}=${tag.value}`);
  }
  lines.push(`  --idempotency-key ${spec.key}-${htmlSha8}`);
  lines.push("  --dry-run");
  return joinCommand(lines);
}

/** Reads and validates the optional `--recipient-json` file. */
function loadRecipient(path: string): RecipientFile {
  const absolute = resolve(process.cwd(), path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    throw new Error(
      `Could not read --recipient-json at ${absolute}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  const result = recipientSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid recipient file ${absolute}:\n${issues}`);
  }
  return result.data;
}

/** Draft-banner copy. HTML fragments — `withDraftBanner` emits them as-is. */
function draftBannerLines(spec: MessageSpec, mode: Mode): string[] {
  return [
    "<strong>DRAFT — this email has not been sent.</strong>",
    `Local render of spec <strong>${spec.key}</strong> in <strong>${mode}</strong> mode, ${new Date().toISOString()}.`,
    "Reply with changes; the real send happens only after the plan block is approved.",
  ];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // With --json, stdout is reserved for the result object so it can be piped.
  const log = (line: string): void => {
    if (args.json) console.error(line);
    else console.log(line);
  };

  // ---------- load + validate spec ----------

  const specAbs = resolve(process.cwd(), args.specPath);
  let rawSpec: unknown;
  try {
    rawSpec = JSON.parse(readFileSync(specAbs, "utf8"));
  } catch (error) {
    console.error(
      `ERROR: could not read spec at ${specAbs}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }

  let spec: MessageSpec;
  try {
    spec = parseMessageSpec(rawSpec);
  } catch (error) {
    // parseMessageSpec already formats every zod issue as "path: message".
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const recipient = args.recipientPath ? loadRecipient(args.recipientPath) : undefined;
  if (recipient && spec.engine === "react") {
    log(
      "WARNING: --recipient-json is ignored by engine=\"react\" — that template " +
        "leaves personalization to Resend merge tags."
    );
  }

  // ---------- render ----------

  const { html, text, sizeKb, engine } = await composeMessage(spec, {
    mode: args.mode,
    draftBanner: args.draftBanner ? draftBannerLines(spec, args.mode) : undefined,
    recipient: recipient
      ? { firstName: recipient.firstName ?? null, email: recipient.email }
      : undefined,
  });

  const outDirAbs = resolve(process.cwd(), args.outDir);
  mkdirSync(outDirAbs, { recursive: true });
  const htmlPath = resolve(outDirAbs, `${spec.key}.${args.mode}.html`);
  const textPath = resolve(outDirAbs, `${spec.key}.${args.mode}.txt`);
  writeFileSync(htmlPath, html, "utf8");
  writeFileSync(textPath, text, "utf8");

  log("");
  log("Render Message");
  log("===================================");
  log(`  Spec:    ${spec.key} (${spec.category}, engine=${engine})`);
  log(`  Mode:    ${args.mode}`);
  log(`  Subject: ${spec.subject}`);
  log(`  HTML:    ${displayPath(htmlPath)}  (${sizeKb.toFixed(1)}KB)`);
  log(`  Text:    ${displayPath(textPath)}`);
  log("===================================");
  log("");

  // ---------- gates ----------

  const report: GateReport = runEmailGates(html, text, spec, { mode: args.mode });
  log(formatGateReport(report));
  log("");

  if (report.redactionCandidates.length > 0) {
    log("Redactions to declare in the plan block:");
    for (const candidate of report.redactionCandidates) {
      log(`  - ${candidate}`);
    }
    log("");
  }

  // ---------- next step ----------

  const htmlSha8 = createHash("sha256").update(html, "utf8").digest("hex").slice(0, 8);
  const nextCommand = buildNextCommand(
    spec,
    displayPath(htmlPath),
    displayPath(textPath),
    htmlSha8
  );

  if (report.ok) {
    log(
      spec.category === "marketing"
        ? "Next — create the broadcast as a draft (no API call with --dry-run):"
        : "Next — dry-run the send (no API call):"
    );
    log(nextCommand);
    if (spec.category === "marketing") {
      log("");
      log(
        "  Fill <SEGMENT_ID>/<TOPIC_ID> from: npx tsx scripts/email/audience-report.ts --include-resend"
      );
      log("  Note: broadcasts carry no --tags/--idempotency-key; the segment is the audience.");
    }
  } else {
    log("Blocked by the gates above — the rendered files were still written so you");
    log("can open them and see what tripped. Fix the spec and re-run. Command once green:");
    log(nextCommand);
  }
  log("");

  if (args.open) openInBrowser(htmlPath);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          specKey: spec.key,
          mode: args.mode,
          htmlPath,
          textPath,
          sizeKb: Number(sizeKb.toFixed(2)),
          gates: report,
          nextCommand,
        },
        null,
        2
      )
    );
  }

  if (!report.ok) process.exit(1);
}

void main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
