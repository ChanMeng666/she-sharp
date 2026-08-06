/**
 * Reads a Google Sheets run sheet linked from Slack, tab by tab.
 *
 * WHY THIS IS PART OF THE SKILL. The run sheet is where the event is actually
 * true. Slack carries the conversation about the event; the sheet carries the
 * agreed clock, the speaker bios, the room allocation and the checklist of what
 * is still owed. On 5 Aug 2026 the events lead asked, by DM, to "update Carolina
 * Lobos' profile" and attached the run sheet — the bio and a corrected job title
 * were sitting in its Speakers tab, and had been for days. The digest of that
 * event had said "STILL OWED BY LES MILLS: Carolina Lobos's bio and photograph"
 * the whole time. Nobody was withholding anything; the sheet was simply never
 * opened, because nothing in this skill could open one.
 *
 * NO CREDENTIALS, ON PURPOSE. She Sharp's run sheets are shared link-viewable,
 * and Google serves those over the same CSV export endpoint a browser uses.
 * That means this needs no OAuth, no service account and no token to rotate —
 * and it fails loudly rather than silently when a sheet is genuinely private,
 * which is the only case where a human has to do something.
 *
 *   npx tsx .../fetch-sheet.ts '<url>'                # every tab, rendered
 *   npx tsx .../fetch-sheet.ts '<url>' --tab Speakers # one tab by name
 *   npx tsx .../fetch-sheet.ts '<url>' --json         # machine-readable
 *   npx tsx .../fetch-sheet.ts '<url>' --max-rows 40  # default 200
 *
 * An `.xlsx` uploaded to Drive (`rtpof=true` in the URL) exports the same way,
 * so the two are not distinguished here.
 */

import { pathToFileURL } from "node:url";

/** Spreadsheet id and, when the link points at one, the tab's gid. */
export function parseSheetUrl(u: string): { id: string; gid?: string } | null {
  const id = u.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9_-]{20,})/)?.[1]
    // A Drive file link to an uploaded workbook uses the same id space.
    ?? u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/)?.[1]
    ?? u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/)?.[1];
  if (!id) return null;
  // `#gid=` beats `?gid=`: a pasted link often carries both and the fragment is
  // the one the browser was actually showing.
  const gid = u.match(/#gid=(\d+)/)?.[1] ?? u.match(/[?&]gid=(\d+)/)?.[1];
  return gid ? { id, gid } : { id };
}

/** Minimal RFC-4180 CSV: quoted fields, embedded commas, doubled quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); cur = ""; rows.push(row); row = []; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function get(u: string): Promise<{ ok: boolean; status: number; body: string }> {
  const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

/**
 * Every tab's name and gid.
 *
 * `htmlview` renders the whole workbook and names each tab, which is the only
 * way to enumerate them without the Sheets API and a credential. A private
 * sheet returns Google's sign-in page instead — detected below rather than
 * parsed into an empty tab list, because "no tabs" and "you cannot see this"
 * must not look the same.
 */
async function listTabs(id: string): Promise<{ gid: string; name: string }[]> {
  const r = await get(`https://docs.google.com/spreadsheets/d/${id}/htmlview`);
  if (!r.ok) return [];

  /*
   * The tab names live in the page's own switcher script, as a run of
   * `items.push({name: "Speakers", pageUrl: "…gid=1792873316", gid: "…"})`.
   * There is no markup to read them from — the buttons are built at runtime —
   * so this parses the literal. Names carry JS escapes (`\x26` for `&`), and a
   * tab really can be called "Website & Humanitix event page".
   */
  const tabs = new Map<string, string>();
  const unescape = (s: string) =>
    s
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\(.)/g, "$1");

  for (const m of r.body.matchAll(
    /items\.push\(\{\s*name:\s*"((?:\\.|[^"\\])*)"[\s\S]{0,400}?gid:\s*"(\d+)"/g,
  )) {
    tabs.set(m[2], unescape(m[1]).trim() || `gid ${m[2]}`);
  }

  // Fallback: a workbook rendered without the switcher still exposes its gids.
  if (!tabs.size) {
    for (const m of r.body.matchAll(/[?&#]gid=(\d+)/g)) {
      if (!tabs.has(m[1])) tabs.set(m[1], `gid ${m[1]}`);
    }
  }
  return [...tabs].map(([gid, name]) => ({ gid, name }));
}

function looksLikeSignIn(body: string): boolean {
  return /accounts\.google\.com\/(v3\/)?signin|Request access|You need access/i.test(body);
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const flag = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const wantTab = flag("--tab");
  const maxRows = Number(flag("--max-rows") ?? 200);
  const url = argv.find(
    (a) => !a.startsWith("--") && /docs\.google\.com|drive\.google\.com/.test(a),
  );

  if (!url) {
    console.error(
      "Usage: fetch-sheet.ts '<google sheets url>' [--tab <name>] [--json] [--max-rows <n>]",
    );
    process.exit(2);
  }

  const parsed = parseSheetUrl(url);
  if (!parsed) {
    console.error(`Not a Google Sheets/Drive URL: ${url}`);
    process.exit(2);
  }

  let tabs = parsed.gid
    ? [{ gid: parsed.gid, name: `gid ${parsed.gid}` }]
    : await listTabs(parsed.id);

  // No gid in the link and enumeration failed — the default tab still exports.
  if (!tabs.length) tabs = [{ gid: "0", name: "first tab" }];

  const out: { name: string; gid: string; rows: string[][] }[] = [];

  for (const t of tabs) {
    const r = await get(
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${t.gid}`,
    );
    if (!r.ok || looksLikeSignIn(r.body)) {
      console.error(
        `\nCannot read this sheet without a login (HTTP ${r.status}).\n` +
          `  ${url}\n` +
          `  Ask whoever shared it to set link sharing to "Anyone with the link — Viewer",\n` +
          `  or to export the tab and send the file. Do NOT guess at its contents.\n`,
      );
      process.exit(1);
    }
    const rows = parseCsv(r.body).filter((row) => row.some((c) => c && c.trim()));
    out.push({ name: t.name, gid: t.gid, rows });
  }

  const selected = wantTab
    ? out.filter((t) => t.name.toLowerCase().includes(wantTab.toLowerCase()))
    : out;

  if (wantTab && !selected.length) {
    console.error(`No tab matching "${wantTab}". Tabs: ${out.map((t) => t.name).join(", ")}`);
    process.exit(1);
  }

  if (asJson) {
    process.stdout.write(JSON.stringify({ id: parsed.id, tabs: selected }, null, 2) + "\n");
    return;
  }

  console.log(`\nGoogle Sheet ${parsed.id} — ${out.length} tab(s): ${out.map((t) => t.name).join(", ")}\n`);
  for (const t of selected) {
    console.log(`### ${t.name}  (gid ${t.gid}, ${t.rows.length} non-empty rows)`);
    for (const row of t.rows.slice(0, maxRows)) {
      // Cell-per-line rather than a fixed-width table: run-sheet bios run to
      // several hundred characters and a table would either wrap them into
      // noise or clip the one field somebody actually needs.
      const cells = row.map((c) => c.trim()).filter(Boolean);
      if (!cells.length) continue;
      console.log(`  · ${cells.join("  |  ")}`);
    }
    if (t.rows.length > maxRows) console.log(`  … ${t.rows.length - maxRows} more rows`);
    console.log();
  }
}

/*
 * CLI only when run directly. `state-lib.test.ts` imports `parseSheetUrl` and
 * `parseCsv` from here, and a module that parses argv at import time would
 * abort the test run with a usage message — which it did, once.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
