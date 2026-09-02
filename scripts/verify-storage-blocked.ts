/**
 * Renders the site in a browser whose storage throws, and asserts that nothing
 * about the page changed.
 *
 * ---------------------------------------------------------------------------
 * THE INCIDENT
 * ---------------------------------------------------------------------------
 *
 * On 2026-09-01, `components/cookie-banner.tsx` read
 * `localStorage.getItem("cookie-consent")` inside an effect with no try/catch.
 * `CookieBanner` renders from `app/layout.tsx` — the **root** layout — so the
 * throw took the whole React tree down during hydration and **every page on the
 * site rendered 127 characters with no `<h1>`**, `/sign-in` included. It was
 * found by accident, while testing an unrelated component's storage paths, and
 * fixed in f224e5f7 (#261).
 *
 * Two details are why this needs a browser rather than a unit test:
 *
 *   * **A blocked store does not return null — it throws.** Chrome, with site
 *     data blocked by a setting, an enterprise policy or a privacy extension,
 *     throws `QuotaExceededError`, not the `SecurityError` the name would lead
 *     you to guard for.
 *   * **The read that matters runs during hydration**, before anything a
 *     DevTools `evaluate` could reach. The patch has to be installed before any
 *     page script executes, which is exactly what `addInitScript` buys.
 *
 * The people it broke the site for are the people the cookie banner exists to
 * serve. That is the shape of this class of bug: the guard and the audience are
 * the same population, so a failure is invisible to everybody testing it.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS A CONTROL RUN
 * ---------------------------------------------------------------------------
 *
 * Measuring one throwing run cannot tell "the storage broke this page" from
 * "this page is short". The original throwaway probe used a 400-character
 * threshold, and `/sign-in` legitimately renders 290 characters with no `<h1>`,
 * so a naive threshold reports a healthy page as broken. This loads every path
 * **twice** — once with storage throwing, once with it working — and compares
 * the two. A page is only a finding when the two runs disagree.
 *
 * That is also what makes the exit code trustworthy: nothing here encodes what
 * a page is *supposed* to look like, so no page needs a baseline and no new
 * page needs registering.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT COVERS
 * ---------------------------------------------------------------------------
 *
 * Three throwing modes, because the two stores have different consumers.
 * `localStorage` is the cookie banner and the feedback form's device id;
 * `sessionStorage` is `components/newsletter/newsletter-signup.tsx`, which
 * reads a "this tab already signed up" marker through a `useSyncExternalStore`
 * snapshot on eight surfaces. Both is what a real blocked browser does. Running
 * them separately is what turns "something broke" into "this store broke it".
 *
 * The default paths are the three the incident was proven on. `/sign-in` earns
 * its place: it carries no footer and no newsletter form, so its blanking is
 * what isolated the root layout as the culprit rather than any page component.
 *
 * Playwright is deliberately **not** a dependency of this repo — it pulls a
 * ~500 MB browser download into every install and every CI run, for a check
 * that cannot run in CI anyway because it needs a built, running site. It is
 * resolved at runtime instead, by `scripts/lib/playwright.ts`.
 *
 * Usage:
 *   npx tsx scripts/verify-storage-blocked.ts
 *   npx tsx scripts/verify-storage-blocked.ts --base http://localhost:3100
 *   npx tsx scripts/verify-storage-blocked.ts /mentorship /donate
 *   npx tsx scripts/verify-storage-blocked.ts --mode session --json
 *
 * Run it against a local `next start -p 3100`, and **kill any orphan server on
 * the port first** — a stale server serves an OLD build, which makes a correct
 * fix look broken.
 *
 * Pass extra paths from PowerShell, not Git Bash: MSYS rewrites a leading `/`
 * into a Windows path, so `/mentorship` arrives as `C:/Program Files/Git/...`
 * and is rejected. `MSYS_NO_PATHCONV=1` also works. The default paths are
 * unaffected — they never cross a shell.
 *
 * Flags:
 *   --base <url>   Origin to probe. Default: http://localhost:3100.
 *   --mode <name>  Probe only one of `local`, `session`, `both`.
 *   --json         Machine-readable report on stdout instead of prose.
 *
 * Exit codes: 0 clean · 1 could not run (no Playwright, no server, bad
 *   argument) · 2 a real difference found.
 *
 * The 1/2 split is the same divergence `scripts/humanitix/check-optin-switch.ts`
 * documents, for the same reason: what this finds is silent, so a check whose
 * own infrastructure failed must never read as a pass *or* as a finding.
 */

import { loadChromium } from "./lib/playwright";

const USAGE = `Usage: npx tsx scripts/verify-storage-blocked.ts [--base <url>] [--mode local|session|both] [--json] [extra /paths...]`;

/** Matches `scripts/seo/verify-page-metadata.ts`, so one `next start` serves both. */
const DEFAULT_BASE = "http://localhost:3100";

/**
 * The three paths the 2026-09-01 incident was proven on.
 *
 * `/` and `/events` are the ordinary case. `/sign-in` is the diagnostic one:
 * no footer, no newsletter form, nothing storage-aware of its own, so if it
 * blanks the cause is above every page in the tree.
 */
const DEFAULT_PATHS = ["/", "/events", "/sign-in"];

/** How long to wait after load. The cookie banner has a deliberate 1s delay. */
const SETTLE_MS = 2_500;

/** Preflight only. A build served from `next start` answers well inside this. */
const PREFLIGHT_TIMEOUT_MS = 15_000;

/** Page-load ceiling. Generous: a cold `next start` compiles nothing but is not instant. */
const NAVIGATION_TIMEOUT_MS = 45_000;

/**
 * Allowed drift in body characters between the two runs of one path.
 *
 * Zero would be the honest number — same build, same server, seconds apart —
 * and every path measured on 2026-09-02 did come back byte-identical. A couple
 * of characters of slack is here so that a page which ever grows a relative
 * timestamp ("2 minutes ago") cannot turn this check red on a good day, which
 * is the state that gets a check deleted. The failure it exists to catch moved
 * a page from 3,429 characters to 127; nothing near this margin.
 */
const BODY_CHAR_TOLERANCE = 4;

type ThrowMode = "local" | "session" | "both";

const THROW_MODES: ThrowMode[] = ["local", "session", "both"];

interface Args {
  base: string;
  paths: string[];
  mode: ThrowMode | null;
  json: boolean;
}

/**
 * What one page load measured. Every field is a structural signal, not copy.
 *
 * **Five signals rather than one, and the fifth is not redundancy.** Any single
 * one of these is worthless on some page in the set, and the page it is
 * worthless on is not the page you would guess. `h1` is the clearest case:
 * `/sign-in` renders **0 `<h1>` both when it is healthy and when it is
 * blanked** — measured 2026-09-02, in both directions — so an h1-only check is
 * blind on precisely the page that carries no footer and no newsletter form,
 * which is the page that isolates the root layout as the culprit. The blanked
 * `/sign-in` was caught by `banner`, `emailInputs`, `nodes` and `bodyChars`
 * instead, all four of them.
 *
 * So do not thin this list down to "the one that matters". Each is compared
 * against that same path's own control, which costs nothing per signal and is
 * what lets a page be short, heading-less, or form-less without being a
 * finding.
 */
interface Snapshot {
  status: number;
  bodyChars: number;
  h1: number;
  banner: number;
  emailInputs: number;
  nodes: number;
  pageErrors: string[];
}

interface Comparison {
  path: string;
  mode: ThrowMode;
  control: Snapshot;
  blocked: Snapshot;
  differences: string[];
  /** Errors thrown in the blocked run that the control run did not also throw. */
  newErrors: string[];
  /** Errors thrown in both runs — a pre-existing defect, not a storage one. */
  sharedErrors: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    base: DEFAULT_BASE,
    paths: [],
    mode: null,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--base":
        args.base = (argv[++i] ?? "").replace(/\/+$/, "");
        if (!args.base) throw new Error(`--base needs a URL.\n${USAGE}`);
        break;
      case "--mode": {
        const value = argv[++i] ?? "";
        if (!THROW_MODES.includes(value as ThrowMode)) {
          throw new Error(
            `--mode must be one of ${THROW_MODES.join(", ")}.\n${USAGE}`,
          );
        }
        args.mode = value as ThrowMode;
        break;
      }
      case "--json":
        args.json = true;
        break;
      default:
        // Positional arguments are extra paths to probe, so a person chasing a
        // suspect page does not have to edit the script to look at it.
        if (!arg.startsWith("/")) {
          throw new Error(
            `Unknown flag or path (paths must start with "/"): ${arg}\n${USAGE}`,
          );
        }
        args.paths.push(arg);
    }
  }

  args.paths = [...new Set([...DEFAULT_PATHS, ...args.paths])];
  return args;
}

/**
 * The page-side patch: make one or both web storages throw the way Chrome does.
 *
 * **This is a string, not a function, and it has to stay one.** `addInitScript`
 * serialises whatever it is handed by reading the function's source, and the
 * source it would read here is not the source written here — `tsx` compiles
 * this file through esbuild with `keepNames`, which rewrites every nested
 * function as `__name(fn, "fn")`. That helper exists in the Node process and
 * not in the page, so the injected script died with `__name is not defined` on
 * every load, storage was never patched, and the run reported nine findings on
 * a site that was fine. A false *finding* is the merciful version; the same
 * mechanism silently produces a false pass on the day the injection is what
 * fails. Passing the source directly is the only form nothing can rewrite.
 *
 * The anonymous arrows handed to `page.evaluate` below are safe from the same
 * rewrite for a reason that is worth knowing rather than trusting: `keepNames`
 * exists to preserve `fn.name`, and an arrow passed straight in as an argument
 * has no name to preserve, so nothing is wrapped. Bind one to a `const` and it
 * acquires a name, a wrapper, and this bug.
 *
 * Property *access* is left working and the methods throw, which is the symptom
 * that reproduced the real bug. Note the error name: Chrome answers a blocked
 * store with `QuotaExceededError`, not the `SecurityError` that the situation
 * describes, so code guarding on the name alone would let this through.
 *
 * @param mode Which store or stores to break.
 * @returns Page-side JavaScript, ready for `addInitScript({ content })`.
 */
function throwingStorageScript(mode: ThrowMode): string {
  const targets =
    mode === "both" ? ["localStorage", "sessionStorage"]
    : mode === "local" ? ["localStorage"]
    : ["sessionStorage"];

  return `
    (function () {
      function boom() {
        throw new DOMException("Access is denied for this document.", "QuotaExceededError");
      }
      var blocked = {
        getItem: boom,
        setItem: boom,
        removeItem: boom,
        clear: boom,
        key: boom,
        get length() { return boom(); }
      };
      var targets = ${JSON.stringify(targets)};
      for (var i = 0; i < targets.length; i++) {
        Object.defineProperty(window, targets[i], {
          configurable: true,
          get: function () { return blocked; }
        });
      }
    })();
  `;
}

/**
 * Proves the injection itself works, before any page is judged by it.
 *
 * Without this the check has the failure mode it was written to catch: an
 * injected script that never ran leaves storage working, every path matches its
 * control, and the run exits 0 having tested nothing. So one throwaway context
 * is asked, in the page, whether `localStorage.getItem` actually throws — and
 * the answer has to be yes before anything else is measured.
 *
 * @returns null when the injection works, or a sentence saying it does not.
 */
async function verifyInjection(browser: Browser, url: string): Promise<string | null> {
  const context = await browser.newContext();
  await context.addInitScript({ content: throwingStorageScript("both") });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
    const result = await page.evaluate<string>(() => {
      try {
        window.localStorage.getItem("probe");
        return "localStorage.getItem did not throw";
      } catch (error) {
        return (error as DOMException).name === "QuotaExceededError"
          ? "ok"
          : `threw ${(error as DOMException).name}, expected QuotaExceededError`;
      }
    });
    return result === "ok" ? null : result;
  } finally {
    await context.close();
  }
}

/** Confirms something is answering on `base` before a browser is launched. */
async function preflight(base: string): Promise<string | null> {
  try {
    const response = await fetch(base, {
      signal: AbortSignal.timeout(PREFLIGHT_TIMEOUT_MS),
      redirect: "follow",
    });
    if (response.status >= 500) {
      return `${base} answered ${response.status}`;
    }
    return null;
  } catch (error) {
    return `${base} is not answering: ${(error as Error).message}`;
  }
}

/**
 * Loads one path once and measures it.
 *
 * A fresh context per load is deliberate. Storage is per-origin state, so a
 * reused context would carry the control run's stored cookie consent into the
 * blocked run and the two would legitimately differ — the check would then find
 * its own contamination and report it as the bug.
 *
 * @param mode Which storage to break, or null for the control run.
 */
async function measure(
  browser: Browser,
  url: string,
  mode: ThrowMode | null,
): Promise<Snapshot> {
  const context = await browser.newContext();
  if (mode) await context.addInitScript({ content: throwingStorageScript(mode) });

  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error: Error) => {
    pageErrors.push(String(error.message).split("\n")[0].slice(0, 160));
  });

  try {
    // `load`, then a fixed settle — deliberately NOT `networkidle`. The pages
    // carry a third-party request that never goes quiet, so `networkidle` hung
    // for the full 45s timeout on a site that was rendering perfectly, and a
    // check that hangs is a check nobody runs. `load` plus SETTLE_MS is also
    // the honest wait here: what is being measured is what hydration did, and
    // hydration is finished long before the last beacon is.
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.waitForTimeout(SETTLE_MS);

    const measured = await page.evaluate(() => ({
      bodyChars: document.body.innerText.trim().length,
      h1: document.querySelectorAll("h1").length,
      banner: document.querySelectorAll("[data-cookie-banner]").length,
      // The newsletter sign-up's field, and on /sign-in the sign-in form's.
      // Present only if the component actually mounted.
      emailInputs: document.querySelectorAll('input[name="email"]').length,
      nodes: document.querySelectorAll("*").length,
    }));

    return { status: response?.status() ?? 0, ...measured, pageErrors };
  } finally {
    await context.close();
  }
}

/** Compares a blocked run against its control and names every disagreement. */
function compare(
  path: string,
  mode: ThrowMode,
  control: Snapshot,
  blocked: Snapshot,
): Comparison {
  const differences: string[] = [];

  if (Math.abs(blocked.bodyChars - control.bodyChars) > BODY_CHAR_TOLERANCE) {
    differences.push(
      `body text is ${blocked.bodyChars} chars with storage blocked, ${control.bodyChars} without`,
    );
  }
  if (blocked.h1 !== control.h1) {
    differences.push(`<h1> count is ${blocked.h1}, control has ${control.h1}`);
  }
  if (blocked.banner !== control.banner) {
    differences.push(
      `cookie banner count is ${blocked.banner}, control has ${control.banner}`,
    );
  }
  if (blocked.emailInputs !== control.emailInputs) {
    differences.push(
      `email input count is ${blocked.emailInputs}, control has ${control.emailInputs}`,
    );
  }
  if (blocked.nodes !== control.nodes) {
    differences.push(
      `${blocked.nodes} elements rendered, control rendered ${control.nodes}`,
    );
  }

  // An error the control run threw too is a defect, but not this check's
  // defect, and failing on it would make the check red for a reason nobody
  // running it can act on — which is how a check stops being run. It is printed
  // loudly and left out of the exit code, the same call `check-facts.ts` makes
  // about a bot-walled source page.
  const controlErrors = new Set(control.pageErrors);
  const newErrors = blocked.pageErrors.filter((e) => !controlErrors.has(e));
  const sharedErrors = blocked.pageErrors.filter((e) => controlErrors.has(e));

  return { path, mode, control, blocked, differences, newErrors, sharedErrors };
}

/** Playwright errors carry a multi-line call log; only the first line is news. */
function firstLine(error: unknown): string {
  return String(error instanceof Error ? error.message : error).split("\n")[0];
}

function label(mode: ThrowMode): string {
  return mode === "both" ? "both stores" : `${mode}Storage`;
}

function printTable(comparisons: Comparison[]): void {
  console.log(
    "\n  mode          path            bodyChars(blocked/control)   h1   banner   email   nodes",
  );
  for (const item of comparisons) {
    const chars = `${item.blocked.bodyChars}/${item.control.bodyChars}`;
    console.log(
      "  " +
        label(item.mode).padEnd(14) +
        item.path.padEnd(16) +
        chars.padStart(20) +
        String(`${item.blocked.h1}/${item.control.h1}`).padStart(9) +
        String(`${item.blocked.banner}/${item.control.banner}`).padStart(9) +
        String(`${item.blocked.emailInputs}/${item.control.emailInputs}`).padStart(8) +
        String(`${item.blocked.nodes}/${item.control.nodes}`).padStart(12),
    );
  }
}

async function main() {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error((error as Error).message);
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
      `${unreachable}\nStart the site first: CI=true npx next build && npx next start -p 3100 ` +
        "(and kill any orphan server on the port — a stale one serves an OLD build).",
    );
    process.exit(1);
  }

  const modes = args.mode ? [args.mode] : THROW_MODES;

  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error(
      `Playwright is installed but could not launch Chromium: ${(error as Error).message}\n` +
        "Run `npx playwright install chromium` to download the browser binary.",
    );
    process.exit(1);
  }

  // Before anything is judged, prove the instrument works. See `verifyInjection`.
  const injectionFault = await verifyInjection(browser, `${args.base}/`);
  if (injectionFault) {
    await browser.close();
    console.error(
      `The storage patch did not take effect in the page (${injectionFault}), so every ` +
        "comparison would be a browser against itself. This is a fault in the check, not in the site.",
    );
    process.exit(1);
  }

  const comparisons: Comparison[] = [];
  let couldNotRun: string | null = null;

  try {
    for (const path of args.paths) {
      const url = `${args.base}${path}`;

      // One control per path, shared by all three modes: it is the same page
      // with storage working, and loading it three times would only add noise.
      //
      // A navigation that fails outright is infrastructure — a dead path, a
      // server that fell over mid-run — and it must not reach the exit-2 path,
      // where it would read as "blocked storage broke this page".
      let control: Snapshot;
      try {
        control = await measure(browser, url, null);
      } catch (error) {
        couldNotRun = `Could not load ${url} with storage working: ${firstLine(error)}`;
        break;
      }
      if (control.status !== 200) {
        couldNotRun = `${url} returned ${control.status} with storage working — nothing to compare against.`;
        break;
      }

      for (const mode of modes) {
        const blocked = await measure(browser, url, mode);
        comparisons.push(compare(path, mode, control, blocked));
      }
    }
  } finally {
    await browser.close();
  }

  if (couldNotRun) {
    console.error(couldNotRun);
    process.exit(1);
  }

  const findings = comparisons.filter(
    (item) => item.differences.length > 0 || item.newErrors.length > 0,
  );
  const shared = comparisons.filter((item) => item.sharedErrors.length > 0);

  if (args.json) {
    console.log(
      JSON.stringify(
        { base: args.base, paths: args.paths, modes, comparisons },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `▶ ${args.paths.length} path(s) × ${modes.length} throwing mode(s) on ${args.base}, each against its own control run`,
    );
    printTable(comparisons);

    if (shared.length > 0) {
      console.log(
        `\n⚠ ${shared.length} run(s) threw an uncaught error in BOTH runs — a real defect, but not a storage one, so it does not fail this check:`,
      );
      for (const item of shared) {
        console.log(`  ${item.path} (${label(item.mode)})`);
        for (const error of item.sharedErrors) console.log(`    · ${error}`);
      }
    }

    if (findings.length === 0) {
      console.log(
        `\n✓ Every page renders identically with storage throwing. The cookie banner still appears, ` +
          `the newsletter form still mounts, and nothing throws that did not throw anyway.`,
      );
    } else {
      console.error(`\n✗ ${findings.length} run(s) differ from their control:`);
      for (const item of findings) {
        console.error(`  ${item.path} (${label(item.mode)} throwing)`);
        for (const difference of item.differences) console.error(`    · ${difference}`);
        for (const error of item.newErrors) {
          console.error(`    · uncaught: ${error}`);
        }
      }
      console.error(
        "\nEvery web storage access needs a try/catch — a blocked store throws, it does not return null. " +
          "A component rendered from app/layout.tsx that throws during hydration blanks the entire site.",
      );
    }
  }

  process.exit(findings.length > 0 ? 2 : 0);
}

/*
 * Playwright's types are not installed here — it is resolved at runtime and is
 * not in `package.json` — so the three surfaces this script touches are typed
 * structurally. Narrow on purpose: a wider `any` would let a Playwright API
 * change through `typecheck:scripts` silently, and there is no CI run of this
 * script to catch it afterwards.
 */
interface Browser {
  newContext(): Promise<BrowserContext>;
  close(): Promise<void>;
}

interface BrowserContext {
  addInitScript(script: { content: string }): Promise<void>;
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface Page {
  on(event: "pageerror", handler: (error: Error) => void): void;
  goto(
    url: string,
    options: { waitUntil: "load" | "domcontentloaded"; timeout: number },
  ): Promise<{ status(): number } | null>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
