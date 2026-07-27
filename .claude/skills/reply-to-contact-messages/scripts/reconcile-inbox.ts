/**
 * Join `contact_form_submissions` against the #contact-form-notifications Slack
 * channel and report exactly which enquiries still need a human reply.
 *
 * Why this exists: there is no `replied` status in the `form_status` enum, so
 * the ONLY durable "already handled" signal in the database is
 * `reviewed_at IS NOT NULL`. Slack carries a second, softer signal — a teammate
 * may have answered in-thread without ever touching the DB. Answering an
 * enquiry twice (or emailing a QA test row) is worse than answering late, so
 * this script surfaces both signals side by side and refuses to include any row
 * whose Slack match is ambiguous.
 *
 * Read-only: SELECT on the database, conversations.* on Slack. Writes nothing.
 *
 * Usage:
 *   npx tsx .claude/skills/reply-to-contact-messages/scripts/reconcile-inbox.ts
 *   npx tsx .../reconcile-inbox.ts --json              # machine-readable payload
 *   npx tsx .../reconcile-inbox.ts --include-handled   # also list reviewed rows
 *   npx tsx .../reconcile-inbox.ts --no-slack          # DB only (Slack unreachable)
 *   npx tsx .../reconcile-inbox.ts --limit 20          # cap how many pending rows are shown
 *   npx tsx .../reconcile-inbox.ts --slack-depth 500   # read further back through the channel
 *
 * Output (--json), field names are a stable contract for SKILL.md:
 * {
 *   generatedAt: string,
 *   counts: { pending, matched, dbOnly, slackOnly, ambiguous,
 *             general, sponsor, qaTest, vendorPitch },
 *   pending: [{ id, fullName, email, organisation, message, submittedAt, kind,
 *               reconcile, slack: { ts, permalink, matchedBy, hasHumanReply } | null }],
 *   slackOnly: [{ ts, email, name, permalink }],
 *   ambiguous: [{ id, email, candidates: [{ ts, deltaSeconds, permalink }] }]
 * }
 *
 * `kind` drives which template the reply uses. `qa-test` rows must never be
 * emailed. `vendor-pitch` is advisory only — unsolicited agency outreach looks
 * obvious to a human but a false positive would silently bin a real person's
 * message, so those rows are surfaced for a human decision, never auto-marked.
 * `reconcile: "db-only"` means the DB row has no Slack counterpart — still
 * replyable, just unlinkable. Ambiguous rows are deliberately EXCLUDED from
 * `pending` so an automated pass cannot act on a bad match.
 */

import "dotenv/config";
import { asc } from "drizzle-orm";
import {
  createSlackClient,
  fetchContactNotifications,
  maskEmail,
  tsToMs,
  type ParsedNotification,
} from "./slack-contact-lib";
import { client, db } from "../../../../lib/db/drizzle";
import { contactFormSubmissions } from "../../../../lib/db/schema";

// ---- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const exact = argv.indexOf(name);
  if (exact >= 0) return argv[exact + 1];
  const inline = argv.find((a) => a.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : undefined;
}

const asJson = argv.includes("--json");
const includeHandled = argv.includes("--include-handled");
const noSlack = argv.includes("--no-slack");
const limitRaw = flagValue("--limit");
const limit = limitRaw ? Number(limitRaw) : null;

if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
  console.error("ERROR: --limit must be a positive number.");
  process.exit(2);
}

/**
 * How many Slack messages to read back through, independent of `--limit`.
 *
 * Matching quality depends on seeing the notification that belongs to the
 * OLDEST pending row, which may sit far up the channel. Capping this alongside
 * the display limit produced false `db-only` results, so it has its own flag
 * and a default generous enough to cover the channel's whole history to date.
 */
const slackDepthRaw = flagValue("--slack-depth");
const slackDepth = slackDepthRaw ? Number(slackDepthRaw) : 200;

if (!Number.isFinite(slackDepth) || slackDepth <= 0) {
  console.error("ERROR: --slack-depth must be a positive number.");
  process.exit(2);
}

// ---- types ----------------------------------------------------------------

type Kind = "general" | "sponsor" | "qa-test" | "vendor-pitch";
type Reconcile = "matched" | "db-only";
type MatchedBy = "submission-id" | "fuzzy";

interface PendingRow {
  id: number;
  fullName: string;
  email: string;
  organisation: string | null;
  message: string;
  submittedAt: string;
  kind: Kind;
  reconcile: Reconcile;
  slack: { ts: string; permalink: string | null; matchedBy: MatchedBy; hasHumanReply: boolean } | null;
}

interface AmbiguousRow {
  id: number;
  email: string;
  candidates: { ts: string; deltaSeconds: number; permalink: string | null }[];
}

interface Report {
  generatedAt: string;
  counts: {
    pending: number;
    matched: number;
    dbOnly: number;
    slackOnly: number;
    ambiguous: number;
    general: number;
    sponsor: number;
    qaTest: number;
    vendorPitch: number;
  };
  pending: PendingRow[];
  slackOnly: { ts: string; email: string | null; name: string | null; permalink: string | null }[];
  ambiguous: AmbiguousRow[];
}

interface DbRow {
  id: number;
  fullName: string;
  email: string;
  organisation: string | null;
  message: string;
  submittedAt: Date;
  reviewedAt: Date | null;
}

// ---- classification -------------------------------------------------------

/**
 * QA/test rows are recognised before the sponsor prefix on purpose: a QA run of
 * the sponsor form produces a row that satisfies BOTH rules, and the expensive
 * mistake is emailing a real-looking reply to a teammate's test submission.
 */
const QA_PATTERN = /\b(qa|test|verification|dev)\b/i;

/**
 * Signals of unsolicited vendor outreach — agencies pitching web design, lead
 * generation, SEO and the like. Two of the six genuine enquiries sitting in the
 * production inbox on 2026-07-28 were exactly this, so triage has to name the
 * category rather than routing them into the warm "general enquiry" template.
 *
 * Deliberately advisory, never automatic: `vendor-pitch` only ever *proposes*
 * "no reply needed", and the human has to confirm before the row is marked.
 * A false positive here would silently bin a real person's message.
 */
const VENDOR_SIGNALS: RegExp[] = [
  /\bwe help (businesses|companies|brands|organisations|organizations)\b/i,
  /\b(grab|book|pick|schedule) a (time|slot|call|meeting)\b/i,
  /\b(calendly\.com|hubspot\.com\/meetings|cal\.com|calendar\.[a-z0-9-]+\.[a-z]{2,})/i,
  /\bI (took|had) a (quick )?look at your (site|website)\b/i,
  /\bour database of\b/i,
  /\b(booked meetings|lead generation|cold outreach|conversion rate|drive traffic)\b/i,
  /\b(no obligation|free audit|quick chat|15[- ]minute call)\b/i,
];

/** Counts how many independent vendor-pitch signals a message trips. */
function vendorSignalCount(message: string): number {
  return VENDOR_SIGNALS.filter((re) => re.test(message)).length;
}

function classifyKind(row: DbRow): Kind {
  if (QA_PATTERN.test(row.fullName)) return "qa-test";
  if (row.organisation && QA_PATTERN.test(row.organisation)) return "qa-test";
  if (/^\s*\[Sponsor Inquiry\]/.test(row.message)) return "sponsor";
  // Two independent signals: one alone is too easy to trip by accident (a real
  // member might genuinely say "happy to grab a time").
  if (vendorSignalCount(row.message) >= 2) return "vendor-pitch";
  return "general";
}

// ---- matching -------------------------------------------------------------

/** Slack posts within seconds of the insert; allow for clock skew + retries. */
const WINDOW_BEFORE_MS = 60 * 1000;
const WINDOW_AFTER_MS = 15 * 60 * 1000;
const PREFIX_LEN = 40;

function messagePrefix(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, PREFIX_LEN).toLowerCase();
}

interface MatchOutcome {
  bySubmissionId: Map<number, ParsedNotification>;
  fuzzy: Map<number, ParsedNotification>;
  ambiguous: Map<number, ParsedNotification[]>;
  consumed: Set<string>;
}

/**
 * Two-pass join. The explicit `Submission #<id>` footer wins outright; only the
 * leftovers (messages posted before that footer existed) fall through to the
 * email + time-window heuristic.
 */
function matchNotifications(rows: DbRow[], notifications: ParsedNotification[]): MatchOutcome {
  const bySubmissionId = new Map<number, ParsedNotification>();
  const fuzzy = new Map<number, ParsedNotification>();
  const ambiguous = new Map<number, ParsedNotification[]>();
  const consumed = new Set<string>();

  const idIndex = new Map<number, ParsedNotification>();
  for (const n of notifications) {
    if (n.submissionId !== null && !idIndex.has(n.submissionId)) idIndex.set(n.submissionId, n);
  }

  const unmatchedRows: DbRow[] = [];
  for (const row of rows) {
    const hit = idIndex.get(row.id);
    if (hit) {
      bySubmissionId.set(row.id, hit);
      consumed.add(hit.ts);
    } else {
      unmatchedRows.push(row);
    }
  }

  for (const row of unmatchedRows) {
    const submittedMs = row.submittedAt.getTime();
    const rowEmail = row.email.toLowerCase();
    const candidates = notifications.filter((n) => {
      if (consumed.has(n.ts)) return false;
      if (!n.email || n.email.toLowerCase() !== rowEmail) return false;
      const ms = tsToMs(n.ts);
      return ms >= submittedMs - WINDOW_BEFORE_MS && ms <= submittedMs + WINDOW_AFTER_MS;
    });

    if (candidates.length === 0) continue;
    if (candidates.length === 1) {
      fuzzy.set(row.id, candidates[0]);
      consumed.add(candidates[0].ts);
      continue;
    }

    // Several messages from the same address in the same window: only a message
    // whose body opens identically can be claimed, and only if one is strictly
    // closer in time than the rest.
    const wantPrefix = messagePrefix(row.message);
    const narrowed = candidates
      .filter((n) => messagePrefix(n.message) === wantPrefix)
      .sort((a, b) => Math.abs(tsToMs(a.ts) - submittedMs) - Math.abs(tsToMs(b.ts) - submittedMs));

    const decided =
      narrowed.length === 1
        ? narrowed[0]
        : narrowed.length > 1 &&
            Math.abs(tsToMs(narrowed[0].ts) - submittedMs) < Math.abs(tsToMs(narrowed[1].ts) - submittedMs)
          ? narrowed[0]
          : null;

    if (decided) {
      fuzzy.set(row.id, decided);
      consumed.add(decided.ts);
    } else {
      ambiguous.set(row.id, candidates);
    }
  }

  return { bySubmissionId, fuzzy, ambiguous, consumed };
}

// ---- reporting ------------------------------------------------------------

function buildReport(rows: DbRow[], notifications: ParsedNotification[], slackEnabled: boolean): Report {
  const { bySubmissionId, fuzzy, ambiguous, consumed } = slackEnabled
    ? matchNotifications(rows, notifications)
    : {
        bySubmissionId: new Map<number, ParsedNotification>(),
        fuzzy: new Map<number, ParsedNotification>(),
        ambiguous: new Map<number, ParsedNotification[]>(),
        consumed: new Set<string>(),
      };

  const candidateRows = rows.filter((r) => includeHandled || r.reviewedAt === null);

  const pending: PendingRow[] = [];
  const ambiguousOut: AmbiguousRow[] = [];

  for (const row of candidateRows) {
    const ambiguousHits = ambiguous.get(row.id);
    if (ambiguousHits) {
      ambiguousOut.push({
        id: row.id,
        email: row.email,
        candidates: ambiguousHits.map((n) => ({
          ts: n.ts,
          deltaSeconds: Math.round((tsToMs(n.ts) - row.submittedAt.getTime()) / 1000),
          permalink: n.permalink,
        })),
      });
      continue; // deliberately NOT replyable
    }

    const idHit = bySubmissionId.get(row.id);
    const fuzzyHit = fuzzy.get(row.id);
    const hit = idHit ?? fuzzyHit ?? null;

    pending.push({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      organisation: row.organisation,
      message: row.message,
      submittedAt: row.submittedAt.toISOString(),
      kind: classifyKind(row),
      reconcile: hit ? "matched" : "db-only",
      slack: hit
        ? {
            ts: hit.ts,
            permalink: hit.permalink,
            matchedBy: idHit ? "submission-id" : "fuzzy",
            hasHumanReply: hit.hasHumanReply,
          }
        : null,
    });
  }

  const capped = limit !== null ? pending.slice(0, limit) : pending;

  const slackOnly = notifications
    .filter((n) => !consumed.has(n.ts))
    .map((n) => ({ ts: n.ts, email: n.email, name: n.name, permalink: n.permalink }));

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      pending: capped.length,
      matched: capped.filter((p) => p.reconcile === "matched").length,
      dbOnly: capped.filter((p) => p.reconcile === "db-only").length,
      slackOnly: slackOnly.length,
      ambiguous: ambiguousOut.length,
      general: capped.filter((p) => p.kind === "general").length,
      sponsor: capped.filter((p) => p.kind === "sponsor").length,
      qaTest: capped.filter((p) => p.kind === "qa-test").length,
      vendorPitch: capped.filter((p) => p.kind === "vendor-pitch").length,
    },
    pending: capped,
    slackOnly,
    ambiguous: ambiguousOut,
  };
}

function printHuman(report: Report, slackEnabled: boolean): void {
  const scope = includeHandled ? "all submissions" : "pending (reviewed_at IS NULL)";
  console.log(`Contact inbox — ${scope}${slackEnabled ? "" : "  [--no-slack: DB only]"}`);
  console.log("");

  if (report.pending.length === 0) {
    console.log("  (nothing to reply to)");
  }
  for (const p of report.pending) {
    const date = p.submittedAt.slice(0, 10);
    const who = `${p.fullName} <${maskEmail(p.email)}>`;
    const note = p.slack?.hasHumanReply ? "  [already answered in Slack thread]" : "";
    console.log(
      `  #${String(p.id).padEnd(4)} ${date}  ${who.padEnd(42)} ${p.kind.padEnd(12)} ${p.reconcile.padEnd(9)}${note}`,
    );
  }

  if (report.ambiguous.length) {
    console.log("");
    console.log("  Ambiguous (excluded from pending — resolve by hand before replying):");
    for (const a of report.ambiguous) {
      console.log(`    #${a.id} ${maskEmail(a.email)} → ${a.candidates.length} Slack candidates`);
    }
  }

  if (report.slackOnly.length) {
    console.log("");
    console.log(`  Slack-only notifications with no DB row: ${report.slackOnly.length}`);
    for (const s of report.slackOnly.slice(0, 10)) {
      console.log(`    ${s.ts}  ${(s.name ?? "—").padEnd(24)} ${maskEmail(s.email)}`);
    }
    if (report.slackOnly.length > 10) console.log(`    … and ${report.slackOnly.length - 10} more`);
  }

  const c = report.counts;
  console.log("");
  console.log(
    `  counts: pending=${c.pending} (matched=${c.matched}, db-only=${c.dbOnly}) ` +
      `slackOnly=${c.slackOnly} ambiguous=${c.ambiguous} | ` +
      `general=${c.general} sponsor=${c.sponsor} qa-test=${c.qaTest} vendor-pitch=${c.vendorPitch}`,
  );

  const replyable = report.pending.filter(
    (p) => p.kind === "general" || p.kind === "sponsor",
  ).length;
  const unanswered = report.pending.filter(
    (p) => (p.kind === "general" || p.kind === "sponsor") && !p.slack?.hasHumanReply,
  ).length;
  console.log(
    `  next: ${unanswered} of ${replyable} replyable row(s) look genuinely un-answered — ` +
      `draft replies for those; mark qa-test rows reviewed without emailing.`,
  );
  if (c.vendorPitch > 0) {
    console.log(
      `        ${c.vendorPitch} row(s) look like unsolicited vendor outreach. That is a ` +
        `judgement call — show the message to the user and let them decide before ` +
        `marking any of them "no reply needed".`,
    );
  }
}

// ---- main -----------------------------------------------------------------

async function main(): Promise<void> {
  const rows = (await db
    .select({
      id: contactFormSubmissions.id,
      fullName: contactFormSubmissions.fullName,
      email: contactFormSubmissions.email,
      organisation: contactFormSubmissions.organisation,
      message: contactFormSubmissions.message,
      submittedAt: contactFormSubmissions.submittedAt,
      reviewedAt: contactFormSubmissions.reviewedAt,
    })
    .from(contactFormSubmissions)
    .orderBy(asc(contactFormSubmissions.submittedAt))) as DbRow[];

  let notifications: ParsedNotification[] = [];
  if (!noSlack) {
    const slack = createSlackClient();
    // The Slack read depth is deliberately NOT tied to `--limit`. `--limit` caps
    // how many pending rows are shown; reusing it for history depth made
    // `--limit 5` silently shrink the search window, turning rows that do have a
    // Slack counterpart into false `db-only` results.
    const fetched = await fetchContactNotifications(slack, { limit: slackDepth });
    notifications = fetched.notifications;
  }

  const report = buildReport(rows, notifications, !noSlack);

  if (asJson) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    printHuman(report, !noSlack);
  }
}

main()
  .then(async () => {
    await client.end();
  })
  .catch(async (error: unknown) => {
    const err = error as { data?: unknown; message?: string };
    console.error("FATAL:", err?.data ?? err?.message ?? error);
    await client.end().catch(() => undefined);
    process.exit(1);
  });
