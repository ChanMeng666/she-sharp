/**
 * Render a fetch-channel.ts payload as a COMPLETE, compact, human-readable
 * digest — every new top-level message and every new reply, in order, with user
 * IDs resolved and files/links flagged.
 *
 * Why this exists: reading the raw fetch JSON with an ad-hoc `node -e … | head`
 * silently drops the tail — late threads, the post-event photo-album link, the
 * one message that actually mattered (the 2026-06-22 Peyvand miss). This script
 * is the canonical reader: it never truncates message coverage, so you cannot
 * miss a message by capping output. Pipe the fetch payload through it instead of
 * hand-dumping the JSON.
 *
 * Usage:
 *   npx tsx .../fetch-channel.ts <ch> --state > /tmp/ch.json
 *   npx tsx .../render-delta.ts /tmp/ch.json
 *
 * It prints, in order:
 *   - _meta line (mode, newCount, watermark) and the PRIOR DIGEST if present
 *   - pinned messages (always canonical) and bookmarks
 *   - every new message + new replies, each with [files] and {links} flagged
 *
 * Per-message text is bounded (long posts are clipped with an ellipsis) but the
 * SET of messages is never trimmed — completeness of coverage is the point.
 */

import { readPayload } from "./state-lib";

const path = process.argv[2];
if (!path) {
  console.error("Usage: render-delta.ts <fetch-payload.json>");
  process.exit(2);
}

const d = readPayload(path);
const users: Record<string, any> = d.users ?? {};
const TEXT_CLIP = 600;

function nameOf(id: string): string {
  const u = users[id];
  return u?.display_name || u?.real_name || id;
}

/** Resolve <@U…> mentions, collapse whitespace, clip overly long bodies. */
function clean(text: string): string {
  let t = (text ?? "").replace(/<@(U[A-Z0-9]+)>/g, (_m, id) => "@" + nameOf(id));
  t = t.replace(/\s+/g, " ").trim();
  return t.length > TEXT_CLIP ? t.slice(0, TEXT_CLIP) + " …[clipped]" : t;
}

function fileTags(m: any): string {
  const fs = (m.files ?? []).map((f: any) => `[${f.filetype || "file"}:${f.name || f.title || f.id}]`);
  return fs.length ? "  " + fs.join(" ") : "";
}

function linkTags(m: any): string {
  const ls = m.links ?? [];
  return ls.length ? "  {" + ls.join(" ") + "}" : "";
}

const out: string[] = [];
function emit(m: any, indent: string) {
  const who = nameOf(m.user_id ?? m.user ?? "?");
  const body = clean(m.text);
  const tags = fileTags(m) + linkTags(m);
  // Always print a line even for an attachment-only message so files/links show.
  out.push(`${indent}${who}: ${body}${tags}`);
}

const meta = d._meta ?? {};
out.push(
  `# ${d.channel?.name ?? "channel"} — mode=${meta.mode ?? "?"} newCount=${meta.newCount ?? "?"} ` +
    `watermark=${meta.newWatermarkTs ?? "?"}`,
);
if (meta.priorDigest) out.push(`\n## PRIOR DIGEST (what was understood last sync)\n${meta.priorDigest}`);

const pinned = d.pinned ?? [];
if (pinned.length) {
  out.push(`\n## PINNED (${pinned.length}) — canonical`);
  for (const m of pinned) emit(m, "• ");
}

const bookmarks = d.bookmarks ?? [];
if (bookmarks.length) {
  out.push(`\n## BOOKMARKS (${bookmarks.length})`);
  for (const b of bookmarks) out.push(`• ${b.title ?? ""} ${b.link ?? ""}`.trim());
}

const messages = d.messages ?? [];
out.push(`\n## NEW MESSAGES (${messages.length})`);
if (!messages.length) out.push("(none — no-op)");
for (const m of messages) {
  out.push(`--- ${m.iso ?? m.ts}`);
  emit(m, "");
  for (const r of m.thread ?? []) {
    if (r.ts === m.ts) continue;
    emit(r, "   ↳ ");
  }
}

process.stdout.write(out.join("\n") + "\n");
