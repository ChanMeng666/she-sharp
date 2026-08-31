/**
 * Bring the verbatim Slack archive back level with Slack, in one command.
 *
 *   # what would change — asks Slack, writes nothing
 *   npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts \
 *     --archive D:/github_repository/she-sharp-slack-archive
 *
 *   # actually refetch and rebuild
 *   npx tsx .../refresh-archive.ts --archive D:/…/she-sharp-slack-archive --apply
 *
 * Run from the repo root like every other script in this skill. Diagnostics go
 * to stderr; this script writes NOTHING to stdout.
 *
 * WHY IT EXISTS
 *
 * `state/sync-state.json` and the archive are two different positions on
 * purpose: the manifest records what the MODEL has read, `raw/*.json` records
 * what has been TRANSCRIBED, and they drift apart every time this skill runs
 * without the archive being rebuilt. Nothing in any step list refreshed the
 * archive, so the drift was silent — the archive quietly aged while every gate
 * in the skill stayed green, because none of them looks at it. This is the step
 * that closes it, and it is dry-run by default so running it is never a risk.
 *
 * It orchestrates the recipe in the archive's own README:
 *
 *   1. diff-archive.ts   — which conversations moved (read-only, asks Slack)
 *   2. fetch-channel.ts  — refetch the stale and the new ones, in full
 *   3. tools/build-archive.ts (in the archive repo) — regenerate conversations/,
 *      manifest.json, INDEX.md and google-links.json from raw/
 *
 * THE TWO RULES IT ENFORCES RATHER THAN DOCUMENTS
 *
 * Both were warnings in a README that depended on a human remembering them at
 * the moment they were about to be broken, which is the moment nobody reads a
 * README.
 *
 * - **No `--state`, no `--since`, ever, when writing into `raw/`.** Those flags
 *   produce a *delta*, and a delta landing in `raw/` replaces a full transcript
 *   with a handful of messages while looking exactly like a successful refresh.
 *   So this script never constructs them (`assertFullFetchArgs`) and re-reads
 *   every payload it wrote to confirm `_meta.mode === "full"` before letting
 *   `build-archive.ts` run over the directory.
 * - **No shell redirect.** `> raw/<id>.json` truncates the target BEFORE the
 *   fetch starts, so a rate-limit abort forty minutes in destroys the transcript
 *   it was replacing. Every child here is spawned without a shell and writes
 *   through `--out-dir`, which writes a temp file and renames.
 *
 * AND THE ONE IT REFUSES TO DECIDE
 *
 * `diff-archive.ts` reports `deleted[]` — messages the archive holds and Slack
 * no longer does. For those the archive is the only remaining copy, and a
 * refetch destroys them. Preserving or discarding is a human's call, so this
 * script makes it loudly and refuses to refetch that conversation, prints the
 * exact `mv` into `raw/superseded/` that a human must do first, and carries on
 * with the rest. A loud refusal costs one re-run; a silent overwrite costs a
 * message that exists nowhere else.
 */

// Loaded here and not only in `slack-client.ts`, because this script reads
// `SLACK_ARCHIVE_DIR` before it spawns anything that would have loaded it.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CACHE_DIR } from "./state-lib";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DIFF_ARCHIVE = resolve(SCRIPT_DIR, "diff-archive.ts");
const FETCH_CHANNEL = resolve(SCRIPT_DIR, "fetch-channel.ts");

/**
 * The subset of `diff-archive.ts`'s `Report` this script acts on.
 *
 * Declared again rather than imported because `diff-archive.ts` runs its
 * `main()` on import — it is a command, not a module. If a field is added
 * there, add it here; a missing field reads as `undefined` and is defaulted
 * below rather than crashing, so an older report still parses.
 */
interface DiffReport {
  archive: string;
  archivedConversations: number;
  slackConversations: number;
  stale: { id: string; name: string; reasons: string[] }[];
  fresh: { id: string; name: string }[];
  new: { id: string; name: string; messages: number }[];
  renamed: { id: string; archiveName: string; slackName: string }[];
  deleted: { id: string; name: string; lost: { ts: string; iso: string; preview: string }[] }[];
  vanished: { id: string; name: string; reason: string }[];
  empty: { id: string; name: string }[];
}

/** One conversation this run intends to refetch. */
interface Target {
  id: string;
  name: string;
  kind: "stale" | "new" | "rename";
  why: string;
}

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);

function argValue(name: string): string | undefined {
  const eq = argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const has = (name: string): boolean =>
  argv.some((a) => a === name || a.startsWith(`${name}=`));

const HELP = `
refresh-archive.ts — bring the verbatim Slack archive level with Slack.

  npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts \\
    --archive <path to she-sharp-slack-archive> [--apply] [--only <id,id>]

  --archive <path>  REQUIRED unless SLACK_ARCHIVE_DIR is set. The archive
                    checkout to refresh. There is deliberately no default: a
                    wrong one writes Slack transcripts into the wrong repository.
                    Set SLACK_ARCHIVE_DIR in .env to say it once per machine.
  --dry-run         The default. Runs the diff only and prints the plan.
  --apply           Actually refetch the stale/new conversations and rebuild.
  --only <id,id>    Restrict to these conversations (id or name).
  --report <path>   Reuse a diff-archive report already on disk instead of
                    asking Slack again. --dry-run only: acting on a stale
                    report could overwrite a deletion it never saw.
  --help

Three steps: diff-archive.ts (read-only) → fetch-channel.ts --many --out-dir
→ tools/build-archive.ts in the archive repo. Never passes --state or --since,
never shell-redirects, and refuses to refetch a conversation whose payload holds
messages Slack no longer has.

Exit codes: 0 clean · 1 a step failed · 2 bad usage · 3 finished with refusals.
`.trim();

if (has("--help") || has("-h")) {
  console.error(HELP);
  process.exit(0);
}

const apply = has("--apply");
/*
 * `SLACK_ARCHIVE_DIR` IS NOT A DEFAULT. IT IS THE SAME STATEMENT, MADE ONCE.
 *
 * The rule below — no default, because a wrong path writes Slack transcripts
 * into the wrong repository — is about nobody GUESSING the path. An environment
 * variable is not a guess; it is the archive holder saying once where their
 * checkout is, instead of once per invocation. And it is what let the hardcoded
 * `D:/github_repository/she-sharp-slack-archive` come out of SKILL.md and the
 * event playbook, where it made a step of the sync look impossible to anyone who
 * is not the one person with that directory.
 */
const archiveArg = argValue("--archive") ?? process.env.SLACK_ARCHIVE_DIR?.trim() ?? undefined;
const archiveFrom = argValue("--archive") ? "--archive" : "SLACK_ARCHIVE_DIR";
const reportPath = argValue("--report");
const onlyArg = argValue("--only");
const only = new Set(
  (onlyArg ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

function usage(message: string): never {
  console.error(`refresh-archive: ${message}\n`);
  console.error(HELP);
  process.exit(2);
}

if (!archiveArg) {
  /*
   * WHOEVER READS THIS IS PROBABLY NOT THE PERSON WHO SHOULD RUN IT.
   *
   * This used to read as a broken prerequisite: a required flag, no default, and
   * a hardcoded Windows path in SKILL.md's Step 7.6 and the event playbook's
   * T-6w. So a contributor syncing an event hit it, concluded the sync was
   * blocked on a directory they had never heard of, and either stopped or went
   * looking for the repository. Neither is right: the archive is a separate
   * private repository, refreshing it is not a step of a sync, and a sync is
   * complete without it. Say that here, because here is where they are standing.
   */
  console.error(
    "refresh-archive: no archive configured, and this is probably not your job.\n\n" +
      "  Refreshing the verbatim Slack archive is NOT part of syncing an event. A sync is\n" +
      "  complete without it: `state/sync-state.json` records what has been READ, the\n" +
      "  archive's `raw/` records what has been TRANSCRIBED, and only the first one lives\n" +
      "  in this repository. If you are here from `/sync-event-from-slack`, you are done —\n" +
      "  commit your event change and stop.\n\n" +
      "  If you DO hold the she-sharp-slack-archive checkout, point at it once:\n" +
      "    SLACK_ARCHIVE_DIR=/path/to/she-sharp-slack-archive   (in .env)\n" +
      "  or per run: --archive /path/to/she-sharp-slack-archive\n\n" +
      "  There is no default on purpose — a wrong path writes Slack transcripts into the\n" +
      "  wrong repository. Nothing was read and nothing was written.",
  );
  process.exit(2);
}
if (has("--only") && !onlyArg) usage("--only needs a comma-separated list of ids or names");
if (has("--report") && !reportPath) usage("--report needs a path");
if (reportPath && apply) {
  usage(
    "--report is --dry-run only. A saved report is a snapshot, and acting on " +
      "one could overwrite a conversation whose messages were deleted in Slack " +
      "after it was taken. Re-run the diff for real before --apply.",
  );
}

const archiveRoot = resolve(archiveArg);
// Every path complaint names where the path came from. A stale SLACK_ARCHIVE_DIR
// left over from a machine that has been reimaged is otherwise indistinguishable
// from a typed flag, and only one of the two is fixed in the command you just ran.
if (!existsSync(archiveRoot)) usage(`no such directory: ${archiveRoot} (from ${archiveFrom})`);
const rawDir = resolve(archiveRoot, "raw");
if (!existsSync(rawDir)) {
  usage(
    `${archiveRoot} (from ${archiveFrom}) has no raw/ directory, so it is not the Slack ` +
      `archive. Point it at the she-sharp-slack-archive checkout.`,
  );
}
const supersededDir = resolve(rawDir, "superseded");
const buildArchive = resolve(archiveRoot, "tools", "build-archive.ts");
if (apply && !existsSync(buildArchive)) {
  usage(
    `${archiveRoot} has raw/ but no tools/build-archive.ts, so the rebuild step ` +
      `has nothing to run. Point --archive at the she-sharp-slack-archive checkout.`,
  );
}

// ---------------------------------------------------------------------------
// running the other scripts
// ---------------------------------------------------------------------------

/**
 * Run another TypeScript file under the SAME runner that is running this one.
 *
 * `process.execArgv` under `npx tsx` carries tsx's own preflight + loader
 * flags, so reusing it spawns the identical toolchain without resolving `tsx`
 * from PATH — which on Windows means a `.cmd` shim that cannot be spawned
 * without `shell: true`, and a shell is exactly what must not be in this path:
 * it is what turns an argument containing a space, or a `>`, into something
 * other than an argument.
 *
 * stdout is captured, never inherited, because this script's own stdout must
 * stay empty; stderr is inherited so a forty-minute fetch shows progress live.
 */
function runTs(
  script: string,
  args: string[],
  opts: { cwd?: string } = {},
): { status: number; stdout: string } {
  const runnerArgs = process.execArgv.filter((a) => !a.startsWith("--inspect"));
  if (!runnerArgs.some((a) => a.includes("tsx"))) {
    console.error(
      "refresh-archive: this script re-uses its own runner to start the child " +
        "scripts, and cannot see a TypeScript loader in process.execArgv.\n" +
        "Run it as: npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts …",
    );
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [...runnerArgs, script, ...args], {
    cwd: opts.cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true,
    encoding: "utf8",
  });
  if (r.error) {
    console.error(`refresh-archive: could not start ${script}: ${r.error.message}`);
    process.exit(1);
  }
  const stdout = r.stdout ?? "";
  return { status: r.status ?? 1, stdout };
}

/**
 * The delta guard, as an assertion rather than a note.
 *
 * `--state` and `--since` make `fetch-channel.ts` emit only what changed, and a
 * delta written into `raw/` silently replaces a full transcript with a handful
 * of messages. Nothing below constructs either flag; this is here so that a
 * future edit which does cannot reach Slack.
 */
function assertFullFetchArgs(args: string[]): void {
  const forbidden = args.filter((a) => /^--(state|since)(=|$)/.test(a));
  if (forbidden.length) {
    console.error(
      `refresh-archive: refusing to fetch with ${forbidden.join(" ")} — those write a ` +
        `delta, and a delta in raw/ is a truncated transcript that looks like a good one.`,
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// step 1 — the diff
// ---------------------------------------------------------------------------

function loadReport(): DiffReport {
  if (reportPath) {
    if (!existsSync(reportPath)) usage(`no such report: ${reportPath}`);
    console.error(`refresh-archive: reading a saved report from ${reportPath} (no Slack call)`);
    return parseReport(readFileSync(reportPath, "utf8"), reportPath);
  }
  console.error(`refresh-archive: step 1/3 — diffing ${archiveRoot} against Slack…\n`);
  const r = runTs(DIFF_ARCHIVE, ["--archive", archiveRoot]);
  if (r.status !== 0) {
    console.error(
      `\nrefresh-archive: diff-archive.ts exited ${r.status}. Nothing was written. ` +
        `If it failed on auth, check SLACK_USER_TOKEN / SLACK_BOT_TOKEN in .env.`,
    );
    process.exit(1);
  }
  return parseReport(r.stdout, "diff-archive.ts");
}

function parseReport(text: string, source: string): DiffReport {
  let parsed: Partial<DiffReport>;
  try {
    parsed = JSON.parse(text) as Partial<DiffReport>;
  } catch (e) {
    console.error(
      `refresh-archive: could not parse the report from ${source}: ${(e as Error).message}\n` +
        `  stdout is the payload in this skill — if a log line landed in it, that is the bug.`,
    );
    process.exit(1);
  }
  return {
    archive: parsed.archive ?? archiveRoot,
    archivedConversations: parsed.archivedConversations ?? 0,
    slackConversations: parsed.slackConversations ?? 0,
    stale: parsed.stale ?? [],
    fresh: parsed.fresh ?? [],
    new: parsed.new ?? [],
    renamed: parsed.renamed ?? [],
    deleted: parsed.deleted ?? [],
    vanished: parsed.vanished ?? [],
    empty: parsed.empty ?? [],
  };
}

// ---------------------------------------------------------------------------
// the plan
// ---------------------------------------------------------------------------

/**
 * True when a reported rename is a naming disagreement rather than a rename.
 *
 * `conversationName()` names a DM from the workspace user directory and falls
 * back to the raw user id when the directory has no entry. `users.list` omits
 * Slackbot, so the triage computes `dm:USLACK` while the stored payload says
 * `dm:Slack` — resolved there from the message authors the fetch actually saw.
 * Nothing was renamed and a refetch cannot change it: the new payload is
 * byte-identical and the next run reports the same rename again, forever.
 *
 * The test is directional. id → name is a real improvement and must refetch
 * (two DMs became `dm:annamigdalek` and `dm:gowrislokesh12` that way). Only
 * name → id is the directory failing, and that one is skipped and explained.
 */
const UNRESOLVED_DM = /^dm:U[A-Z0-9]{4,}$/;
const isPhantomRename = (r: { archiveName: string; slackName: string }): boolean =>
  UNRESOLVED_DM.test(r.slackName) && !UNRESOLVED_DM.test(r.archiveName);

const selected = (t: { id: string; name?: string; archiveName?: string; slackName?: string }): boolean => {
  if (only.size === 0) return true;
  // A rename carries two names, and --only may reasonably use either of them.
  const names = [t.name, t.archiveName, t.slackName].filter(Boolean) as string[];
  return only.has(t.id.toLowerCase()) || names.some((n) => only.has(n.toLowerCase()));
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function main(): void {
  const report = loadReport();

  const deletions = new Map(report.deleted.map((d) => [d.id, d]));

  const wanted: Target[] = [
    ...report.stale.filter(selected).map(
      (s): Target => ({
        id: s.id,
        name: s.name,
        kind: "stale",
        why: s.reasons.join("; ") || "stale",
      }),
    ),
    ...report.new.filter(selected).map(
      (n): Target => ({
        id: n.id,
        name: n.name,
        kind: "new",
        why: `${n.messages} message(s), not in the archive`,
      }),
    ),
    /*
     * A rename is a refetch, not a rebuild.
     *
     * `build-archive.ts` names each transcript from the name inside
     * `raw/<id>.json`, so a conversation whose only change is its name keeps
     * the old filename through any number of rebuilds — the payload still
     * says what it always said. This step used to print "the rebuild moves
     * the transcript file", which was simply untrue: a full --apply on
     * 21 August 2026 rebuilt everything and left `dm-U07B80HRBGW--…md`
     * exactly where it was, with the rename still reported afterwards. Left
     * alone it is permanent: the report never clears, and a DM stays filed
     * under a user id nobody can grep for.
     */
    ...report.renamed.filter((r) => selected(r) && !isPhantomRename(r)).map(
      (r): Target => ({
        id: r.id,
        name: r.slackName,
        kind: "rename",
        why: `renamed in Slack: ${r.archiveName} → ${r.slackName}`,
      }),
    ),
  ];

  if (only.size) {
    const matched = new Set(wanted.flatMap((t) => [t.id.toLowerCase(), t.name.toLowerCase()]));
    for (const o of only) {
      if (!matched.has(o)) {
        console.error(`  --only ${o}: not stale and not new — nothing to do for it`);
      }
    }
  }

  // A conversation Slack has deleted messages from is never refetched here.
  const refused = wanted.filter((t) => deletions.has(t.id));
  const targets = wanted.filter((t) => !deletions.has(t.id));

  console.error(
    `\nplan${apply ? "" : " (dry run — nothing will be written)"}: ` +
      `${targets.filter((t) => t.kind === "stale").length} stale · ` +
      `${targets.filter((t) => t.kind === "new").length} new · ` +
      `${targets.filter((t) => t.kind === "rename").length} renamed · ` +
      `${refused.length} refused · ` +
      `${report.fresh.length} already current`,
  );
  for (const t of targets) {
    const label = t.kind === "stale" ? "REFETCH" : t.kind === "rename" ? "RENAME " : "ADD    ";
    console.error(`  ${label} ${t.name} (${t.id}) — ${t.why}`);
  }
  for (const r of report.renamed.filter(isPhantomRename)) {
    console.error(
      `  NAMING  ${r.archiveName} (${r.id}) — the triage calls this ${r.slackName}; ` +
        `not a rename, and not refetched. \`users.list\` has no entry for that id, ` +
        `so the archive's name is the better one.`,
    );
  }
  for (const v of report.vanished) {
    console.error(`  GONE    ${v.name} (${v.id}) — ${v.reason}; the archive keeps it either way`);
  }

  /*
   * Deletions are printed for EVERY conversation that has them, not only the
   * ones this run wanted to touch. A payload holding messages Slack no longer
   * has is the archive's whole reason for existing, and a run that quietly
   * skipped it because it happened to be otherwise current would be the same
   * silence this script was written to end.
   */
  if (report.deleted.length) {
    console.error(
      `\nDELETED AT SOURCE — ${report.deleted.length} conversation(s) hold messages ` +
        `Slack no longer has. The archive is their only copy.`,
    );
    for (const d of report.deleted) {
      const isTarget = wanted.some((t) => t.id === d.id);
      console.error(
        `\n  ${d.name} (${d.id}) — ${d.lost.length} message(s) gone from Slack` +
          (isTarget
            ? ", and this run wanted to refetch it: REFUSED"
            : " (this run was not going to refetch it, so nothing is at risk)"),
      );
      for (const l of d.lost.slice(0, 10)) console.error(`      ${l.iso}  ${l.preview}`);
      if (d.lost.length > 10) console.error(`      …and ${d.lost.length - 10} more`);
      if (!isTarget) continue;
      console.error(
        `    Refetching would overwrite them, so this script will not. To go ahead,\n` +
          `    preserve the payload first — MOVE, do not copy — then re-run:\n` +
          `      mv "${resolve(rawDir, `${d.id}.json`)}" \\\n` +
          `         "${resolve(supersededDir, `${d.id}.${today()}.json`)}"\n` +
          `      npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts \\\n` +
          `        --archive "${archiveRoot}" --apply --only ${d.id}\n` +
          `    Moving it is what makes the next diff see the conversation as new, so it\n` +
          `    gets a clean full fetch. build-archive.ts rebuilds conversations/ from\n` +
          `    raw/*.json only, so after that the deleted messages live in\n` +
          `    raw/superseded/ and in git history — nowhere else.`,
      );
    }
  }

  if (!apply) {
    console.error(
      `\nDry run. Nothing was fetched and nothing was rebuilt.` +
        (targets.length
          ? `\nRe-run with --apply to refetch ${targets.length} conversation(s) and rebuild.`
          : `\nThe archive is level with Slack.`),
    );
    process.exit(refused.length ? 3 : 0);
  }

  if (!targets.length) {
    console.error(`\nNothing to refetch.`);
    /*
     * The rebuild still runs. `conversations/`, INDEX.md and manifest.json are
     * 100% derived from raw/, and they went stale independently for months
     * whenever someone dropped a payload in by hand — regenerating from an
     * unchanged raw/ is free and makes "current" mean the same thing twice.
     */
    rebuild();
    process.exit(refused.length ? 3 : 0);
  }

  // -------------------------------------------------------------------------
  // step 2 — refetch
  // -------------------------------------------------------------------------

  mkdirSync(CACHE_DIR, { recursive: true });
  const startedAt = Date.now();
  let failures = 0;

  /*
   * TWO PASSES, AND ONLY ONE OF THEM GETS `--skip-existing`.
   *
   * `--skip-existing` skips any destination that already parses as a complete
   * payload — which every stale conversation does, since staleness means the
   * full payload we hold has fallen behind, not that it is broken. Passing it
   * on the stale pass would make the whole refresh a silent no-op: it would log
   * "skip … (already full)" for each one and exit 0. On the new pass it is
   * exactly right, because nothing should exist yet and re-running after a
   * rate-limit abort then costs only what actually failed.
   */
  // A rename goes on the stale pass: its payload exists and must be OVERWRITTEN
  // with one carrying the new name, which --skip-existing would refuse to do.
  const stale = targets.filter((t) => t.kind === "stale" || t.kind === "rename");
  const fresh = targets.filter((t) => t.kind === "new");

  if (stale.length) {
    const file = writeIdsFile("refresh-stale.txt", stale);
    console.error(
      `
refresh-archive: step 2/3 — refetching ${stale.length} stale or renamed conversation(s)…`,
    );
    failures += runFetch(["--many", file, "--out-dir", rawDir]);
  }
  if (fresh.length) {
    const file = writeIdsFile("refresh-new.txt", fresh);
    console.error(`\nrefresh-archive: step 2/3 — fetching ${fresh.length} new conversation(s)…`);
    failures += runFetch(["--many", file, "--out-dir", rawDir, "--skip-existing"]);
  }

  // -------------------------------------------------------------------------
  // the mode check, before anything reads raw/ as if it were sound
  // -------------------------------------------------------------------------

  const corrupt: string[] = [];
  const missing: string[] = [];
  const untouched: string[] = [];
  for (const t of targets) {
    const dest = resolve(rawDir, `${t.id}.json`);
    if (!existsSync(dest)) {
      missing.push(`${t.name} (${t.id}) — no payload was written`);
      continue;
    }
    let payload: { _meta?: { mode?: string; since?: string | null } };
    try {
      payload = JSON.parse(readFileSync(dest, "utf8"));
    } catch (e) {
      corrupt.push(`${t.name} (${t.id}) — unparseable: ${(e as Error).message}`);
      continue;
    }
    const meta = payload._meta ?? {};
    if (meta.mode !== "full" || (meta.since ?? null) !== null) {
      corrupt.push(
        `${t.name} (${t.id}) — _meta.mode="${meta.mode}" since="${meta.since}"; ` +
          `this is a delta, not a transcript`,
      );
      continue;
    }
    // Only meaningful for stale targets: a new one may legitimately have been
    // skipped by --skip-existing because an earlier run already wrote it.
    if (t.kind !== "new" && statSync(dest).mtimeMs < startedAt) {
      untouched.push(`${t.name} (${t.id})`);
    }
  }

  for (const m of missing) console.error(`  FAILED   ${m}`);
  for (const u of untouched) console.error(`  UNCHANGED ${u} — the fetch did not rewrite it`);

  if (corrupt.length) {
    console.error(
      `\nrefresh-archive: STOPPING. ${corrupt.length} payload(s) in raw/ are not full fetches:`,
    );
    for (const c of corrupt) console.error(`  ${c}`);
    console.error(
      `\nbuild-archive.ts will NOT be run — it would turn a truncated payload into a\n` +
        `truncated transcript and overwrite the good one. Fix each file first: refetch\n` +
        `it in full (no --state, no --since), or restore it from git in the archive repo:\n` +
        `  npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-channel.ts <id> \\\n` +
        `    --out "${resolve(rawDir, "<id>.json")}"`,
    );
    process.exit(1);
  }

  if (failures || missing.length || untouched.length) {
    console.error(
      `\nrefresh-archive: ${failures || missing.length} conversation(s) did not refresh. ` +
        `Their old payloads are untouched — re-run the same command to retry only those.`,
    );
  }

  // -------------------------------------------------------------------------
  // step 3 — rebuild
  // -------------------------------------------------------------------------

  const built = rebuild();

  console.error(
    `\nrefresh-archive: done. ${targets.length - missing.length} conversation(s) refreshed` +
      (refused.length ? `, ${refused.length} refused (see above)` : "") +
      `.\nCommit the archive repo separately — nothing from it may be copied into this one.`,
  );
  process.exit(!built || failures || missing.length ? 1 : refused.length ? 3 : 0);
}

/**
 * Write the `--many` list into the skill's gitignored `.cache/`.
 *
 * One id per line. `fetch-channel.ts` trims whole lines and drops the ones
 * starting with `#`, so the name goes on its own comment line above the id
 * rather than trailing it — a trailing comment would become part of the id.
 */
function writeIdsFile(name: string, targets: Target[]): string {
  const path = resolve(CACHE_DIR, name);
  const lines = targets.flatMap((t) => [`# ${t.name} — ${t.why}`, t.id]);
  writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
  return path;
}

/**
 * Repeat a child's stdout on OUR stderr.
 *
 * `build-archive.ts` prints its summary — "N conversations → N files" — on
 * stdout, and this script's stdout has to stay empty, so it is captured rather
 * than inherited. Captured and dropped would hide the one line that says the
 * rebuild did anything.
 */
function relay(stdout: string): void {
  const text = stdout.trim();
  if (text) for (const line of text.split(/\r?\n/)) console.error(`  ${line}`);
}

/** One `fetch-channel.ts --many` pass. Returns the number of failures it reported. */
function runFetch(args: string[]): number {
  assertFullFetchArgs(args);
  const r = runTs(FETCH_CHANNEL, args);
  relay(r.stdout);
  // `--many` exits with the count of conversations that failed, capped at 250.
  return r.status;
}

/** Step 3: regenerate conversations/, manifest.json, INDEX.md, google-links.json. */
function rebuild(): boolean {
  console.error(`\nrefresh-archive: step 3/3 — rebuilding transcripts in ${archiveRoot}…`);
  const r = runTs(buildArchive, [], { cwd: archiveRoot });
  relay(r.stdout);
  if (r.status !== 0) {
    console.error(
      `\nrefresh-archive: build-archive.ts exited ${r.status}. raw/ is updated but ` +
        `conversations/, manifest.json and INDEX.md still describe the previous snapshot.`,
    );
    return false;
  }
  return true;
}

main();
