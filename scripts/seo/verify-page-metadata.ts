/**
 * Crawls every URL in the deployed sitemap and asserts the on-page SEO
 * invariants that Search Console will otherwise report back weeks later.
 *
 * This exists because the 2026-08-09 GSC review found three defects that no
 * existing check could see: seven event pages shipping duplicate <title> tags,
 * two pages with no <h1> at all, and 25 sitemap entries stamped with the build
 * timestamp as their `lastmod`. All three are invisible in the source — they
 * only appear once the pages are rendered together and compared.
 *
 * Network-dependent, so it is deliberately NOT in CI. Run it after a deploy, or
 * against a local `next start` before opening a PR that touches metadata.
 *
 * Usage:
 *   npx tsx scripts/seo/verify-page-metadata.ts
 *   npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100
 *   npx tsx scripts/seo/verify-page-metadata.ts --json
 *
 * Flags:
 *   --base <url>        Origin to crawl. Default: SITE_URL (production).
 *   --limit <n>         Only crawl the first n sitemap URLs (smoke test).
 *   --concurrency <n>   Parallel requests. Default 6.
 *   --json              Machine-readable report on stdout instead of prose.
 *   --verbose           List every warning per URL, not just a per-kind tally.
 *   --strict            Treat warnings as failures too.
 *
 * Exit codes: 0 clean · 1 one or more errors (or warnings under --strict)
 *   · 2 usage error or the sitemap could not be read.
 */

import { SITE_URL } from "@/lib/seo/site";

const USAGE = `Usage: npx tsx scripts/seo/verify-page-metadata.ts [--base <url>] [--limit <n>] [--concurrency <n>] [--json] [--strict]`;

/** Googlebot UA so we measure what the crawler measures, not what a browser gets. */
const CRAWLER_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const REQUEST_TIMEOUT_MS = 45_000;

/** Google truncates the SERP title around here; the suffix is part of the budget. */
const MAX_TITLE_CHARS = 60;
const MIN_DESCRIPTION_CHARS = 70;
const MAX_DESCRIPTION_CHARS = 160;
/** Below this a page reads as thin to a crawler. Nav + footer alone score ~120. */
const MIN_BODY_WORDS = 200;
/**
 * More sitemap entries than this sharing one `lastmod` date means the date is
 * almost certainly a build timestamp rather than a content date — the exact
 * regression `app/sitemap.ts` was fixed for on 2026-08-09.
 */
const MAX_URLS_PER_LASTMOD = 5;

interface Args {
  base: string;
  limit: number | null;
  concurrency: number;
  json: boolean;
  verbose: boolean;
  strict: boolean;
}

interface PageReport {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage: string;
  h1Count: number;
  words: number;
  errors: string[];
  warnings: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    base: SITE_URL,
    limit: null,
    concurrency: 6,
    json: false,
    verbose: false,
    strict: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--base":
        args.base = (argv[++i] ?? "").replace(/\/+$/, "");
        if (!args.base) throw new Error(`--base needs a URL.\n${USAGE}`);
        break;
      case "--limit":
        args.limit = Number(argv[++i]);
        if (!Number.isInteger(args.limit) || args.limit < 1) {
          throw new Error(`--limit needs a positive integer.\n${USAGE}`);
        }
        break;
      case "--concurrency":
        args.concurrency = Number(argv[++i]);
        if (!Number.isInteger(args.concurrency) || args.concurrency < 1) {
          throw new Error(`--concurrency needs a positive integer.\n${USAGE}`);
        }
        break;
      case "--json":
        args.json = true;
        break;
      case "--verbose":
        args.verbose = true;
        break;
      case "--strict":
        args.strict = true;
        break;
      default:
        throw new Error(`Unknown flag: ${arg}\n${USAGE}`);
    }
  }

  return args;
}

async function get(url: string): Promise<{ status: number; body: string }> {
  const response = await fetch(url, {
    headers: { "user-agent": CRAWLER_UA },
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

/** Decodes the handful of HTML entities that show up in titles and descriptions. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;|&#38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/**
 * Normalises a title or description for duplicate detection.
 *
 * Curly and straight apostrophes are folded together on purpose: three event
 * pages were titled "International Women's Day", two with `&#x27;` and one with
 * U+2019, which are different bytes and an identical result on screen.
 */
function normalise(value: string): string {
  return decodeEntities(value)
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function firstMatch(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? decodeEntities(match[1]).trim() : "";
}

/** Strips scripts, styles and tags to approximate what a crawler reads as copy. */
function bodyWordCount(html: string): number {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return body ? body.split(" ").length : 0;
}

/** Two URLs that differ only by a trailing slash are the same URL. */
function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
}

/**
 * Fetches one page and checks it.
 *
 * `url` is what we request; `canonicalUrl` is what the canonical link is
 * expected to say. They differ on a `--base http://localhost:3100` run, because
 * canonicals are always absolute against the production origin — comparing
 * against the request URL there would flag all 121 pages.
 */
async function inspect(url: string, canonicalUrl: string): Promise<PageReport> {
  const report: PageReport = {
    url,
    status: 0,
    title: "",
    description: "",
    canonical: "",
    robots: "",
    ogImage: "",
    h1Count: 0,
    words: 0,
    errors: [],
    warnings: [],
  };

  let html: string;
  try {
    const response = await get(url);
    report.status = response.status;
    html = response.body;
  } catch (error) {
    report.errors.push(`request failed: ${(error as Error).message}`);
    return report;
  }

  if (report.status !== 200) {
    report.errors.push(`expected 200, got ${report.status}`);
    return report;
  }

  report.title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  report.description = firstMatch(
    html,
    /<meta name="description" content="([^"]*)"/i,
  );
  report.canonical = firstMatch(html, /<link rel="canonical" href="([^"]*)"/i);
  report.robots = firstMatch(html, /<meta name="robots" content="([^"]*)"/i);
  report.ogImage = firstMatch(html, /<meta property="og:image" content="([^"]*)"/i);
  report.h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  report.words = bodyWordCount(html);

  if (!report.title) report.errors.push("no <title>");
  if (!report.description) report.errors.push("no meta description");

  if (report.h1Count !== 1) {
    report.errors.push(`expected exactly one <h1>, found ${report.h1Count}`);
  }

  if (!report.canonical) {
    report.errors.push("no canonical link");
  } else if (!sameUrl(report.canonical, canonicalUrl)) {
    report.errors.push(
      `canonical points elsewhere: ${report.canonical} (expected ${canonicalUrl})`,
    );
  }

  // A sitemap says "index this"; a noindex says the opposite. GSC reports the
  // pair as "Submitted URL marked 'noindex'", so the two must never coexist.
  if (/noindex/i.test(report.robots)) {
    report.errors.push(`sitemapped URL carries robots "${report.robots}"`);
  }

  if (report.title.length > MAX_TITLE_CHARS) {
    report.warnings.push(
      `title is ${report.title.length} chars (>${MAX_TITLE_CHARS}, Google will truncate)`,
    );
  }
  if (
    report.description &&
    (report.description.length < MIN_DESCRIPTION_CHARS ||
      report.description.length > MAX_DESCRIPTION_CHARS)
  ) {
    report.warnings.push(
      `description is ${report.description.length} chars (want ${MIN_DESCRIPTION_CHARS}-${MAX_DESCRIPTION_CHARS})`,
    );
  }
  if (report.words < MIN_BODY_WORDS) {
    report.warnings.push(`only ~${report.words} words of body copy`);
  }
  if (!report.ogImage) {
    report.warnings.push("no og:image");
  }

  return report;
}

/** Runs `worker` over `items` with at most `limit` in flight at once. */
async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Flags duplicate values across pages, keyed by the normalised string.
 * Returns one message per offending page so the report reads per-URL.
 */
function findDuplicates(
  reports: PageReport[],
  field: "title" | "description",
): Map<string, string> {
  const byValue = new Map<string, PageReport[]>();
  for (const report of reports) {
    const key = normalise(report[field]);
    if (!key) continue;
    const bucket = byValue.get(key);
    if (bucket) bucket.push(report);
    else byValue.set(key, [report]);
  }

  const messages = new Map<string, string>();
  for (const [, group] of byValue) {
    if (group.length < 2) continue;
    for (const report of group) {
      const others = group.filter((other) => other !== report).map((o) => o.url);
      messages.set(
        report.url,
        `duplicate ${field}, shared with: ${others.join(", ")}`,
      );
    }
  }
  return messages;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const sitemapUrl = `${args.base}/sitemap.xml`;
  let sitemapXml: string;
  try {
    const response = await get(sitemapUrl);
    if (response.status !== 200) {
      throw new Error(`${sitemapUrl} returned ${response.status}`);
    }
    sitemapXml = response.body;
  } catch (error) {
    console.error(`Could not read the sitemap: ${(error as Error).message}`);
    process.exit(2);
  }

  const entries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    (match) => ({
      loc: (match[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "").trim(),
      lastmod: (match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "").slice(
        0,
        10,
      ),
    }),
  );

  // Request against whatever host --base names so a local run does not
  // silently measure production, but keep the sitemap's own absolute URL as the
  // canonical we expect the page to declare.
  const targets = entries
    .filter((entry) => entry.loc)
    .map((entry) => ({
      url: entry.loc.replace(SITE_URL, args.base),
      canonicalUrl: entry.loc,
    }))
    .slice(0, args.limit ?? undefined);

  if (targets.length === 0) {
    console.error(`No <loc> entries found in ${sitemapUrl}.`);
    process.exit(2);
  }

  const reports = await pool(targets, args.concurrency, (target) =>
    inspect(target.url, target.canonicalUrl),
  );

  for (const [url, message] of findDuplicates(reports, "title")) {
    reports.find((r) => r.url === url)?.errors.push(message);
  }
  for (const [url, message] of findDuplicates(reports, "description")) {
    reports.find((r) => r.url === url)?.errors.push(message);
  }

  // Sitemap-level: a lastmod shared by many URLs is a build timestamp, and a
  // lastmod Google learns to distrust devalues the entries that are accurate.
  const sitemapWarnings: string[] = [];
  const byLastmod = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.lastmod) continue;
    byLastmod.set(entry.lastmod, (byLastmod.get(entry.lastmod) ?? 0) + 1);
  }
  for (const [date, count] of byLastmod) {
    if (count > MAX_URLS_PER_LASTMOD) {
      sitemapWarnings.push(
        `${count} sitemap URLs share lastmod ${date} — looks like a build timestamp, not a content date`,
      );
    }
  }

  const failed = reports.filter((r) => r.errors.length > 0);
  const warned = reports.filter((r) => r.warnings.length > 0);

  if (args.json) {
    console.log(
      JSON.stringify(
        { base: args.base, crawled: reports.length, sitemapWarnings, reports },
        null,
        2,
      ),
    );
  } else {
    console.log(`▶ Crawled ${reports.length} sitemap URLs on ${args.base}`);
    console.log(
      `  ${byLastmod.size} distinct lastmod dates across ${entries.length} entries`,
    );

    for (const warning of sitemapWarnings) console.log(`\n⚠ ${warning}`);

    // Warnings are content-quality advice, not defects, and on this site they
    // hit most event pages. Tallied by kind so the signal stays readable; the
    // per-URL list is one flag away when someone is actually working on copy.
    if (warned.length > 0 && !args.verbose) {
      const byKind = new Map<string, number>();
      for (const report of warned) {
        for (const warning of report.warnings) {
          const kind = warning.replace(/\d+/g, "N");
          byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
        }
      }
      console.log(`\n⚠ ${warned.length} page(s) with content warnings:`);
      for (const [kind, count] of [...byKind].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${String(count).padStart(4)}×  ${kind}`);
      }
      console.log(`  (--verbose lists them per URL)`);
    } else if (warned.length > 0) {
      console.log(`\n⚠ ${warned.length} page(s) with content warnings:`);
      for (const report of warned) {
        console.log(`  ${report.url}`);
        for (const warning of report.warnings) console.log(`    · ${warning}`);
      }
    }

    if (failed.length === 0) {
      console.log(
        `\n✓ Every page returns 200 with a unique title and description, exactly one <h1>, a self-canonical, and no noindex.`,
      );
    } else {
      console.error(`\n✗ ${failed.length} page(s) with errors:`);
      for (const report of failed) {
        console.error(`  ${report.url}`);
        for (const error of report.errors) console.error(`    · ${error}`);
      }
    }
  }

  const hasWarnings = warned.length > 0 || sitemapWarnings.length > 0;
  process.exit(failed.length > 0 || (args.strict && hasWarnings) ? 1 : 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
});
