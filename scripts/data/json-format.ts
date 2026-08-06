/**
 * Safe read/write for the event JSON data files.
 *
 * `JSON.stringify(value, null, 2)` is *almost* the format these files are in.
 * `events-custom.json` matches it exactly once CRLF endings are restored.
 * `shesharp_events_v3.json` does not: it was produced by a different scraper
 * and carries a handful of empty arrays spread over two lines among 258
 * written inline, so no single rule reproduces it. Reformatting it would turn
 * a three-line correction into a thousand-line diff.
 *
 * So `writeEventJson` re-serialises the parsed value and refuses to write
 * unless that serialisation reproduces the file it read, byte for byte, apart
 * from the edits made. A file this cannot round-trip must be edited as text
 * instead — see `fix-v3-registration-and-status.ts` for that pattern.
 */
import { readFileSync, writeFileSync } from "node:fs";

const originals = new Map<string, string>();

function render(data: unknown): string {
  return (JSON.stringify(data, null, 2) + "\n").replace(/\n/g, "\r\n");
}

export function readEventJson<T>(path: string): T {
  const raw = readFileSync(path, "utf8");
  originals.set(path, raw);
  return JSON.parse(raw) as T;
}

/**
 * Writes `data` back to `path`, but only if this serialiser is known to
 * reproduce the file's own formatting. Throws otherwise rather than silently
 * reformatting thousands of untouched lines.
 */
export function writeEventJson(path: string, data: unknown): void {
  assertRoundTrip(path);
  writeFileSync(path, render(data), "utf8");
}

/** Throws unless re-serialising the file on disk reproduces it exactly. */
export function assertRoundTrip(path: string): void {
  const raw = originals.get(path) ?? readFileSync(path, "utf8");
  if (render(JSON.parse(raw)) !== raw) {
    throw new Error(
      `${path} does not round-trip through JSON.stringify — edit it as text ` +
        `rather than reformatting the whole file`
    );
  }
}
