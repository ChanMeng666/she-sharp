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

/*
 * RUN SHEETS, SURFACED BEFORE THE MESSAGES.
 *
 * The run sheet is where the event is actually true — the agreed clock, the
 * speaker bios, the room allocation, the checklist of what is still owed. Slack
 * only carries the conversation about it. On 5 Aug 2026 a bio and a corrected
 * job title sat in a linked sheet for days while the event's own digest read
 * "STILL OWED"; nobody was withholding it, the sheet was simply never opened.
 *
 * A link buried in message #41 of a delta is a link nobody follows, so every
 * Google Sheet or Doc in the channel — messages, pins and bookmarks alike — is
 * collected to the top with the command that reads it. Ranked by how many times
 * the channel refers to it, because the run sheet is the one people re-paste.
 */
const sheetLinks = (() => {
  const seen = new Map<string, { url: string; hits: number; label: string }>();
  const scan = (text: string, label: string) => {
    for (const m of text.matchAll(
      /https:\/\/docs\.google\.com\/(spreadsheets|document)\/d\/[^\s|<>"]+/g,
    )) {
      const url = m[0].replace(/[),.]+$/, "");
      const id = url.match(/\/d\/(?:e\/)?([a-zA-Z0-9_-]{20,})/)?.[1] ?? url;
      const prev = seen.get(id);
      if (prev) prev.hits++;
      else seen.set(id, { url, hits: 1, label });
    }
  };
  for (const b of d.bookmarks ?? []) scan(`${b.title ?? ""} ${b.link ?? ""}`, "bookmark");
  for (const m of d.pinned ?? []) scan(m.text ?? "", "pinned");
  for (const m of d.messages ?? []) {
    scan(m.text ?? "", "message");
    for (const r of m.thread ?? []) scan(r.text ?? "", "thread reply");
  }
  return [...seen.values()].sort((a, b) => b.hits - a.hits);
})();

if (sheetLinks.length) {
  out.push(`\n## RUN SHEETS & DOCS (${sheetLinks.length}) — READ THESE, THEY OUTRANK THE CHAT`);
  for (const s of sheetLinks) {
    const kind = /\/spreadsheets\//.test(s.url) ? "sheet" : "doc";
    out.push(`• ${s.url}`);
    out.push(`    first seen in a ${s.label}, referenced ${s.hits}×`);
    if (kind === "sheet") {
      out.push(
        `    npx tsx .claude/skills/sync-event-from-slack/scripts/fetch-sheet.ts '${s.url}'`,
      );
    } else {
      out.push(`    (Google Doc — open it, there is no CSV export for these)`);
    }
  }
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
