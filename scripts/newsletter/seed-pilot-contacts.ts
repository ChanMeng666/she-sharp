/**
 * Seeds pilot newsletter contacts on Resend from a local CSV.
 *
 * Reads `scripts/newsletter/pilot-contacts.local.csv` (header: `email,firstName`)
 * and creates each contact opted into the "Monthly Newsletter" topic and the
 * "Newsletter Pilot" segment (ids taken from env). Existing contacts are
 * treated as success. Prints a per-row summary table at the end.
 *
 * Usage:
 *   RESEND_API_KEY=... \
 *   RESEND_NEWSLETTER_TOPIC_ID=... RESEND_NEWSLETTER_SEGMENT_ID=... \
 *   npx tsx scripts/newsletter/seed-pilot-contacts.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createContact } from "../../lib/newsletter/resend-api";

const CSV_PATH = join(__dirname, "pilot-contacts.local.csv");

interface PilotRow {
  email: string;
  firstName: string;
}

/**
 * Parses the pilot CSV. Expects a header row containing `email` and
 * `firstName` columns (order-independent); ignores blank lines.
 *
 * @param raw - The raw CSV file contents.
 * @returns The parsed rows with a trimmed email and first name.
 */
function parsePilotCsv(raw: string): PilotRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  const firstNameIdx = header.indexOf("firstname");
  if (emailIdx === -1) {
    throw new Error('CSV header must contain an "email" column.');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      email: cols[emailIdx] ?? "",
      firstName: firstNameIdx === -1 ? "" : cols[firstNameIdx] ?? "",
    };
  });
}

async function main(): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Error: RESEND_API_KEY is not set. Run with:");
    console.error(
      "  RESEND_API_KEY=... RESEND_NEWSLETTER_TOPIC_ID=... RESEND_NEWSLETTER_SEGMENT_ID=... \\"
    );
    console.error("  npx tsx scripts/newsletter/seed-pilot-contacts.ts");
    process.exit(1);
  }

  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID;
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  if (!topicId || !segmentId) {
    console.error(
      "Error: RESEND_NEWSLETTER_TOPIC_ID and RESEND_NEWSLETTER_SEGMENT_ID must be set."
    );
    console.error("Run scripts/newsletter/setup-resend.ts first to obtain them.");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(CSV_PATH, "utf8");
  } catch {
    console.error(`Error: could not read ${CSV_PATH}`);
    console.error(
      "Create it from pilot-contacts.example.csv (header: email,firstName)."
    );
    process.exit(1);
  }

  const rows = parsePilotCsv(raw);
  if (rows.length === 0) {
    console.error("No contact rows found in the CSV.");
    process.exit(1);
  }

  const results: { email: string; status: string }[] = [];
  for (const row of rows) {
    if (!row.email) {
      results.push({ email: "(blank)", status: "skipped (no email)" });
      continue;
    }
    try {
      await createContact({
        email: row.email,
        firstName: row.firstName || undefined,
        segmentIds: [segmentId],
        topics: [{ id: topicId, subscribed: true }],
      });
      results.push({ email: row.email, status: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ email: row.email, status: `error: ${message}` });
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const emailWidth = Math.max(5, ...results.map((r) => r.email.length));

  console.log("");
  console.log(`${"EMAIL".padEnd(emailWidth)}  STATUS`);
  console.log(`${"-".repeat(emailWidth)}  ------`);
  for (const r of results) {
    console.log(`${r.email.padEnd(emailWidth)}  ${r.status}`);
  }
  console.log("");
  console.log(`Done: ${okCount}/${results.length} contacts seeded successfully.`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
