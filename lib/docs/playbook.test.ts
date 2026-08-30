/**
 * Guards the generated playbook page against the document it was rendered from.
 *
 * `/internal/event-playbook` serves a build-time snapshot of one markdown file
 * — the event playbook. That is deliberate — it keeps `marked` out of the
 * deployed bundle — but it means the page can silently fall behind the
 * document, and the failure has the worst possible shape: the page still
 * renders, still looks authoritative, and quietly tells a volunteer to follow a
 * procedure that changed weeks ago. Nothing about a stale page looks stale.
 *
 * So the snapshot carries the hash of every source, and this test recomputes
 * them. It runs against the REAL markdown on purpose: a fixture would prove the
 * renderer works while the thing that actually breaks — someone editing the
 * document and not re-running the generator — went unnoticed.
 *
 * Run: npx tsx lib/docs/playbook.test.ts
 */

import assert from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderModule } from "../../scripts/docs/build-playbook.mjs";
import { PLAYBOOK_HTML, PLAYBOOK_SOURCES } from "./playbook";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const REBUILD = "npx tsx scripts/docs/build-playbook.mts";

/**
 * The same CRLF collapse the generator applies before hashing.
 *
 * There is no `.gitattributes`, so a Windows checkout with `core.autocrlf=true`
 * holds CRLF while the Linux CI runner holds LF. Hashing the bytes as they sit
 * on disk would make this test fail on the platform instead of on a change.
 */
function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Each source's markdown as it stands on disk right now, LF-normalised. */
const markdown = new Map(
  PLAYBOOK_SOURCES.map((source) => [
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

check("the handbook still names the document it is built from", () => {
  assert.ok(
    PLAYBOOK_SOURCES.length > 0,
    `PLAYBOOK_SOURCES is empty. Run: ${REBUILD}`,
  );
});

check("the page is byte-for-byte what the documents render to", () => {
  // Added 2026-08-30, when the same gap was found while building the email
  // playbook's guard beside this one. Every check in this file reads either the
  // markdown or the RENDERED page, and the hash below covers the markdown only.
  // Nothing here noticed a hand-edit of the generated module — which is
  // ordinary committed TypeScript, so anyone can change a sentence in it, and
  // the changed sentence is what a volunteer then reads. A hash of the input
  // cannot detect a forged output.
  //
  // Re-rendering and comparing the whole module closes that, catches the stale
  // module the hash already caught, and names the differing line instead of
  // reporting a digest mismatch.
  const expected = renderModule(
    PLAYBOOK_SOURCES.map((source) => ({
      spec: { key: source.key, label: source.label, path: source.path },
      markdown: markdown.get(source.path) ?? "",
    })),
  );
  const actual = toLf(
    readFileSync(path.join(REPO_ROOT, "lib", "docs", "playbook.ts"), "utf8"),
  );

  if (toLf(expected) !== actual) {
    const a = actual.split("\n");
    const b = toLf(expected).split("\n");
    const at = a.findIndex((line, i) => line !== b[i]);
    assert.fail(
      `lib/docs/playbook.ts is not what its source(s) render to (first ` +
        `difference at line ${at + 1}). Either the module was edited by hand — ` +
        `it is generated, so any edit there is lost on the next build — or a ` +
        `document moved on. Run: ${REBUILD}`,
    );
  }
});

for (const source of PLAYBOOK_SOURCES) {
  check(`${source.path} was rendered as it stands today`, () => {
    const actual = createHash("sha256")
      .update(markdown.get(source.path) ?? "", "utf8")
      .digest("hex");
    assert.equal(
      actual,
      source.sha256,
      `${source.path} has changed since the playbook page was generated. ` +
        `Run: ${REBUILD}`,
    );
  });
}

check("the page has content, and at least one diagram", () => {
  assert.ok(
    PLAYBOOK_HTML.trim().length > 0,
    `PLAYBOOK_HTML is empty. Run: ${REBUILD}`,
  );
  assert.ok(
    PLAYBOOK_HTML.includes('<div class="mermaid">'),
    "the playbook carries a diagram but the rendered page has no diagram " +
      `container — the fence renderer is not doing its job. Run: ${REBUILD}`,
  );
});

check("the copy-paste prompts survived the render", () => {
  // The prompts are the whole point of the page: a volunteer comes here to find
  // their team's section and paste the words at the end of it. A render that
  // swallowed the fenced blocks — a renderer override that returns nothing, a
  // wrapper that eats its own children — would leave a page that still reads
  // like a handbook and no longer does the one thing it is for. Nothing else in
  // this file would notice.
  const pres = (PLAYBOOK_HTML.match(/<pre>/g) ?? []).length;
  assert.ok(
    pres > 0,
    `the page has no <pre> block. The prompts are the reason this page ` +
      `exists, so a page without one is a broken page. Run: ${REBUILD}`,
  );

  // Every prompt must also carry its wrapper: `PromptCopyButtons` hangs a copy
  // button off `.playbook-prompt` and silently does nothing without it, so a
  // lost wrapper is a lost button with no error anywhere.
  const wrappers = (PLAYBOOK_HTML.match(/<div class="playbook-prompt">/g) ?? [])
    .length;
  assert.equal(
    wrappers,
    pres,
    `${pres} prompt block(s) but ${wrappers} .playbook-prompt wrapper(s). ` +
      `An unwrapped block gets no copy button and no error. Run: ${REBUILD}`,
  );
  console.log(`     (${pres} prompt block(s))`);
});

check("every mermaid fence across every source reached the page", () => {
  // Counted from the fences rather than a fixed number, so adding a diagram to
  // a document is caught as "regenerate" and never as "update this test".
  let fences = 0;
  for (const text of markdown.values()) {
    fences += (text.match(/^```mermaid\s*$/gm) ?? []).length;
  }
  const containers = (PLAYBOOK_HTML.match(/<div class="mermaid">/g) ?? []).length;
  assert.ok(fences > 0, "no source has a mermaid fence — this test proves nothing");
  assert.equal(
    containers,
    fences,
    `the sources hold ${fences} mermaid fence(s) but the page has ${containers} ` +
      `diagram container(s). A fence rendered as ordinary code shows the ` +
      `reader raw diagram syntax. Run: ${REBUILD}`,
  );
});

check("every section heading can still be linked to", () => {
  // The page carries no contents list — the diagram is its navigation. That
  // makes these ids the ONLY way to link someone to their team's section, and
  // those links are pasted into Slack, so they outlive any one build. A
  // renderer change that stopped emitting them would break every link ever
  // shared and leave a page that looks perfectly fine.
  const headings = [...PLAYBOOK_HTML.matchAll(/<h2(\s[^>]*)?>/g)];
  assert.ok(
    headings.length > 0,
    `the page has no <h2>. Run: ${REBUILD}`,
  );
  const withoutId = headings.filter((m) => !/\sid="[^"]+"/.test(m[1] ?? ""));
  assert.equal(
    withoutId.length,
    0,
    `${withoutId.length} of ${headings.length} <h2>(s) carry no id, so no one ` +
      `can be linked to those sections. Run: ${REBUILD}`,
  );
  console.log(`     (${headings.length} linkable section(s))`);
});

check("no id appears twice in the page", () => {
  // A document that numbers its sections produces the same slugs as any other
  // that does, and a duplicate id is silent: the browser renders the page and
  // one link in every colliding pair simply lands in the wrong place. The
  // generator namespaces heading ids per source; this is what proves it still
  // does, and keeps proving it if a second document is ever added back.
  const counts = new Map<string, number>();
  for (const match of PLAYBOOK_HTML.matchAll(/\sid="([^"]+)"/g)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([id, n]) => `${id} (${n}×)`);
  assert.deepEqual(
    duplicates,
    [],
    `duplicate id(s) in PLAYBOOK_HTML: ${duplicates.join(", ")}. Links to ` +
      `these land in whichever part comes first. Run: ${REBUILD}`,
  );
});

check("every in-document link resolves inside its own part", () => {
  // The document is read on GitHub as well as here, so it may carry its own
  // cross-references written as `[text](#slug)`. Heading ids are namespaced per
  // source, which silently turns every one of those links into a dead anchor —
  // the generator repoints them, and this is what proves it did.
  //
  // Checked per part rather than across the page: an anchor that resolves to a
  // heading of the SAME NAME in another document is not a working link, it is a
  // link that quietly sends the reader to the wrong half of the handbook.
  const parts = [
    ...PLAYBOOK_HTML.matchAll(
      /<section class="playbook-part" id="(part-[^"]+)"[\s\S]*?(?=<section class="playbook-part"|$)/g,
    ),
  ];
  assert.equal(
    parts.length,
    PLAYBOOK_SOURCES.length,
    `found ${parts.length} rendered part(s) for ${PLAYBOOK_SOURCES.length} ` +
      `source(s). Run: ${REBUILD}`,
  );

  const dead: string[] = [];
  let checked = 0;
  for (const part of parts) {
    const [html, partId] = [part[0], part[1]];
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const match of html.matchAll(/href="#([^"]*)"/g)) {
      checked += 1;
      if (!ids.has(match[1])) dead.push(`${partId} → #${match[1]}`);
    }
  }

  assert.deepEqual(
    dead,
    [],
    `dead in-document anchor(s): ${dead.join(", ")}. A link to a heading that ` +
      `is not in the same part scrolls nowhere, and nothing about the page ` +
      `looks broken. Run: ${REBUILD}`,
  );
  console.log(`     (${checked} in-document link(s) checked)`);
});

check("running heads appear only when there is more than one document", () => {
  // With one document a "Part 1 — …" band above its own title labels nothing,
  // and the sticky bar it rides in costs the top of every screen — which on
  // this page is where the diagram has to be. The generator suppresses it below
  // two sources; this is what stops it creeping back, and what keeps the
  // multi-source treatment honest if a second document lands.
  const heads = (PLAYBOOK_HTML.match(/class="playbook-part-label"/g) ?? []).length;
  const expected = PLAYBOOK_SOURCES.length > 1 ? PLAYBOOK_SOURCES.length : 0;
  assert.equal(
    heads,
    expected,
    `${heads} running head(s) for ${PLAYBOOK_SOURCES.length} source(s), ` +
      `expected ${expected}. Run: ${REBUILD}`,
  );
});

console.log(`\n${passed} checks passed.`);
