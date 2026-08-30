/**
 * Guards the generated email-playbook page against the document it came from.
 *
 * Same failure this repository already recorded once for `/internal/event-
 * playbook`: the page serves a build-time snapshot, so it can fall behind its
 * source silently. Nothing about a stale page looks stale — it still renders,
 * still reads authoritatively, and quietly tells a volunteer that a rule is
 * something other than what it now is. On this page that volunteer is deciding
 * whether a group of real people may be emailed, so the snapshot carries the
 * hash of its source and this test recomputes it.
 *
 * It runs against the REAL markdown on purpose: a fixture would prove the
 * renderer works while the thing that actually breaks — someone editing the
 * document and not re-running the generator — went unnoticed.
 *
 * Run: npx tsx lib/docs/email-playbook.test.ts
 */

import assert from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderModule } from "../../scripts/docs/build-email-playbook.mjs";
import { EMAIL_PLAYBOOK_HTML, EMAIL_PLAYBOOK_SOURCES } from "./email-playbook";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const REBUILD = "npx tsx scripts/docs/build-email-playbook.mts";

/** The same CRLF collapse the generator applies before hashing. See its note. */
function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

const markdown = new Map(
  EMAIL_PLAYBOOK_SOURCES.map((source) => [
    source.path,
    toLf(readFileSync(path.join(REPO_ROOT, source.path), "utf8")),
  ]),
);

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

check("the page still names the document it is built from", () => {
  assert.equal(
    EMAIL_PLAYBOOK_SOURCES.length,
    1,
    `expected exactly one source. Run: ${REBUILD}`,
  );
});

check("the page is byte-for-byte what the document renders to", () => {
  // The hash below covers the MARKDOWN. It says the document has not moved on
  // without the page being rebuilt — and it says nothing at all about the
  // generated module, which is ordinary committed TypeScript that anybody can
  // edit. Measured 2026-08-30: changing "At most three marketing emails" to
  // "nine" directly in `email-playbook.ts` left every other check on this page
  // green, and the wrong number would have been what staff read. A hash of the
  // input cannot detect a forged output.
  //
  // So the document is re-rendered here and compared to what is committed.
  // That catches the hand-edit above, catches a stale module the hash would
  // also have caught, and — because it compares the whole module rather than a
  // digest — says which line differs. It runs the real generator, so a change
  // to the renderer that alters every page is caught here too.
  //
  // `marked` is a devDependency reached only from this test and the generator.
  // Neither is imported by anything under `app/`, so it stays out of the
  // deployed bundle, which is the reason the page is a snapshot in the first
  // place.
  const [source] = EMAIL_PLAYBOOK_SOURCES;
  const expected = renderModule(markdown.get(source.path) ?? "");
  const actual = toLf(
    readFileSync(path.join(REPO_ROOT, "lib", "docs", "email-playbook.ts"), "utf8"),
  );

  if (toLf(expected) !== actual) {
    // Name the first differing line: on a 26 kB single-line HTML string, a
    // bare "not equal" tells the reader nothing they can act on.
    const a = actual.split("\n");
    const b = toLf(expected).split("\n");
    const at = a.findIndex((line, i) => line !== b[i]);
    assert.fail(
      `lib/docs/email-playbook.ts is not what ${source.path} renders to ` +
        `(first difference at line ${at + 1}). Either the module was edited by ` +
        `hand — it is generated, so any edit there is lost on the next build — ` +
        `or the document moved on. Run: ${REBUILD}`,
    );
  }
});

for (const source of EMAIL_PLAYBOOK_SOURCES) {
  check(`${source.path} was rendered as it stands today`, () => {
    const actual = createHash("sha256")
      .update(markdown.get(source.path) ?? "", "utf8")
      .digest("hex");
    assert.equal(
      actual,
      source.sha256,
      `${source.path} has changed since the page was generated. ` +
        `Run: ${REBUILD}`,
    );
  });
}

check("the page has content, and its diagram", () => {
  assert.ok(
    EMAIL_PLAYBOOK_HTML.trim().length > 0,
    `EMAIL_PLAYBOOK_HTML is empty. Run: ${REBUILD}`,
  );
  const fences = (
    [...markdown.values()].join("\n").match(/^```mermaid\s*$/gm) ?? []
  ).length;
  const containers = (
    EMAIL_PLAYBOOK_HTML.match(/<div class="mermaid">/g) ?? []
  ).length;
  assert.ok(fences > 0, "the source has no mermaid fence — this proves nothing");
  assert.equal(
    containers,
    fences,
    `${fences} mermaid fence(s) in the source but ${containers} diagram ` +
      `container(s) on the page. A fence rendered as ordinary code shows the ` +
      `reader raw diagram syntax. Run: ${REBUILD}`,
  );
});

check("every prompt block kept its copy-button wrapper", () => {
  // `PromptCopyButtons` hangs its button off `.playbook-prompt` and silently
  // does nothing without it, so an unwrapped block is a lost button and no
  // error anywhere.
  const pres = (EMAIL_PLAYBOOK_HTML.match(/<pre>/g) ?? []).length;
  const wrappers = (
    EMAIL_PLAYBOOK_HTML.match(/<div class="playbook-prompt">/g) ?? []
  ).length;
  assert.equal(
    wrappers,
    pres,
    `${pres} prompt block(s) but ${wrappers} wrapper(s). Run: ${REBUILD}`,
  );
  console.log(`     (${pres} prompt block(s))`);
});

check("every section heading can still be linked to", () => {
  // These ids are the only way to link somebody to one rule — "read section 4"
  // in Slack is a URL, and those URLs outlive any one build.
  const headings = [...EMAIL_PLAYBOOK_HTML.matchAll(/<h2(\s[^>]*)?>/g)];
  assert.ok(headings.length > 0, `the page has no <h2>. Run: ${REBUILD}`);
  const withoutId = headings.filter((m) => !/\sid="[^"]+"/.test(m[1] ?? ""));
  assert.equal(
    withoutId.length,
    0,
    `${withoutId.length} of ${headings.length} <h2>(s) carry no id. ` +
      `Run: ${REBUILD}`,
  );
  console.log(`     (${headings.length} linkable section(s))`);
});

check("no id appears twice, and none belongs to the other handbook", () => {
  const counts = new Map<string, number>();
  for (const match of EMAIL_PLAYBOOK_HTML.matchAll(/\sid="([^"]+)"/g)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([id, n]) => `${id} (${n}×)`);
  assert.deepEqual(duplicates, [], `duplicate id(s): ${duplicates.join(", ")}`);

  // The two handbooks number their sections the same way, so they generate the
  // same slugs. The generator namespaces them apart — `email-` here,
  // `playbook-` there. A copied key would silently produce two pages whose
  // anchors look interchangeable and are not: a link meant for one rule would
  // scroll to the other page's section of the same number, on the wrong page,
  // and nothing would look broken.
  const borrowed = [...counts.keys()].filter((id) =>
    id.startsWith("playbook-"),
  );
  assert.deepEqual(
    borrowed,
    [],
    `id(s) from the event playbook's namespace on this page: ` +
      `${borrowed.join(", ")}. The two handbooks must not share a key.`,
  );
});

check("every in-document link resolves", () => {
  const ids = new Set(
    [...EMAIL_PLAYBOOK_HTML.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]),
  );
  const dead: string[] = [];
  let checked = 0;
  for (const match of EMAIL_PLAYBOOK_HTML.matchAll(/href="#([^"]*)"/g)) {
    checked += 1;
    if (!ids.has(match[1])) dead.push(`#${match[1]}`);
  }
  assert.deepEqual(
    dead,
    [],
    `dead in-document anchor(s): ${dead.join(", ")}. A link that scrolls ` +
      `nowhere looks like nothing is wrong. Run: ${REBUILD}`,
  );
  console.log(`     (${checked} in-document link(s) checked)`);
});

check("the page still links the authorities instead of replacing them", () => {
  // This page summarises three documents that are each the only place their
  // subject is written down. The summary is safe ONLY while it points at them:
  // drop the pointer and the page stops being a summary and becomes a second
  // copy of a consent rule, which is how the first copy goes stale. That
  // failure is invisible — a page with the pointer removed reads *better*, not
  // worse, because it now looks self-contained.
  const text = [...markdown.values()].join("\n");
  const authorities = [
    ".claude/skills/update-mailing-list/references/consent-rules.md",
    "docs/development/EMAIL_RESPONSIBILITY_BOUNDARIES.md",
    "docs/deployment/MAILCHIMP_CANCELLATION.md",
  ];
  const missing = authorities.filter((doc) => !text.includes(doc));
  assert.deepEqual(
    missing,
    [],
    `the handbook no longer points at: ${missing.join(", ")}. Every rule on ` +
      `this page is a summary of one of those; without the pointer it reads ` +
      `as the rule itself.`,
  );
});

check("no section quotes a count without a date beside it", () => {
  // The house rule in EMAIL_PLATFORM_STATE.md: every figure carries the date it
  // was taken, because all of them move. A count printed bare reads as a
  // permanent fact about the organisation, and this page's counts are the ones
  // somebody would repeat to a funder.
  //
  // Checked per section rather than per line: a table's total sits many lines
  // below the sentence that dates it, and demanding the date on the same line
  // would push authors into repeating it until they stopped reading it.
  const source = [...markdown.values()].join("\n");
  const sections = source.split(/^## /m);
  const DATE =
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}|(January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\b/;
  const COUNT = /\b\d{1,3},\d{3}\b/;

  const undated = sections
    .filter((section) => COUNT.test(section) && !DATE.test(section))
    .map((section) => section.split("\n")[0].trim());

  assert.deepEqual(
    undated,
    [],
    `section(s) quoting a count with no date anywhere in them: ` +
      `${undated.join("; ")}. Every figure on this page moves — print the ` +
      `date it was taken, or do not print the figure.`,
  );
});

console.log(`\n${passed} checks passed.`);
