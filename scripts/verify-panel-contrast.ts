/**
 * Renders the site in a browser and fails when a card paints the same colour as
 * the ground behind it.
 *
 * ---------------------------------------------------------------------------
 * THE INCIDENT, TWICE
 * ---------------------------------------------------------------------------
 *
 * On 2026-09-02 the contact and newsletter forms were reported as "a pale pink
 * box you cannot see" (#271). The cause was not the pink: `bg-background`
 * painted `#f9f5f8` and so did the page behind it, so the card was separated
 * from its own page by nothing but a `#e7e6f2` hairline at 1.09:1.
 *
 * Fixing those three by hand did not fix the class. The root cause was a
 * duplicate token — an unlayered `--color-background` outranking the `@theme`
 * mapping — and behind it a second problem the first had been hiding:
 * `bg-background` was doing three jobs at once (page canvas, card fill, control
 * fill) across 34 class signatures, and got away with it because all three
 * painted the same colour. Running this check for the first time found **12**
 * signatures, on pages nobody had complained about (#272).
 *
 * Nothing in the type system can catch that. A card and its page can both be
 * "correct" tokens and still be the same pixel.
 *
 * ---------------------------------------------------------------------------
 * WHY IT KEYS ON COLOUR, NEVER ON A CLASS NAME
 * ---------------------------------------------------------------------------
 *
 * The obvious check is a grep for `bg-background` on something that looks like
 * a card. That check would have inherited the exact blind spot of the change it
 * was meant to verify: it can only see the names the author already thought
 * about, and it goes green the moment a name is edited, whether or not the
 * pixels moved. This reads `getComputedStyle` on every element and compares a
 * panel to whatever actually paints behind it, so a card that stops separating
 * is a finding no matter which token, utility or inline style got it there.
 *
 * The same reasoning is why there is no allow-list. An allow-list is a name by
 * another spelling, and it would eventually silence a real finding.
 *
 * ---------------------------------------------------------------------------
 * WHAT COUNTS AS A PANEL
 * ---------------------------------------------------------------------------
 *
 * A panel is a *bounded* surface: bounded by a border, or by a radius applied
 * evenly to all four corners. Both halves earn their place:
 *
 *   * **Full-bleed sections are the ground, not panels.** A section painting
 *     the same colour as the page is how alternating bands are switched off,
 *     not a defect, so anything as wide as the viewport is skipped.
 *   * **A single-corner radius is a shape effect.** `components/ui/inflected-card.tsx`
 *     draws its cards by knocking a circular notch out of them with a
 *     pseudo-element painted in the page colour — `--parent-bg` is a knockout
 *     and is *supposed* to match the ground exactly. Requiring an even radius
 *     excludes it on a principle rather than by name.
 *   * **A fill nobody can see is not a contrast problem.** Image and video
 *     wells paint a placeholder the media then covers; on /mentorship those are
 *     `bg-muted` inside a `bg-muted` section and would otherwise be permanent
 *     findings this check could never clear.
 *
 * Small controls are out of scope by size. A 44px social icon button is carried
 * by its border and its icon, and including them turned every chip on the site
 * into noise that buried the real cards.
 *
 * ---------------------------------------------------------------------------
 * RUNNING IT
 * ---------------------------------------------------------------------------
 *
 * Needs a running site and a globally installed Playwright, which is
 * deliberately not a dependency here — `scripts/lib/playwright.ts` explains
 * why and how it is resolved. Neither is available in CI, so this is a local
 * check; the pure classifier underneath it lives in `scripts/lib/panel-contrast.ts`
 * and IS in CI, as
 * `scripts/verify-panel-contrast.test.ts`.
 *
 * Usage:
 *   npx tsx scripts/verify-panel-contrast.ts
 *   npx tsx scripts/verify-panel-contrast.ts --base http://localhost:3000
 *   npx tsx scripts/verify-panel-contrast.ts /donate /resources
 *   npx tsx scripts/verify-panel-contrast.ts --json
 *
 * Exits **2 for a finding** and **1 for a failure to run**, the same split as
 * `verify-storage-blocked.ts`: "the site has a flat card" and "I could not
 * look" must never share an exit code.
 */
import { loadChromium } from "./lib/playwright";
import { classify, type Finding, type RawSurface } from "./lib/panel-contrast";

/** The public pages worth walking. Extra paths can be passed positionally. */
const DEFAULT_PATHS = [
  "/",
  "/about",
  "/community",
  "/contact",
  "/donate",
  "/events",
  "/join-our-team",
  "/mentorship",
  "/mentorship/mentee",
  "/mentorship/mentor",
  "/newsletter/subscribe",
  "/resources",
  "/resources/in-the-press",
  "/resources/newsletters",
  "/resources/photo-gallery",
  "/slides",
  "/sponsors/corporate-sponsorship",
];

const NAVIGATION_TIMEOUT_MS = 60_000;
const PREFLIGHT_TIMEOUT_MS = 5_000;
const SETTLE_MS = 800;


/** Runs in the page. Serialised across the bridge, so kept self-contained. */
function collectSurfaces(): RawSurface[] {
  const TRANSPARENT = "rgba(0, 0, 0, 0)";
  const out: RawSurface[] = [];

  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const s = getComputedStyle(el);
    if (!s.backgroundColor || s.backgroundColor === TRANSPARENT) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const area = r.width * r.height;
    const mediaCovered = Array.from(
      el.querySelectorAll("img, video, picture, canvas"),
    ).some((m) => {
      const mr = m.getBoundingClientRect();
      return mr.width * mr.height >= area * 0.9;
    });

    let groundBg: string | null = null;
    let groundCls = "";
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.backgroundColor && ps.backgroundColor !== TRANSPARENT) {
        groundBg = ps.backgroundColor;
        groundCls = String(p.className ?? "").slice(0, 100);
        break;
      }
    }

    out.push({
      cls: String(el.className ?? "").slice(0, 200),
      bg: s.backgroundColor,
      borderWidth: parseFloat(s.borderTopWidth) || 0,
      borderStyle: s.borderTopStyle,
      radii: [
        parseFloat(s.borderTopLeftRadius) || 0,
        parseFloat(s.borderTopRightRadius) || 0,
        parseFloat(s.borderBottomLeftRadius) || 0,
        parseFloat(s.borderBottomRightRadius) || 0,
      ],
      width: r.width,
      height: r.height,
      viewportWidth: window.innerWidth,
      mediaCovered,
      groundBg,
      groundCls,
    });
  }

  return out;
}

/** Scrolls the whole page so lazily revealed sections mount before measuring. */
async function revealAll(): Promise<void> {
  const step = window.innerHeight;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  window.scrollTo(0, 0);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

interface Args {
  base: string;
  paths: string[];
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  let base = "http://localhost:3000";
  let json = false;
  const paths: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base") {
      const value = argv[++i];
      if (!value) throw new Error("--base needs a URL");
      base = value.replace(/\/$/, "");
    } else if (arg === "--json") {
      json = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      paths.push(arg.startsWith("/") ? arg : `/${arg}`);
    }
  }

  return { base, paths: paths.length > 0 ? paths : DEFAULT_PATHS, json };
}

/** Confirms something is answering on `base` before a browser is launched. */
async function preflight(base: string): Promise<string | null> {
  try {
    const response = await fetch(base, {
      signal: AbortSignal.timeout(PREFLIGHT_TIMEOUT_MS),
    });
    return response.status >= 500 ? `${base} answered ${response.status}` : null;
  } catch (error) {
    return `${base} is not answering: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

async function main(): Promise<void> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const chromium = await loadChromium<Browser>();
  if (!chromium) {
    console.error(
      "Playwright is not installed. It is deliberately not a dependency of this repo " +
        "(a ~500MB browser download in every install, for a check that cannot run in CI) — " +
        "install it globally with `npm i -g playwright && npx playwright install chromium`, " +
        "or point PLAYWRIGHT_MODULE_PATH at an existing copy's index.js.",
    );
    process.exit(1);
  }

  const unreachable = await preflight(args.base);
  if (unreachable) {
    console.error(
      `${unreachable}\nStart the site first: CI=true npx next build && npx next start -p 3000 ` +
        "(and kill any orphan server on the port — a stale one serves an OLD build).",
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report: Record<string, Finding[]> = {};
  const unreadable: string[] = [];
  let total = 0;

  for (const path of args.paths) {
    try {
      const response = await page.goto(`${args.base}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      // A 404 still renders the header and footer, so it has painted surfaces
      // and no flat cards — it passes. That makes a mistyped path look green,
      // which is how this check would quietly stop covering a page. Found by
      // accident when Git Bash rewrote `/donate` into a Windows path and the
      // run reported `ok` for a page that does not exist.
      const status = response?.status() ?? 0;
      if (status >= 400) {
        unreadable.push(`${path}: answered ${status}`);
        continue;
      }
      await page.waitForTimeout(SETTLE_MS);
      await page.evaluate(revealAll);
      const surfaces = await page.evaluate(collectSurfaces);
      // A page that paints nothing did not render. Counting it as "no findings"
      // is how a check passes because it looked at nothing.
      if (surfaces.length === 0) {
        unreadable.push(`${path}: rendered no painted surfaces`);
        continue;
      }
      const findings = classify(surfaces);
      report[path] = findings;
      total += findings.length;
      if (!args.json) {
        console.log(
          findings.length === 0
            ? `ok   - ${path}`
            : `FLAT - ${path} (${findings.length} signature${findings.length > 1 ? "s" : ""})`,
        );
        for (const f of findings) {
          console.log(`        x${f.count} ${f.bg} on the same ${f.bg}  border:${f.border}`);
          console.log(`             ${f.cls}`);
        }
      }
    } catch (error) {
      unreadable.push(
        `${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  await browser.close();

  if (args.json) {
    console.log(JSON.stringify({ base: args.base, report, unreadable }, null, 2));
  } else if (unreadable.length > 0) {
    console.error(`\n✗ ${unreadable.length} page(s) could not be read:`);
    for (const item of unreadable) console.error(`  · ${item}`);
  }

  if (unreadable.length > 0) {
    console.error("A check that skipped pages has not passed them.");
    process.exit(1);
  }

  if (total === 0) {
    console.log("\n✓ Every bounded panel separates from the ground behind it.");
  } else {
    console.error(
      `\n✗ ${total} panel signature(s) paint the same colour as their ground. ` +
        "A card whose fill equals its page is separated from it by nothing but a hairline. " +
        "Cards are bg-white, controls inside them are bg-muted, and bg-background is the canvas alone.",
    );
  }
  process.exit(total > 0 ? 2 : 0);
}

/*
 * Playwright's types are not installed here — it is resolved at runtime and is
 * not in `package.json` — so the surfaces this script touches are typed
 * structurally. Narrow on purpose: a wider `any` would let a Playwright API
 * change through `typecheck:scripts` silently.
 */
interface Browser {
  newPage(options: {
    viewport: { width: number; height: number };
  }): Promise<Page>;
  close(): Promise<void>;
}

interface Page {
  goto(
    url: string,
    options: { waitUntil: "load" | "domcontentloaded"; timeout: number },
  ): Promise<{ status(): number } | null>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
