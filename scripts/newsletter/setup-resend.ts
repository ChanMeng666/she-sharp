/**
 * One-time setup for the She Sharp monthly newsletter on Resend.
 *
 * Creates (idempotently) the "Monthly Newsletter" topic and "Newsletter"
 * segment, then prints their ids and the env vars to add. If a same-named topic
 * or segment already exists it is reused rather than re-created.
 *
 * Usage:
 *   RESEND_API_KEY=... npx tsx scripts/newsletter/setup-resend.ts
 */

import {
  createTopic,
  createSegment,
  listTopics,
  listSegments,
} from "../../lib/newsletter/resend-api";

const TOPIC_NAME = "Monthly Newsletter";
const TOPIC_DESCRIPTION = "She Sharp monthly newsletter for women in STEM.";
const SEGMENT_NAME = "Newsletter";

/**
 * Finds a topic by exact name, creating it if absent (idempotent).
 *
 * @returns The topic id and whether it was newly created.
 */
async function ensureTopic(): Promise<{ id: string; created: boolean }> {
  const existing = (await listTopics()).find((t) => t.name === TOPIC_NAME);
  if (existing) return { id: existing.id, created: false };

  const { id } = await createTopic({
    name: TOPIC_NAME,
    description: TOPIC_DESCRIPTION,
    defaultSubscription: "opt_in",
  });
  return { id, created: true };
}

/**
 * Finds a segment by exact name, creating it if absent (idempotent).
 *
 * @returns The segment id and whether it was newly created.
 */
async function ensureSegment(): Promise<{ id: string; created: boolean }> {
  const existing = (await listSegments()).find((s) => s.name === SEGMENT_NAME);
  if (existing) return { id: existing.id, created: false };

  const { id } = await createSegment({ name: SEGMENT_NAME });
  return { id, created: true };
}

async function main(): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Error: RESEND_API_KEY is not set. Run with:");
    console.error("  RESEND_API_KEY=... npx tsx scripts/newsletter/setup-resend.ts");
    process.exit(1);
  }

  const topic = await ensureTopic();
  const segment = await ensureSegment();

  console.log("");
  console.log("Resend newsletter setup complete.");
  console.log("");
  console.log(`Topic   "${TOPIC_NAME}"  ${topic.created ? "created" : "reused"}: ${topic.id}`);
  console.log(`Segment "${SEGMENT_NAME}" ${segment.created ? "created" : "reused"}: ${segment.id}`);
  console.log("");
  console.log("Add these to your local .env and to Vercel:");
  console.log(`  RESEND_NEWSLETTER_TOPIC_ID=${topic.id}`);
  console.log(`  RESEND_NEWSLETTER_SEGMENT_ID=${segment.id}`);
  console.log("");
  console.log("To set on Vercel, pass the value as a flag. Never pipe it in on stdin —");
  console.log("`printf ... |`, `< file` and `echo` can all silently store an empty");
  console.log("string, and `echo` additionally appends a newline that becomes part of");
  console.log("the value. `--no-sensitive` is what makes the result readable back:");
  console.log(
    `  vercel env add RESEND_NEWSLETTER_TOPIC_ID production --value ${topic.id} --no-sensitive --force --yes`
  );
  console.log(
    `  vercel env add RESEND_NEWSLETTER_SEGMENT_ID production --value ${segment.id} --no-sensitive --force --yes`
  );
  console.log("");
  console.log("Then verify byte-for-byte:");
  console.log("  vercel env pull <tmpfile> --environment production --yes");
  console.log("");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
