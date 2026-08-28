/**
 * Reads the newsletter subscriber table, for verifying the opt-in flow by hand.
 *
 * Exists because the flow it checks is deliberately opaque from the outside:
 * `POST /api/newsletter/subscribe` returns `{ok:true}` whether it created a
 * pending row, found an existing subscriber, or refused a complainer, so that
 * the endpoint cannot be used to test whether an address is on the list. That
 * is right for the public, and useless for whoever has to confirm the thing
 * works — hence this, which reads the row directly.
 *
 * Addresses are masked (`j****@gmail.com`) exactly as the other email scripts
 * mask them, so the output is safe to paste into a PR or Slack. `--token` opts
 * into printing a confirmation token in full, for driving the confirm page in a
 * local test; it refuses to do that against a non-localhost BASE_URL, because a
 * token printed from production is a live credential for someone else's
 * subscription.
 *
 * Usage:
 *   npx tsx scripts/email/inspect-subscribers.ts [--email <address>] [--token] [--limit 20]
 */

import "dotenv/config";
import { desc, eq } from "drizzle-orm";

import { client, db } from "../../lib/db/drizzle";
import { newsletterSubscribers } from "../../lib/db/schema";
import { hashEmail } from "../../lib/email/hash";

/** Masks an address for terminal and paste-safe output. */
function mask(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  return `${local.slice(0, 1)}****@${domain}`;
}

/** Reads a flag's value from argv. */
function argValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

/** True when this run is pointed at a local development server. */
function isLocalBaseUrl(): boolean {
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  return base.includes("localhost") || base.includes("127.0.0.1");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const email = argValue(argv, "--email");
  const showToken = argv.includes("--token");
  const limit = Number(argValue(argv, "--limit") ?? 20);

  if (showToken && !isLocalBaseUrl()) {
    console.error(
      "Refusing --token: BASE_URL is not localhost.\n" +
        "  A confirmation token is a live credential for somebody's subscription.\n" +
        "  Printing one from a production database hands it to whoever reads the terminal."
    );
    process.exit(1);
  }

  const rows = email
    ? await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.emailHash, hashEmail(email)))
        .limit(1)
    : await db
        .select()
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(limit);

  if (rows.length === 0) {
    console.log(email ? "No row for that address." : "No subscribers yet.");
    await client.end();
    return;
  }

  for (const row of rows) {
    console.log("");
    console.log(`  ${mask(row.email)}  [${row.status}]`);
    console.log(`    source        ${row.source}`);
    console.log(`    consent       ${row.consentSource}`);
    console.log(`    consentDate   ${row.consentDate?.toISOString() ?? "—"}`);
    console.log(`    confirmSentAt ${row.confirmSentAt?.toISOString() ?? "—"}`);
    console.log(`    confirmExpiry ${row.confirmExpiresAt?.toISOString() ?? "—"}`);
    console.log(`    confirmedAt   ${row.confirmedAt?.toISOString() ?? "— (not yet confirmed)"}`);
    console.log(`    unsubscribed  ${row.unsubscribedAt?.toISOString() ?? "—"} ${row.unsubscribeReason ?? ""}`);
    console.log(`    hasToken      ${row.confirmToken ? "yes" : "no"}`);
    if (showToken && row.confirmToken) {
      console.log(`    token         ${row.confirmToken}`);
    }
  }

  console.log("");
  console.log(`${rows.length} row(s).`);
  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
