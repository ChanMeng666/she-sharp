/**
 * Download a Slack file_private URL with Bearer auth to a target path.
 *
 * Slack's url_private endpoints require the bot token in the Authorization
 * header — a plain fetch from the browser/anonymous client will return HTML
 * (a login redirect) instead of the binary.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-event-from-slack/scripts/download-file.ts \
 *     <url_private> <target_path>
 *
 * Writes the file, creating any missing parent directories, and prints a
 * one-line JSON summary to stdout:
 *   { "path": "...", "bytes": 109610, "mimetype": "image/jpeg" }
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error("SLACK_BOT_TOKEN is not set in .env");
  process.exit(1);
}
const [, , url, target] = process.argv;
if (!url || !target) {
  console.error("Usage: download-file.ts <url_private> <target_path>");
  process.exit(2);
}

(async () => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const mimetype = res.headers.get("content-type") ?? "application/octet-stream";
  if (mimetype.startsWith("text/html")) {
    // Slack returns a login page when auth fails — guard against silent success.
    console.error("Slack returned HTML; token likely lacks files:read or the file is restricted");
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buf);
  process.stdout.write(JSON.stringify({ path: target, bytes: buf.length, mimetype }));
})().catch((e) => {
  console.error("FATAL:", e?.message ?? e);
  process.exit(1);
});
