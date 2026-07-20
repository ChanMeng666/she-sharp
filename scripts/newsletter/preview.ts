/**
 * Render a newsletter issue JSON file to HTML for local review.
 *
 *   npx tsx scripts/newsletter/preview.ts <path-to-issue.json> [--mode broadcast|preview] [--open]
 *
 * Loads the JSON at the given path directly (does NOT touch the issues
 * registry), validates it against `newsletterIssueSchema`, renders the
 * requested mode(s) to `tmp/emails/newsletter-<id>.<mode>.html`, prints the
 * rendered size of each, and (with --open) opens them in the default browser.
 *
 * With no --mode, both broadcast and preview files are written.
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { newsletterIssueSchema } from "@/lib/newsletter/schema";
import { renderNewsletter } from "@/lib/newsletter/render";

type Mode = "broadcast" | "preview";

function parseArgs(argv: string[]): {
  jsonPath: string;
  modes: Mode[];
  open: boolean;
} {
  const positional: string[] = [];
  let modes: Mode[] = ["broadcast", "preview"];
  let open = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--open") {
      open = true;
    } else if (arg === "--mode") {
      const value = argv[++i];
      if (value !== "broadcast" && value !== "preview") {
        throw new Error(`--mode must be "broadcast" or "preview", got: ${value}`);
      }
      modes = [value];
    } else {
      positional.push(arg);
    }
  }

  if (positional.length === 0) {
    throw new Error(
      "Usage: npx tsx scripts/newsletter/preview.ts <path-to-issue.json> [--mode broadcast|preview] [--open]"
    );
  }
  return { jsonPath: positional[0], modes, open };
}

/** Open a file in the default application (Windows `start`, fallbacks). */
function openInBrowser(filePath: string): void {
  const platform = process.platform;
  if (platform === "win32") {
    // `start` is a cmd builtin; the empty "" is the window title arg.
    spawn("cmd", ["/c", "start", "", filePath], { detached: true, stdio: "ignore" });
  } else if (platform === "darwin") {
    spawn("open", [filePath], { detached: true, stdio: "ignore" });
  } else {
    spawn("xdg-open", [filePath], { detached: true, stdio: "ignore" });
  }
}

async function main(): Promise<void> {
  const { jsonPath, modes, open } = parseArgs(process.argv.slice(2));

  const absPath = resolve(process.cwd(), jsonPath);
  const raw = JSON.parse(readFileSync(absPath, "utf8"));
  const issue = newsletterIssueSchema.parse(raw);

  const outDir = resolve(process.cwd(), "tmp", "emails");
  mkdirSync(outDir, { recursive: true });

  console.log(`Rendering issue ${issue.id} (${modes.join(", ")})`);

  for (const mode of modes) {
    const { html, sizeKb } = await renderNewsletter(issue, mode);
    const outPath = resolve(outDir, `newsletter-${issue.id}.${mode}.html`);
    writeFileSync(outPath, html, "utf8");
    console.log(`  ${mode.padEnd(9)} ${sizeKb.toFixed(1).padStart(6)}KB  ${outPath}`);
    if (open) openInBrowser(outPath);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
