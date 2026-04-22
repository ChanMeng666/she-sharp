/**
 * Probe what She Sharp Event Collector can and cannot do.
 *
 * Tests:
 * - auth.test (identity + scope list)
 * - users.info (needs users:read)
 * - conversations.list (public+private)
 * - conversations.history (joined channel)
 * - conversations.replies (threads)
 * - files.info (file metadata)
 * - url_private download with Bearer token (files:read)
 * - pins.list (pins:read)
 * - bookmarks.list (bookmarks:read)
 * - reactions.get (reactions:read)
 * - emoji.list (emoji:read)
 */

import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const token = process.env.SLACK_BOT_TOKEN!;
if (!token) throw new Error("SLACK_BOT_TOKEN not set");
const slack = new WebClient(token);
const CHANNEL_ID = "C0AS0KW8KQX"; // event-aut-linkedin-15-may-2026
const SAMPLE_USER_ID = "U09LYU8SUHX";
const SAMPLE_FILE_URL = "https://files.slack.com/files-pri/T06Q96RGA-F0AUCJSPCQM/img_1509.jpg";

type Probe = { name: string; ok: boolean; detail: string };
const results: Probe[] = [];

async function probe(name: string, fn: () => Promise<string>): Promise<void> {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (e: any) {
    const err = e?.data?.error ?? e?.message ?? String(e);
    results.push({ name, ok: false, detail: err });
  }
}

(async () => {
  await probe("auth.test", async () => {
    const r = await slack.auth.test();
    return `user=${r.user} bot_id=${r.bot_id} scopes=${(r.response_metadata as any)?.scopes?.join(",")}`;
  });

  await probe("users.info (users:read)", async () => {
    const r = await slack.users.info({ user: SAMPLE_USER_ID });
    return `name=${r.user?.real_name ?? r.user?.name} display=${r.user?.profile?.display_name}`;
  });

  await probe("users.list (users:read)", async () => {
    const r = await slack.users.list({ limit: 5 });
    return `got ${r.members?.length ?? 0} members (preview)`;
  });

  await probe("conversations.list public+private", async () => {
    const r = await slack.conversations.list({ types: "public_channel,private_channel", limit: 5 });
    return `got ${r.channels?.length ?? 0} channels (preview)`;
  });

  await probe("conversations.members", async () => {
    const r = await slack.conversations.members({ channel: CHANNEL_ID, limit: 5 });
    return `got ${r.members?.length ?? 0} members (preview)`;
  });

  await probe("conversations.history", async () => {
    const r = await slack.conversations.history({ channel: CHANNEL_ID, limit: 1 });
    return `got ${r.messages?.length ?? 0} messages (preview)`;
  });

  await probe("files.info", async () => {
    const r = await slack.files.info({ file: "F0AUCJSPCQM" });
    return `${r.file?.name} ${r.file?.mimetype} ${r.file?.size}B`;
  });

  await probe("file download (Bearer auth)", async () => {
    const res = await fetch(SAMPLE_FILE_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const out = join(tmpdir(), "slack-probe-download.jpg");
    writeFileSync(out, buf);
    return `${buf.length}B saved to ${out}  mime=${res.headers.get("content-type")}`;
  });

  await probe("pins.list (pins:read)", async () => {
    const r = await slack.pins.list({ channel: CHANNEL_ID });
    return `got ${r.items?.length ?? 0} pinned items`;
  });

  await probe("bookmarks.list (bookmarks:read)", async () => {
    const r = await (slack as any).bookmarks.list({ channel_id: CHANNEL_ID });
    return `got ${r.bookmarks?.length ?? 0} bookmarks`;
  });

  await probe("reactions.get (reactions:read)", async () => {
    // Grab first message ts, then check reactions
    const h = await slack.conversations.history({ channel: CHANNEL_ID, limit: 5 });
    const target = (h.messages ?? []).find((m) => (m as any).reactions?.length);
    if (!target) return "no reacted message found in first 5";
    const r = await slack.reactions.get({ channel: CHANNEL_ID, timestamp: target.ts! });
    return `ok (type=${r.type})`;
  });

  await probe("emoji.list (emoji:read)", async () => {
    const r = await slack.emoji.list();
    const keys = Object.keys(r.emoji ?? {});
    return `got ${keys.length} custom emoji (preview)`;
  });

  await probe("canvases.lookup / lists (canvases:read)", async () => {
    const r = await (slack as any).apiCall("canvases.sections.lookup", { canvas_id: "X" });
    return JSON.stringify(r);
  });

  // Report
  console.log("╭─────────────────────────────────────────────────────────────────────────╮");
  console.log("│ She Sharp Event Collector — scope probe                                │");
  console.log("╰─────────────────────────────────────────────────────────────────────────╯");
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌";
    console.log(`${mark} ${r.name.padEnd(40)} ${r.detail}`);
  }
})().catch((e) => {
  console.error("FATAL:", e?.data ?? e);
  process.exit(1);
});
