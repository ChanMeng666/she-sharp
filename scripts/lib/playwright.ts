/**
 * Finds Playwright without making it a dependency of this repo.
 *
 * Playwright is deliberately absent from `package.json`: adding it puts a
 * ~500 MB browser download into every install and every CI run, to serve checks
 * that need a running site and therefore cannot go in CI anyway. So the two
 * browser-driven checks here — `scripts/verify-storage-blocked.ts` and
 * `scripts/verify-panel-contrast.ts` — resolve it at runtime instead.
 *
 * This module exists because that resolution is subtler than it looks and was
 * wrong once (see `toSpecifier`). A second hand-rolled copy would invite the
 * same bug back, so both scripts share this one.
 */
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/**
 * The launcher, parameterised by the caller's own browser type.
 *
 * Playwright's types are not installed here, so each script types the surface
 * it touches structurally and narrowly. Generic rather than a shared `Browser`
 * interface because the two scripts drive different APIs — one needs
 * `addInitScript`, the other needs a viewport — and a union of both would let a
 * call through `typecheck:scripts` that the other script does not support.
 */
export interface PlaywrightLauncher<TBrowser> {
  launch(): Promise<TBrowser>;
}

interface PlaywrightModule<TBrowser> {
  chromium?: PlaywrightLauncher<TBrowser>;
  default?: { chromium?: PlaywrightLauncher<TBrowser> };
}

/**
 * Loads Playwright's `chromium` launcher.
 *
 * Four candidates, in order, and the order is the point:
 *
 *   1. `PLAYWRIGHT_MODULE_PATH`, if set — and if it is set, **nothing else is
 *      tried**. Somebody who names a copy explicitly and names it wrongly is
 *      better served by an error than by a different copy found silently. It is
 *      also how the "no Playwright" path gets exercised without renaming a
 *      global directory.
 *   2. The bare specifier, which is what a repo that does depend on Playwright,
 *      or a `pnpm dlx` invocation, would resolve. **ESM ignores `NODE_PATH`**,
 *      so on this machine it finds nothing — the reason the other candidates
 *      exist at all.
 *   3. `npm root -g`, the portable spelling of "the global install".
 *   4. `D:/npm-global/node_modules`, this machine's global root, for the case
 *      where npm itself is not on PATH.
 *
 * @returns Playwright's `chromium` launcher, or null if no copy was found.
 */
export async function loadChromium<TBrowser>(): Promise<PlaywrightLauncher<TBrowser> | null> {
  const override = process.env.PLAYWRIGHT_MODULE_PATH;
  const specifiers = override
    ? [toSpecifier(override)]
    : ["playwright", ...globalSpecifiers()];

  for (const specifier of specifiers) {
    try {
      const loaded = (await import(specifier)) as PlaywrightModule<TBrowser>;
      // Playwright is CommonJS, so under an ESM import the named exports may
      // arrive on `.default` instead of on the namespace object.
      const chromium = loaded.chromium ?? loaded.default?.chromium;
      if (chromium) return chromium;
    } catch {
      // Try the next candidate; the caller reports the one honest failure.
    }
  }

  return null;
}

/**
 * Turns a filesystem path into the `file://` URL that `import()` requires.
 *
 * The scheme test needs **two or more** leading characters, and that is the
 * whole point of it: `D:/npm-global/...` matches a one-letter scheme pattern,
 * so a naive `/^[a-z]+:/i` reads this machine's drive letter as a URL scheme,
 * hands the raw path to `import()`, and gets back "Only URLs with a scheme in:
 * file, data, and node are supported ... Received protocol 'd:'". Which this
 * function then swallowed as "Playwright is not installed".
 */
function toSpecifier(path: string): string {
  return /^[a-z][a-z0-9+.-]+:/i.test(path) ? path : pathToFileURL(path).href;
}

/** Global-install candidates, most portable first. */
function globalSpecifiers(): string[] {
  const roots: string[] = [];

  try {
    // `execSync`, not `execFileSync`, and both halves of that matter on
    // Windows: npm is `npm.cmd`, which `execFileSync` has refused outright
    // with EINVAL since the Node 20.12 fix for CVE-2024-27980, and passing an
    // args array with `shell: true` instead earns a DEP0190 deprecation
    // warning on every run. One constant command string avoids both.
    roots.push(
      execSync("npm root -g", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim(),
    );
  } catch {
    // npm is not on PATH, or is not installed. The hardcoded root may still hit.
  }

  roots.push("D:/npm-global/node_modules");

  return roots
    .filter(Boolean)
    .map((root) => toSpecifier(`${root.replace(/\\/g, "/")}/playwright/index.js`));
}
