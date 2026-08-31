/**
 * Turn `.cache/triage.json` into something the whole team sees.
 *
 *   npx tsx .../triage-report.ts            # print the issue body, touch nothing
 *   npx tsx .../triage-report.ts --issue    # create or update the standing issue
 *
 * WHY THIS EXISTS
 *
 * Reading Slack was one person's job because knowing WHEN to read it was one
 * person's job. `discover-channels.ts` answers that in about a minute, but its
 * answer lands on the terminal of whoever ran it, and running it needs a token
 * and a checkout. So the scheduled workflow runs the triage and this script puts
 * the result where all seven collaborators already look: one standing GitHub
 * issue labelled `slack-triage`, edited in place.
 *
 * THE THREE RULES IT FOLLOWS
 *
 * - **It reports; it never records.** The workflow passes `--no-record`, so no
 *   read position moves and nothing here writes the manifest. A row therefore
 *   keeps nagging until a human actually syncs it, which is the point. A machine
 *   that advanced a read position is the failure mode behind every miss in this
 *   skill's history.
 * - **One issue, edited in place, and a comment only when the set CHANGES.**
 *   The body is state and can be rewritten daily for free; a comment is a
 *   notification to seven people. Posting one for an unchanged backlog is how a
 *   channel becomes something everybody mutes. The current set's hash rides in
 *   an HTML comment in the body, so the comparison needs no extra storage.
 * - **It says what the scan could not see.** `unenumerated` in the triage file
 *   carries the conversations the identity never listed. On the bot token that
 *   is 28 DMs and group DMs plus any private channel nobody invited the bot to,
 *   and 9 of those DMs are `alwaysRead`. An issue that showed only the rows
 *   would read as full workspace coverage.
 *
 * A BACKLOG IS NOT A BUILD FAILURE. This exits 0 whether or not anything needs
 * attention; only a genuine fault (no triage file, `gh` failing) is non-zero. A
 * workflow that goes red because somebody posted in Slack trains people to
 * ignore red.
 *
 * stdout is the issue body. Diagnostics go to stderr, like every script here.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { CACHE_DIR, isQuiet } from "./state-lib";

const LABEL = "slack-triage";
const TITLE = "Slack triage — conversations holding unread event content";
/** Marks the machine-written part of the body and carries the set's identity. */
const HASH_MARKER = "<!-- slack-triage-hash:";

const argv = process.argv.slice(2);
const has = (f: string): boolean => argv.includes(f);

const HELP = `
triage-report.ts — render .cache/triage.json as a GitHub issue body.

  npx tsx .claude/skills/sync-event-from-slack/scripts/triage-report.ts [--issue]

  --issue        Create or update the open issue labelled \`${LABEL}\`, and
                 comment only when the actionable set has changed. Needs \`gh\`
                 authenticated (GH_TOKEN in CI).
  --triage <p>   Read a triage file from somewhere other than .cache/triage.json.
  --help

Without --issue it prints the body and does nothing else, which is how to see
what the workflow would post. Exits 0 even when there is a backlog.
`.trim();

if (has("--help") || has("-h")) {
  console.error(HELP);
  process.exit(0);
}

const triageArg = argv[argv.indexOf("--triage") + 1];
const triagePath =
  argv.includes("--triage") && triageArg && !triageArg.startsWith("--")
    ? resolve(triageArg)
    : resolve(CACHE_DIR, "triage.json");

// ---------------------------------------------------------------------------
// the triage file
// ---------------------------------------------------------------------------

/** Only the fields this script reads. `discover-channels.ts` owns the shape. */
interface Row {
  type: string;
  name: string;
  id: string;
  newCount: number;
  repliesOnly: boolean;
  digest: string;
  action: string;
  mapping: { kind: string; events?: { slug: string }[]; reason?: string } | null;
}

interface Unenumerated {
  id: string;
  name: string;
  alwaysRead: boolean;
  reason: "dms-out-of-scope" | "not-visible";
}

interface Triage {
  generatedAt: string;
  identity?: "user" | "bot";
  unenumerated?: Unenumerated[];
  rows: Row[];
}

function loadTriage(): Triage {
  if (!existsSync(triagePath)) {
    console.error(
      `triage-report: no triage at ${triagePath}.\n` +
        `  Run discover-channels.ts first — this script only formats what that wrote.`,
    );
    process.exit(1);
  }
  try {
    const t = JSON.parse(readFileSync(triagePath, "utf8")) as Partial<Triage>;
    if (!Array.isArray(t.rows)) throw new Error("no rows[] in the triage file");
    return { generatedAt: t.generatedAt ?? "", identity: t.identity, unenumerated: t.unenumerated ?? [], rows: t.rows };
  } catch (e) {
    console.error(`triage-report: could not read ${triagePath}: ${(e as Error).message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// the body
// ---------------------------------------------------------------------------

/** Escape the pipes and newlines that would break out of a Markdown table cell. */
function cell(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
}

/**
 * How much of a digest goes in the issue.
 *
 * Digests are written to be re-read by a model and run to several thousand
 * characters — the Xero one is 4.5k. Pasted whole, eight rows bury the table
 * that is the reason anyone opened the issue. The opening sentences are the part
 * a human needs ("what is this event, and what is outstanding"); the rest is
 * carried into the next sync by `_meta.priorDigest` regardless of what is here.
 */
const DIGEST_CHARS = 480;

function digestExcerpt(digest: string): string {
  const flat = cell(digest);
  if (flat.length <= DIGEST_CHARS) return flat;
  return flat.slice(0, DIGEST_CHARS).replace(/\s+\S*$/, "") + " […]";
}

const SYNC = ".claude/skills/sync-event-from-slack/scripts";

/**
 * What a collaborator runs to pick this row up.
 *
 * Deliberately the fetch and the render, not "run the skill" — those two are the
 * only steps that are the same for every row, and they are the two that put the
 * unread content in front of a person. Everything after depends on what it says.
 */
function commandsFor(r: Row): string {
  return [
    `npx tsx ${SYNC}/fetch-channel.ts ${r.id} --state --out tmp/${r.id}.json`,
    `npx tsx ${SYNC}/render-delta.ts tmp/${r.id}.json`,
  ].join("\n");
}

function mappingLabel(r: Row): string {
  if (r.mapping?.kind === "event")
    return (r.mapping.events ?? []).map((e) => e.slug).join(", ") || "event";
  if (r.mapping?.kind === "skip") return "skip";
  return "unmapped";
}

/**
 * The hash that decides whether anyone gets notified.
 *
 * Over id + action + unread count, so a row that gains messages re-notifies
 * (the count is the thing that says "this got worse") while a row sitting at the
 * same backlog does not. Deliberately NOT over the digest or the generated
 * timestamp: those move without the situation changing.
 */
function fingerprint(rows: Row[], unenumerated: Unenumerated[]): string {
  const parts = [
    ...rows.map((r) => `${r.id}:${r.action}:${r.newCount}`).sort(),
    ...unenumerated
      .filter((u) => u.reason === "not-visible")
      .map((u) => `invisible:${u.id}`)
      .sort(),
  ];
  return createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 16);
}

function buildBody(t: Triage): { body: string; hash: string; actionable: Row[] } {
  const actionable = t.rows.filter((r) => !isQuiet(r.action));
  const invisible = (t.unenumerated ?? []).filter((u) => u.reason === "not-visible");
  const outOfScope = (t.unenumerated ?? []).filter((u) => u.reason === "dms-out-of-scope");
  const hash = fingerprint(actionable, t.unenumerated ?? []);
  const when = t.generatedAt ? t.generatedAt.replace("T", " ").slice(0, 16) + " UTC" : "unknown";

  const L: string[] = [];

  L.push(
    actionable.length
      ? `**${actionable.length} conversation(s) are holding event content nobody has read.** ` +
          `Anyone with a Slack bot token and a checkout can pick one up; the two commands under ` +
          `each row put the unread messages in front of you, and nothing is written until you ` +
          `choose to apply.`
      : `**Nothing is waiting.** Every conversation this scan could see is level with its read position.`,
  );
  L.push("");
  // Never guess the identity. A triage written before this field existed has
  // none, and defaulting it to "bot" would understate the scan's reach while
  // defaulting it to "user" would overstate it.
  const who =
    t.identity === "user"
      ? "as the authorising user"
      : t.identity === "bot"
        ? "as the Collector bot"
        : "";
  L.push(
    `Scanned ${t.rows.length} conversation(s)${who ? " " + who : ""} at ${when}. ` +
      `This scan records nothing — a row stays here until somebody syncs it.`,
  );

  if (actionable.length) {
    L.push("");
    L.push("| Conversation | Action | Unread | Maps to |");
    L.push("| --- | --- | --- | --- |");
    for (const r of actionable) {
      const unread = r.newCount === -1 ? "?" : r.newCount > 0 ? String(r.newCount) : "—";
      L.push(
        `| \`${cell(r.name)}\` | ${cell(r.action)} | ${unread}${r.repliesOnly ? " (in threads)" : ""} | ${cell(mappingLabel(r))} |`,
      );
    }
    L.push("");
    for (const r of actionable) {
      L.push(`<details><summary><code>${cell(r.name)}</code> — ${cell(r.action)}</summary>`);
      L.push("");
      if (r.digest) {
        L.push(`**Last understood as:** ${digestExcerpt(r.digest)}`);
        L.push("");
      }
      L.push("```bash");
      L.push(commandsFor(r));
      L.push("```");
      L.push("");
      L.push(`Then follow \`/sync-event-from-slack\` from its Step 2. Redactions matter: access codes and private registration links must never reach \`events-custom.json\`.`);
      L.push("");
      L.push("</details>");
    }
  }

  /*
   * The blind spot goes in the body, not a log. Its whole problem is that it is
   * invisible by construction: an unlisted conversation cannot be a table row.
   */
  if (invisible.length || outOfScope.length) {
    L.push("");
    L.push("### What this scan could not see");
    L.push("");
    if (outOfScope.length) {
      const always = outOfScope.filter((u) => u.alwaysRead).length;
      L.push(
        `- **${outOfScope.length} DM(s) and group DM(s)** are out of scope${always ? `, ${always} of them marked always-read` : ""}. ` +
          `A bot token cannot list them at all, so they stay with whoever holds a user token. ` +
          `Moving a recurring work conversation out of a group DM into a private channel with the ` +
          `Collector bot invited is the only way this scan will ever cover it.`,
      );
    }
    if (invisible.length) {
      L.push(
        `- **${invisible.length} conversation(s) this identity could not list** — someone needs to ` +
          `\`/invite @She Sharp Event Collector\`:`,
      );
      for (const u of invisible) {
        L.push(`  - \`${cell(u.name)}\` (${u.id})${u.alwaysRead ? " — always-read" : ""}`);
      }
    }
  }

  L.push("");
  L.push("---");
  L.push("");
  L.push(
    `Edited in place by \`.github/workflows/slack-triage.yml\`. Comments are posted only when ` +
      `this set changes, so a standing row will not keep pinging. Setup, token scopes and what a ` +
      `bot token can see: \`.claude/skills/sync-event-from-slack/SKILL.md\`.`,
  );
  L.push("");
  L.push(`${HASH_MARKER}${hash} -->`);

  return { body: L.join("\n"), hash, actionable };
}

// ---------------------------------------------------------------------------
// gh
// ---------------------------------------------------------------------------

/**
 * Run `gh`.
 *
 * EVERY BODY TRAVELS THROUGH `--body-file`, NEVER ARGV. That is the rule that
 * matters here: a digest carries quotes, apostrophes and newlines, and a channel
 * name is whatever somebody typed in Slack. So argv below only ever holds
 * constants, a label, and an issue number.
 *
 * `shell` is true on Windows only, because `gh` there is a `.cmd` shim that
 * cannot be spawned without one. `refresh-archive.ts` refuses a shell for the
 * opposite reason and both are right: it passes filesystem paths as arguments,
 * where a shell is what turns a space or a `>` into syntax. CI runs on Linux, so
 * the production path never takes the shell branch at all.
 */
function gh(args: string[], allowFailure = false): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("gh", args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    shell: process.platform === "win32", // `gh` is a .cmd shim on Windows
  });
  if (r.error) {
    if (allowFailure) return { status: 1, stdout: "", stderr: r.error.message };
    console.error(`triage-report: could not run gh: ${r.error.message}`);
    process.exit(1);
  }
  const out = { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  if (out.status !== 0 && !allowFailure) {
    console.error(`triage-report: gh ${args[0]} ${args[1] ?? ""} exited ${out.status}\n${out.stderr}`);
    process.exit(1);
  }
  return out;
}

function bodyFile(body: string): string {
  const dir = mkdtempSync(resolve(tmpdir(), "slack-triage-"));
  const path = resolve(dir, "body.md");
  writeFileSync(path, body, "utf8");
  return path;
}

/** The hash the issue body was last written with, or "" when there is none. */
function hashInBody(body: string): string {
  const m = body.match(/<!-- slack-triage-hash:([0-9a-f]+) -->/);
  return m ? m[1] : "";
}

function syncIssue(body: string, hash: string, actionable: Row[]): void {
  // `gh issue create --label` fails outright on a label that does not exist, and
  // the first run in any clone is exactly that case.
  gh(["label", "create", LABEL, "--description", "Unread Slack event content, posted by the scheduled triage", "--color", "1D76DB"], true);

  const list = gh([
    "issue",
    "list",
    "--label",
    LABEL,
    "--state",
    "open",
    "--limit",
    "1",
    "--json",
    "number,body",
  ]);
  let existing: { number: number; body: string } | undefined;
  try {
    existing = (JSON.parse(list.stdout || "[]") as { number: number; body: string }[])[0];
  } catch {
    existing = undefined;
  }

  const file = bodyFile(body);

  if (!existing) {
    const created = gh(["issue", "create", "--title", TITLE, "--label", LABEL, "--body-file", file]);
    console.error(`triage-report: created ${created.stdout.trim()}`);
    return;
  }

  const previous = hashInBody(existing.body ?? "");
  gh(["issue", "edit", String(existing.number), "--body-file", file]);
  console.error(`triage-report: updated issue #${existing.number}`);

  if (previous === hash) {
    console.error(`triage-report: set unchanged (${hash}) — no comment, so nobody is pinged`);
    return;
  }

  const comment = actionable.length
    ? `The Slack triage changed: **${actionable.length} conversation(s)** now holding unread event content — ` +
      actionable.map((r) => `\`${cell(r.name)}\` (${r.action})`).join(", ") +
      `. Details and the commands to pick one up are in the issue body above.`
    : `All clear — every conversation this scan can see is level with its read position.`;
  gh(["issue", "comment", String(existing.number), "--body-file", bodyFile(comment)]);
  console.error(`triage-report: commented on #${existing.number} (${previous || "none"} → ${hash})`);
}

// ---------------------------------------------------------------------------

const triage = loadTriage();
const { body, hash, actionable } = buildBody(triage);

if (has("--issue")) {
  syncIssue(body, hash, actionable);
} else {
  process.stdout.write(body + "\n");
}
console.error(
  `triage-report: ${actionable.length} actionable of ${triage.rows.length} scanned · hash ${hash}`,
);
