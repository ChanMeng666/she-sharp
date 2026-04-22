/**
 * Extract plain text from a .docx file.
 *
 * Tries mammoth first (fidelity + paragraph preservation). Falls back to a
 * minimal extractor (Node's built-in zlib + a tiny XML scraper) so the
 * skill still works in a repo where mammoth hasn't been installed yet.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-event-from-slack/scripts/extract-docx.ts <path>
 *
 * Prints text to stdout.
 */

import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

async function tryMammoth(path: string): Promise<string | null> {
  try {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ path });
    return r.value;
  } catch {
    return null;
  }
}

/**
 * Minimal fallback: .docx is a ZIP archive; its word/document.xml contains
 * all body text wrapped in <w:t>…</w:t>. We locate that entry, inflate it,
 * and strip tags. Sufficient for bio / overview extraction; not robust
 * against embedded tables, footnotes, or tracked changes.
 */
function fallbackExtract(path: string): string {
  const buf = readFileSync(path);

  // ZIP local file header signature: 0x04034b50
  let i = 0;
  while (i < buf.length - 30) {
    const sig = buf.readUInt32LE(i);
    if (sig !== 0x04034b50) break;
    const compressionMethod = buf.readUInt16LE(i + 8);
    const compressedSize = buf.readUInt32LE(i + 18);
    const uncompressedSize = buf.readUInt32LE(i + 22);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const nameStart = i + 30;
    const name = buf.slice(nameStart, nameStart + nameLen).toString("utf8");
    const dataStart = nameStart + nameLen + extraLen;
    const dataEnd = dataStart + compressedSize;
    if (name === "word/document.xml") {
      const chunk = buf.slice(dataStart, dataEnd);
      const xml =
        compressionMethod === 0 ? chunk.toString("utf8") : inflateRawSync(chunk).toString("utf8");
      return xmlToText(xml);
    }
    i = dataEnd;
    void uncompressedSize;
  }
  throw new Error("word/document.xml not found in archive");
}

function xmlToText(xml: string): string {
  // Paragraph boundaries: </w:p> becomes newline
  // Tab: <w:tab/> becomes tab
  // All other tags: stripped. Entities decoded for common ones.
  const withParas = xml
    .replace(/<w:tab\b[^>]*\/?>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return withParas
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

(async () => {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: extract-docx.ts <path>");
    process.exit(2);
  }
  const viaMammoth = await tryMammoth(path);
  if (viaMammoth !== null) {
    process.stdout.write(viaMammoth);
    return;
  }
  const viaFallback = fallbackExtract(path);
  process.stdout.write(viaFallback);
})().catch((e) => {
  console.error("FATAL:", e?.message ?? e);
  process.exit(1);
});
