/**
 * build-playbook.mts — renders the internal handbook into a page module.
 *
 * `/internal/event-playbook` is one page for a non-technical teammate who has
 * never opened the repository: which part of running an event belongs to their
 * team, and the exact words to type. That is one purpose-written document, and
 * it is compiled here, at authoring time, into `lib/docs/playbook.ts`, which
 * the page renders as a string. Compiling here rather than at request time
 * keeps `marked` out of the deployed bundle entirely (it is a devDependency)
 * and keeps the page a plain string render with no filesystem read on a
 * serverless function.
 *
 * Usage:
 *   npx tsx scripts/docs/build-playbook.mts
 *   npx tsx scripts/docs/build-playbook.mts --check   (exit 1 if out of date)
 *
 * Nothing here knows anything about the document's content. It is deliberately
 * agnostic: headings, tables, links and fences are handled by shape, so the
 * source can be rewritten, doubled in length, or given ten more diagrams
 * without this script changing — and `SOURCES` below is the only edit a second
 * document would need. The multi-document machinery (per-document heading-id
 * namespaces, per-part running heads) is retained and stays correct; it simply
 * has one entry configured, and the parts that only make sense with several
 * documents are suppressed rather than deleted — see `renderSource`.
 * `lib/docs/playbook.test.ts` is the gate that notices when the markdown has
 * moved on and this file has not been re-run.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Marked, Renderer, type Tokens } from "marked";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** One document in the handbook, in reading order. */
interface SourceSpec {
  /**
   * Namespace for every heading id this document produces. Documents that
   * number their sections (`## 1. …`, `## 2. …`) all produce the same slugs, so
   * without a per-document prefix a multi-source page would carry duplicate
   * `id` attributes and half the links would jump to the wrong part. The prefix
   * is applied with one source too, so that adding a second cannot silently
   * change every existing anchor on a page whose URL has been shared.
   */
  key: string;
  /**
   * What the reader is told they are in, printed above the document's own h1 —
   * but only when there is more than one document. With a single source the
   * label is noise above a title that already says what the page is, so it is
   * not rendered; it stays here because it also names the part in the build
   * log, in the manifest, and in the section's `aria-label`.
   */
  label: string;
  /** Repository-relative path, POSIX separators — it is printed and hashed. */
  path: string;
}

const SOURCES: readonly SourceSpec[] = [
  {
    key: "playbook",
    label: "Event Playbook",
    path: "docs/development/EVENT_PLAYBOOK.md",
  },
];

const TARGET = path.join(REPO_ROOT, "lib", "docs", "playbook.ts");

/** The command that fixes every failure this script or its test can report. */
const REBUILD_COMMAND = "npx tsx scripts/docs/build-playbook.mts";

/**
 * Collapses CRLF before anything else looks at the text.
 *
 * The repository has no `.gitattributes`, and this machine checks out with
 * `core.autocrlf=true` while CI (Linux) does not — so the same commit is CRLF
 * here and LF on the runner. Hashing or rendering the bytes as they sit on disk
 * would therefore make `--check` and the drift test fail on the platform rather
 * than on a change. Both the hash and the HTML are taken from the LF form, and
 * `lib/docs/playbook.test.ts` normalises the same way for the same reason.
 */
function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Content hash of one source document, taken from its LF form. See `toLf`. */
export function sourceSha256(markdown: string): string {
  return createHash("sha256").update(toLf(markdown), "utf8").digest("hex");
}

/** Escapes the three characters that can end an HTML text node early. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * GitHub-flavoured heading slug: lowercased, punctuation dropped, spaces
 * hyphenated. Matching GitHub matters because both documents are also read on
 * GitHub, and an anchor copied from there should land in the same place here —
 * which is why the per-document prefix is added around this function rather
 * than inside it, and why in-document links are rewritten to match.
 */
function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Strip inline markup that survived into the plain text of a heading.
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/**
 * The house renderer: three deviations from marked's defaults, each one there
 * because the default actively breaks something on the page. One instance per
 * source document, because the heading-id table is per document.
 */
class PlaybookRenderer extends Renderer {
  /** Slugs already emitted, so a repeated heading title still deep-links. */
  private readonly usedIds = new Map<string, number>();

  /** Every id this document emitted, for the in-document link rewrite. */
  readonly emittedIds = new Set<string>();

  constructor(private readonly idPrefix: string) {
    super();
  }

  /**
   * Mermaid fences must reach the browser as diagram SOURCE, not as rendered
   * code. Mermaid reads `textContent`, so `<br/>`, `<b>` and `&lt;slug&gt;`
   * inside a diagram have to survive as literal characters — which they only do
   * if the whole block is HTML-escaped once and never syntax-highlighted,
   * wrapped in `<pre><code>`, or otherwise touched.
   */
  override code(token: Tokens.Code): string {
    const lang = (token.lang ?? "").trim().split(/\s+/)[0];
    if (lang === "mermaid") {
      return `<div class="mermaid">${escapeHtml(token.text)}</div>\n`;
    }
    // Every other fence on this page is a prompt the reader is meant to copy
    // whole, so each one gets a wrapper. The wrapper exists at build time
    // rather than being introduced by the copy button's script, because a
    // button that inserts its own container reflows the block it is attached
    // to — the page would visibly shift under the reader on hydration, and it
    // would shift on exactly the element they were reaching for.
    return `<div class="playbook-prompt">${super.code(token)}</div>\n`;
  }

  /**
   * `h2`/`h3` carry a stable id so a link to one team's section survives being
   * pasted into Slack, which is how most people will arrive at this page.
   */
  override heading(token: Tokens.Heading): string {
    const html = super.heading(token);
    if (token.depth !== 2 && token.depth !== 3) return html;

    const plain = this.parser.parseInline(token.tokens, this.parser.textRenderer);
    const id = this.uniqueId(slugify(plain));
    if (!id) return html;

    this.emittedIds.add(id);
    return html.replace(/^<h([23])>/, `<h$1 id="${id}">`);
  }

  /**
   * Wide tables scroll inside themselves. Without the wrapper a nine-column
   * table drags the whole page sideways on a phone, which on a document this
   * long makes every other section unreadable too.
   */
  override table(token: Tokens.Table): string {
    return `<div class="table-scroll">\n${super.table(token)}</div>\n`;
  }

  /** `prefix-foo`, then `prefix-foo-1` — the disambiguation GitHub applies. */
  private uniqueId(base: string): string {
    if (!base) return "";
    const prefixed = `${this.idPrefix}-${base}`;
    const seen = this.usedIds.get(prefixed) ?? 0;
    this.usedIds.set(prefixed, seen + 1);
    return seen === 0 ? prefixed : `${prefixed}-${seen}`;
  }
}

/** One source document, rendered. */
interface RenderedSource {
  key: string;
  label: string;
  path: string;
  sha256: string;
  /** The `<section>` wrapper's own id, so a whole part can be linked to. */
  id: string;
  html: string;
}

/**
 * Repoints a document's own anchor links at the prefixed ids.
 *
 * A source read on GitHub as well as here will carry cross-references written
 * as `[text](#some-heading)`. Heading ids are prefixed so two documents cannot
 * collide, which would leave every one of those links pointing at nothing — and
 * a link where nothing happens on click is worse than no link. Rewritten here
 * rather than in `link()` because a link may appear before the heading it
 * names, so the id set has to be complete first.
 *
 * Only fragments that resolve to a heading in the SAME document are touched;
 * anything else (a real URL, an anchor to something this renderer did not emit)
 * is left exactly as the author wrote it.
 */
function rewriteInDocumentLinks(html: string, ids: ReadonlySet<string>, prefix: string): string {
  return html.replace(/href="#([^"]*)"/g, (whole, fragment: string) => {
    const target = `${prefix}-${fragment}`;
    return ids.has(target) ? `href="#${target}"` : whole;
  });
}

/**
 * Renders one source's markdown to the HTML the page injects.
 *
 * `withRunningHead` is false whenever the handbook is a single document. A
 * "Part 1 — …" band above the only document's own title answers a question
 * nobody asked, and the sticky bar it rides in costs the top of every screen on
 * a page that is now mostly short sections. It is generated, not deleted,
 * because it is the correct treatment the moment there are two documents again
 * and a reader landing mid-page has to know which one they are in.
 */
function renderSource(
  spec: SourceSpec,
  markdown: string,
  withRunningHead: boolean,
): RenderedSource {
  // The renderer goes in as a PARSE option, not through `Marked.use()`: `use()`
  // walks the renderer with `for...in`, which sees a class instance's own
  // fields (the heading-id table) but never its prototype methods — so it
  // rejects the state and registers none of the overrides. A fresh renderer per
  // call, because that id table must not accumulate across documents.
  const renderer = new PlaybookRenderer(spec.key);
  const marked = new Marked({ gfm: true });
  const body = marked.parse(toLf(markdown), { async: false, renderer });
  const linked = rewriteInDocumentLinks(body, renderer.emittedIds, spec.key);
  const id = `part-${spec.key}`;

  // The running head. The label is a paragraph, not a heading: it sits ABOVE
  // the document's own `<h1>`, and a heading there would either outrank the
  // title of the thing it labels or open a second document outline on a page
  // that has one.
  //
  // It carries no "back to contents" link, because the page has no contents
  // list to go back to — the diagram is this page's navigation, and every
  // section is named after a colour in it.
  const runningHead = withRunningHead
    ? `<p class="playbook-part-label">` +
      `<span class="playbook-part-name">${escapeHtml(spec.label)}</span>` +
      `</p>\n`
    : "";

  const html =
    `<section class="playbook-part" id="${id}" aria-label="${escapeHtml(spec.label)}">\n` +
    runningHead +
    `${linked}</section>\n`;

  return {
    key: spec.key,
    label: spec.label,
    path: spec.path,
    sha256: sourceSha256(markdown),
    id,
    html,
  };
}

/** Renders every source, in order. Exported for the generator's own checks. */
export function renderPlaybook(
  sources: readonly { spec: SourceSpec; markdown: string }[],
): RenderedSource[] {
  const withRunningHead = sources.length > 1;
  return sources.map(({ spec, markdown }) =>
    renderSource(spec, markdown, withRunningHead),
  );
}

/** The whole of the generated module, for the given documents. */
export function renderModule(
  sources: readonly { spec: SourceSpec; markdown: string }[],
): string {
  const rendered = renderPlaybook(sources);

  const manifest = rendered.map((s) => ({
    key: s.key,
    label: s.label,
    path: s.path,
    sha256: s.sha256,
  }));

  return `/**
 * The internal handbook, rendered to HTML for \`/internal/event-playbook\`.
 *
 * AUTO-GENERATED by scripts/docs/build-playbook.mts — do not edit by hand.
 * Edit the markdown listed in \`PLAYBOOK_SOURCES\` and re-run
 * \`${REBUILD_COMMAND}\`.
 *
 * Each entry in \`PLAYBOOK_SOURCES\` carries the sha256 of its markdown with LF
 * line endings; \`lib/docs/playbook.test.ts\` recomputes all of them and fails
 * when any disagrees, so a rewritten document can never sit behind a stale
 * page.
 */

/** One markdown document, as it stood when this module was generated. */
export interface PlaybookSource {
  /** Namespace prefixing every heading id this document produced. */
  key: string;
  /** The part label shown above the document's own title. */
  label: string;
  /** Repository-relative path to the markdown. */
  path: string;
  /** sha256 of that markdown, LF-normalised. */
  sha256: string;
}

export const PLAYBOOK_SOURCES: PlaybookSource[] = ${JSON.stringify(manifest, null, 2)};

// There is deliberately no contents structure here. The page carries no
// contents list: nine sections, each named after a colour in the one diagram,
// and the document's own opening tells the reader to look at the picture and
// find their team's colour. A list of links would have been a second, worse
// answer to a question the diagram already answers — and it cost the top of the
// first screen, which is where the diagram needs to be. Heading ids are still
// emitted, so a link to one team's section pasted into Slack still works.

// Embedded with JSON.stringify rather than a template literal: the documents
// contain backticks and \`\${\`, both of which a template literal would either
// break on or interpolate.
export const PLAYBOOK_HTML = ${JSON.stringify(rendered.map((s) => s.html).join("\n"))};
`;
}

/** Every `id="…"` in the page, so a collision fails the build not the reader. */
function duplicateIds(html: string): string[] {
  const counts = new Map<string, number>();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

function main(): void {
  const loaded: { spec: SourceSpec; markdown: string }[] = [];
  for (const spec of SOURCES) {
    const absolute = path.join(REPO_ROOT, spec.path);
    if (!existsSync(absolute)) {
      console.error(`Missing source: ${spec.path}`);
      process.exit(1);
    }
    loaded.push({ spec, markdown: readFileSync(absolute, "utf8") });
  }

  const next = renderModule(loaded);
  const current = existsSync(TARGET) ? readFileSync(TARGET, "utf8") : "";

  const rendered = renderPlaybook(loaded);
  const html = rendered.map((s) => s.html).join("\n");
  const diagrams = (html.match(/<div class="mermaid">/g) ?? []).length;
  // Reported because the copy-paste prompts are what the page is FOR: a
  // rewrite that quietly lost half of them should be visible in this line
  // before anyone opens a browser.
  const prompts = (html.match(/<div class="playbook-prompt">/g) ?? []).length;

  // A duplicate id is silent in the browser: the page renders, and one contents
  // link in every colliding pair simply lands somewhere else. Fail here.
  const duplicates = duplicateIds(html);
  if (duplicates.length > 0) {
    console.error(
      `Duplicate id(s) in the rendered page: ${duplicates.join(", ")}. ` +
        `Heading ids are namespaced per source, so this means two sources ` +
        `share a key, or a key collides with a "part-" wrapper id.`,
    );
    process.exit(1);
  }

  if (process.argv.includes("--check")) {
    if (toLf(current) === toLf(next)) {
      console.log(
        `lib/docs/playbook.ts is up to date (${SOURCES.length} source(s), ` +
          `${diagrams} diagram(s), ${prompts} prompt block(s)).`,
      );
      return;
    }
    console.error(
      `lib/docs/playbook.ts is out of date with ` +
        `${SOURCES.map((s) => s.path).join(" and ")}. Run: ${REBUILD_COMMAND}`,
    );
    process.exit(1);
  }

  if (toLf(current) === toLf(next)) {
    console.log(
      `lib/docs/playbook.ts already matched its sources ` +
        `(${SOURCES.length} source(s), ${diagrams} diagram(s), ${prompts} prompt block(s)).`,
    );
    return;
  }

  writeFileSync(TARGET, next, "utf8");
  console.log(
    `Wrote lib/docs/playbook.ts — ${SOURCES.length} source(s), ${diagrams} diagram(s), ` +
      `${prompts} prompt block(s), ${next.length.toLocaleString()} bytes.`,
  );
  for (const s of rendered) {
    console.log(`  ${s.label}: ${s.path}`);
  }
}

if (process.argv[1]?.includes("build-playbook")) {
  main();
}
