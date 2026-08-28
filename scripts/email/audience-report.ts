/**
 * Read-only inventory of every address list She Sharp holds, with its consent tier.
 *
 * Before any send, someone has to answer "who is actually allowed to receive
 * this?". The answer is spread across seven database tables plus Resend's own
 * contact list, and the consent that applies to each is different (see
 * `lib/email/audience.ts`). This script gathers all of it into one page so the
 * question is answered from data rather than from memory.
 *
 * Two deliberate constraints:
 *  - It NEVER writes addresses to disk. Output goes to the console only, and
 *    every sample address is masked (`j****@gmail.com`) so a pasted terminal
 *    log carries no usable PII.
 *  - Database counts are awaited SERIALLY, never with `Promise.all`. Neon
 *    throttles bursts of concurrent connection attempts and fails the whole
 *    batch with "Failed to acquire permit".
 *
 * Usage:
 *   npx tsx scripts/email/audience-report.ts [--json] [--include-resend]
 *
 *   --include-resend   Queries the Resend contact roster. **Resend no longer
 *                      holds the mailing list** — Tier 0 is the
 *                      `newsletter_subscribers` table, read with
 *                      `npx tsx scripts/email/inspect-subscribers.ts`. This flag
 *                      now reports on an account that holds nothing, and is kept
 *                      only to confirm that during the retirement. Do not read a
 *                      Tier 0 count out of it.
 *   --json             Emit the whole report as JSON on stdout instead of the
 *                      human table. Sample addresses stay masked.
 *
 * Output:
 *   One block per audience group — row count, distinct addresses, its
 *   `AudienceTier`, what that tier permits, and up to 3 masked sample
 *   addresses — followed by a conclusion naming which groups are broadcastable.
 */

import "dotenv/config";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sql, desc, isNull, isNotNull, eq } from "drizzle-orm";
import { db, client } from "@/lib/db/drizzle";
import {
  users,
  mentorFormSubmissions,
  menteeFormSubmissions,
  volunteerFormSubmissions,
  contactFormSubmissions,
  donations,
  eventRegistrations,
} from "@/lib/db/schema";
import { describeTier, type AudienceTier } from "@/lib/email/audience";

const execFileAsync = promisify(execFile);

/** How many sample addresses are shown per group before collapsing to "+N more". */
const MAX_SAMPLES = 3;

interface GroupReport {
  /** Table/list name as an operator would say it. */
  label: string;
  tier: AudienceTier;
  /** Why this group sits on that tier. */
  basis: string;
  /** Total rows in the group after its "still relevant" filter. */
  total: number;
  /** Distinct, non-null email addresses reachable in this group. */
  distinctEmails: number;
  /** Extra count lines worth calling out (test users, status breakdown, …). */
  notes: string[];
  /** Up to MAX_SAMPLES addresses, already masked. */
  samples: string[];
}

interface ResendReport {
  contacts: number;
  subscribed: number;
  segments: { id: string; name: string }[];
  topics: { id: string; name: string }[];
}

/**
 * Masks an address for display: first character, then the domain.
 *
 * @param email Raw address.
 * @returns e.g. `j****@gmail.com`. Returns `(none)` for an empty value.
 */
function mask(email: string | null | undefined): string {
  const value = (email ?? "").trim();
  if (value.length === 0) return "(none)";
  const at = value.lastIndexOf("@");
  if (at <= 0) return `${value[0]}****`;
  return `${value[0]}****${value.slice(at)}`;
}

/** Builds the masked sample list with an overflow hint. */
function summariseSamples(samples: string[], distinct: number): string[] {
  const shown = samples.slice(0, MAX_SAMPLES).map(mask);
  const extra = distinct - shown.length;
  if (extra > 0) shown.push(`+${extra} more`);
  return shown;
}

/** SQL fragment counting distinct non-null values of an expression. */
const countAll = sql<number>`count(*)::int`;

/**
 * Collects every database-side audience group.
 *
 * Each group runs two small queries (aggregate counts, then at most three
 * sample rows) and every one of them is awaited in sequence — see the Neon
 * connection-burst note in the file header.
 *
 * @returns One {@link GroupReport} per group, in reporting order.
 */
async function collectDatabaseGroups(): Promise<GroupReport[]> {
  const groups: GroupReport[] = [];

  // ---------- users ----------

  const userCounts = await db
    .select({
      active: sql<number>`count(*) filter (where ${users.deletedAt} is null)::int`,
      test: sql<number>`count(*) filter (where ${users.deletedAt} is null and ${users.isTestUser})::int`,
      distinct: sql<number>`count(distinct ${users.email}) filter (where ${users.deletedAt} is null)::int`,
    })
    .from(users);

  const userSamples = await db
    .select({ email: users.email })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "users (platform accounts, deleted_at IS NULL)",
    tier: 2,
    basis:
      "They created an account to use the platform — account and programme " +
      "fulfilment mail only, never a campaign.",
    total: userCounts[0].active,
    distinctEmails: userCounts[0].distinct,
    notes: [`${userCounts[0].test} flagged is_test_user (exclude from every send)`],
    samples: summariseSamples(
      userSamples.map((row) => row.email),
      userCounts[0].distinct
    ),
  });

  // ---------- mentor form submissions ----------

  const mentorEmail = sql<string>`coalesce(${mentorFormSubmissions.email}, ${users.email})`;

  const mentorCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${mentorEmail})::int`,
      submitted: sql<number>`count(*) filter (where ${mentorFormSubmissions.submittedAt} is not null)::int`,
    })
    .from(mentorFormSubmissions)
    .leftJoin(users, eq(mentorFormSubmissions.userId, users.id));

  const mentorSamples = await db
    .select({ email: mentorEmail })
    .from(mentorFormSubmissions)
    .leftJoin(users, eq(mentorFormSubmissions.userId, users.id))
    .orderBy(desc(mentorFormSubmissions.createdAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "mentor_form_submissions",
    tier: 2,
    basis:
      "They applied to mentor — mail about the mentorship programme they " +
      "applied to is fulfilment; anything else is not.",
    total: mentorCounts[0].total,
    distinctEmails: mentorCounts[0].distinct,
    notes: [`${mentorCounts[0].submitted} actually submitted (rest are drafts)`],
    samples: summariseSamples(
      mentorSamples.map((row) => row.email),
      mentorCounts[0].distinct
    ),
  });

  // ---------- mentee form submissions ----------

  const menteeEmail = sql<string>`coalesce(${menteeFormSubmissions.email}, ${users.email})`;

  const menteeCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${menteeEmail})::int`,
      submitted: sql<number>`count(*) filter (where ${menteeFormSubmissions.submittedAt} is not null)::int`,
    })
    .from(menteeFormSubmissions)
    .leftJoin(users, eq(menteeFormSubmissions.userId, users.id));

  const menteeSamples = await db
    .select({ email: menteeEmail })
    .from(menteeFormSubmissions)
    .leftJoin(users, eq(menteeFormSubmissions.userId, users.id))
    .orderBy(desc(menteeFormSubmissions.createdAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "mentee_form_submissions",
    tier: 2,
    basis:
      "They applied to be mentored — same rule as mentors: programme " +
      "fulfilment only.",
    total: menteeCounts[0].total,
    distinctEmails: menteeCounts[0].distinct,
    notes: [`${menteeCounts[0].submitted} actually submitted (rest are drafts)`],
    samples: summariseSamples(
      menteeSamples.map((row) => row.email),
      menteeCounts[0].distinct
    ),
  });

  // ---------- volunteer form submissions ----------

  const volunteerCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${volunteerFormSubmissions.email})::int`,
      pending: sql<number>`count(*) filter (where ${volunteerFormSubmissions.reviewedAt} is null)::int`,
    })
    .from(volunteerFormSubmissions);

  const volunteerSamples = await db
    .select({ email: volunteerFormSubmissions.email })
    .from(volunteerFormSubmissions)
    .orderBy(desc(volunteerFormSubmissions.createdAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "volunteer_form_submissions",
    tier: 2,
    basis:
      "They offered to volunteer — recruitment-pipeline mail about their own " +
      "application is fulfilment; a newsletter is not.",
    total: volunteerCounts[0].total,
    distinctEmails: volunteerCounts[0].distinct,
    notes: [`${volunteerCounts[0].pending} not yet reviewed`],
    samples: summariseSamples(
      volunteerSamples.map((row) => row.email),
      volunteerCounts[0].distinct
    ),
  });

  // ---------- contact form submissions ----------

  const contactCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${contactFormSubmissions.email})::int`,
      pending: sql<number>`count(*) filter (where ${contactFormSubmissions.reviewedAt} is null)::int`,
    })
    .from(contactFormSubmissions);

  const contactByStatus = await db
    .select({ status: contactFormSubmissions.status, n: countAll })
    .from(contactFormSubmissions)
    .groupBy(contactFormSubmissions.status)
    .orderBy(contactFormSubmissions.status);

  const contactSamples = await db
    .select({ email: contactFormSubmissions.email })
    .from(contactFormSubmissions)
    .where(isNull(contactFormSubmissions.reviewedAt))
    .orderBy(desc(contactFormSubmissions.submittedAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "contact_form_submissions",
    tier: 1,
    basis:
      "They wrote to us and asked for an answer. A 1:1 reply is what they " +
      "consented to; nothing else.",
    total: contactCounts[0].total,
    distinctEmails: contactCounts[0].distinct,
    notes: [
      `${contactCounts[0].pending} awaiting a reply (reviewed_at IS NULL)`,
      `by status: ${
        contactByStatus.map((row) => `${row.status}=${row.n}`).join(", ") || "(none)"
      }`,
    ],
    samples: summariseSamples(
      contactSamples.map((row) => row.email),
      contactCounts[0].pending
    ),
  });

  // ---------- donations ----------

  const donationCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${donations.donorEmail})::int`,
      withEmail: sql<number>`count(*) filter (where ${donations.donorEmail} is not null)::int`,
    })
    .from(donations);

  const donationSamples = await db
    .select({ email: donations.donorEmail })
    .from(donations)
    .where(isNotNull(donations.donorEmail))
    .orderBy(desc(donations.createdAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "donations (donor_email)",
    tier: 2,
    basis:
      "They gave money and got a receipt. Receipts and impact reporting on " +
      "their own gift are fulfilment; solicitation is a campaign.",
    total: donationCounts[0].total,
    distinctEmails: donationCounts[0].distinct,
    notes: [`${donationCounts[0].withEmail} rows carry a donor email`],
    samples: summariseSamples(
      donationSamples.map((row) => row.email ?? ""),
      donationCounts[0].distinct
    ),
  });

  // ---------- event registrations ----------

  const registrationCounts = await db
    .select({
      total: countAll,
      distinct: sql<number>`count(distinct ${users.email})::int`,
      people: sql<number>`count(distinct ${eventRegistrations.userId})::int`,
    })
    .from(eventRegistrations)
    .leftJoin(users, eq(eventRegistrations.userId, users.id));

  const registrationSamples = await db
    .select({ email: users.email })
    .from(eventRegistrations)
    .leftJoin(users, eq(eventRegistrations.userId, users.id))
    .orderBy(desc(eventRegistrations.registeredAt))
    .limit(MAX_SAMPLES);

  groups.push({
    label: "event_registrations (via users.email)",
    tier: 2,
    basis:
      "They signed up for one event. Logistics for THAT event are fulfilment; " +
      "promoting the next one is not.",
    total: registrationCounts[0].total,
    distinctEmails: registrationCounts[0].distinct,
    notes: [`${registrationCounts[0].people} distinct people registered`],
    samples: summariseSamples(
      registrationSamples.map((row) => row.email ?? ""),
      registrationCounts[0].distinct
    ),
  });

  return groups;
}

/** Minimal shape of a `resend … list --json` envelope. */
interface ResendList<T> {
  data?: T[];
}

/**
 * Runs one `resend` subcommand and parses its JSON envelope.
 *
 * @param args Subcommand and flags, e.g. `["contacts", "list", "--json"]`.
 * @returns The parsed `data` array (empty when the payload has none).
 * @throws Error with an actionable message when the CLI is missing or errored.
 */
async function resendList<T>(args: string[]): Promise<T[]> {
  const page = await resendPage<T>(args);
  return page.data;
}

/**
 * Runs one `resend … --json` list call and returns the page plus its cursor.
 *
 * Split out from `resendList` so paginated callers can follow `has_more`
 * instead of silently reporting only the first page.
 */
async function resendPage<T>(args: string[]): Promise<{ data: T[]; hasMore: boolean }> {
  try {
    const { stdout } = await execFileAsync("resend", args, {
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    const parsed = JSON.parse(stdout) as ResendList<T> & { has_more?: boolean };
    return { data: parsed.data ?? [], hasMore: parsed.has_more === true };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(
        "the `resend` CLI is not on PATH. Install it and re-run, or drop " +
          "--include-resend to get the database-side report only."
      );
    }
    throw new Error(
      `resend ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/** A contact as returned by `resend contacts list --json`. */
interface ResendContact {
  id: string;
  email: string;
  unsubscribed?: boolean;
}

/**
 * Walks every page of `resend contacts list`.
 *
 * The CLI caps `--limit` at 100 and signals more pages with `has_more`, so a
 * single call quietly under-reports any list larger than 100. That number is
 * used to decide whether a broadcast is worth sending, and an under-report
 * there is the kind of mistake nobody notices until the list has grown.
 */
async function listAllContacts(): Promise<ResendContact[]> {
  const all: ResendContact[] = [];
  let after: string | null = null;

  // Bounded so a malformed cursor can never spin forever: 200 pages × 100 is
  // far beyond any plausible She Sharp list.
  for (let page = 0; page < 200; page += 1) {
    const args = ["contacts", "list", "--limit", "100", "--json"];
    if (after) args.push("--after", after);

    const { data, hasMore } = await resendPage<ResendContact>(args);
    all.push(...data);
    if (!hasMore || data.length === 0) return all;
    after = data[data.length - 1].id;
  }

  console.warn(
    "WARNING: stopped paging Resend contacts after 20,000 records — the count below is a floor, not a total."
  );
  return all;
}

/**
 * Queries the Resend contact roster, which is no longer where Tier 0 lives.
 *
 * Kept for the retirement: it is how you confirm the account really is empty
 * before deleting the segment and topic. Anything it reports is a fact about
 * Resend, not about who may be emailed — that answer comes from
 * `newsletter_subscribers`.
 *
 * @returns Contact/segment/topic inventory, or null when the CLI is unusable
 *   (a warning is printed and the database report still stands).
 */
async function collectResend(): Promise<ResendReport | null> {
  try {
    const contacts = await listAllContacts();
    const segments = await resendList<{ id: string; name: string }>([
      "segments",
      "list",
      "--limit",
      "100",
      "--json",
    ]);
    const topics = await resendList<{ id: string; name: string }>(["topics", "list", "--json"]);

    return {
      contacts: contacts.length,
      subscribed: contacts.filter((contact) => contact.unsubscribed !== true).length,
      segments: segments.map((segment) => ({ id: segment.id, name: segment.name })),
      topics: topics.map((topic) => ({ id: topic.id, name: topic.name })),
    };
  } catch (error) {
    console.warn(
      `WARNING: skipping the Resend section — ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

/** Prints the human-readable report. */
function printReport(groups: GroupReport[], resend: ResendReport | null): void {
  console.log("");
  console.log("Audience Report");
  console.log("===================================");
  console.log("  Read-only. No address is written to disk; samples are masked.");
  console.log("===================================");

  if (resend) {
    console.log("");
    console.log("Resend contacts (NOT Tier 0 — the list lives in the database)");
    console.log(`  contacts:      ${resend.contacts} (${resend.subscribed} still subscribed)`);
    console.log(`  ${describeTier(0)}`);
    console.log(`  segments (${resend.segments.length}):`);
    for (const segment of resend.segments) {
      console.log(`    - ${segment.name}  ${segment.id}`);
    }
    console.log(`  topics (${resend.topics.length}):`);
    for (const topic of resend.topics) {
      console.log(`    - ${topic.name}  ${topic.id}`);
    }
  }

  for (const group of groups) {
    console.log("");
    console.log(`${group.label}`);
    console.log(`  rows:          ${group.total}`);
    console.log(`  distinct email:${String(group.distinctEmails).padStart(4)}`);
    for (const note of group.notes) {
      console.log(`  note:          ${note}`);
    }
    console.log(`  ${describeTier(group.tier)}`);
    console.log(`  basis:         ${group.basis}`);
    console.log(`  samples:       ${group.samples.join(", ") || "(none)"}`);
  }

  // ---------- conclusion ----------

  const tier0 = resend ? resend.subscribed : null;
  console.log("");
  console.log("Conclusion");
  console.log("===================================");
  if (tier0 === null) {
    console.log(
      "  Broadcastable: UNKNOWN — re-run with --include-resend to read the " +
        "Resend contact count. This is not the Tier 0 subscriber count."
    );
  } else {
    console.log(
      `  Broadcastable (marketing): ${tier0} Resend subscriber(s), Tier 0 only. ` +
        "Send campaigns as a Resend broadcast against a segment, never as a loop of emails."
    );
  }
  const tier1 = groups.filter((group) => group.tier === 1);
  const tier2 = groups.filter((group) => group.tier === 2);
  console.log(
    `  1:1 replies only (Tier 1): ${tier1.map((group) => group.label).join(", ") || "(none)"}`
  );
  console.log(`  Fulfilment only (Tier 2): ${tier2.map((group) => group.label).join(", ")}`);
  console.log(
    "  NOT allowed: mailing any Tier 1/2 group a campaign. Registering, applying, " +
      "donating or writing to us is not a newsletter subscription — invite them to"
  );
  console.log(
    "  subscribe inside mail they DID ask for, then send the campaign to Tier 0."
  );
  console.log("===================================");
  console.log("");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const includeResend = argv.includes("--include-resend");

  const unknown = argv.filter((arg) => arg !== "--json" && arg !== "--include-resend");
  if (unknown.length > 0) {
    console.error(`ERROR: unknown argument(s): ${unknown.join(", ")}`);
    console.error("Usage: npx tsx scripts/email/audience-report.ts [--json] [--include-resend]");
    process.exit(1);
  }

  const groups = await collectDatabaseGroups();
  const resend = includeResend ? await collectResend() : null;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          groups: groups.map((group) => ({
            ...group,
            tierDescription: describeTier(group.tier),
          })),
          resend,
        },
        null,
        2
      )
    );
  } else {
    printReport(groups, resend);
  }

  await client.end();
}

void main().catch(async (error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  await client.end().catch(() => undefined);
  process.exit(1);
});
