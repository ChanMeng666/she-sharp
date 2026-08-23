"use client";

import { useEffect } from "react";

/**
 * Turns every `<div class="mermaid">` on the page into a rendered diagram.
 *
 * The playbook page is server-rendered from a string of pre-compiled HTML, so
 * the diagram sources arrive as text and nothing on the server knows they are
 * diagrams. This component is the browser half: it loads mermaid lazily —
 * `import("mermaid")` rather than a top-level import, because the library is
 * roughly half a megabyte and no other route needs a byte of it — and renders
 * whatever containers it finds.
 *
 * It is deliberately DOM-driven rather than prop-driven. The containers are
 * produced by `scripts/docs/build-playbook.mts`, not by React, so React never
 * owns them; querying for them keeps this component agnostic about how many
 * diagrams the document has, which is the point — the SOP grows diagrams
 * without this file changing.
 */

/** She Sharp brand tokens, mirrored from `styles/components/legal-page.css`. */
const BRAND = {
  magenta: "#c846ab",
  magentaDeep: "#9b2e83",
  navy: "#1f1e44",
  pink: "#f7e5f3",
  lilac: "#f4f4fa",
  white: "#ffffff",
} as const;

/**
 * Node fills stay pale and label text stays navy on purpose. Magenta reads at
 * 4.61:1 only on pure black, so mid-magenta text on a light surface would fail
 * contrast on a page people are expected to read a procedure from. Magenta is
 * used for borders and emphasis, never for body-sized label text.
 */
const THEME_VARIABLES = {
  fontFamily:
    'var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: "15px",

  background: BRAND.white,
  primaryColor: BRAND.pink,
  primaryTextColor: BRAND.navy,
  primaryBorderColor: BRAND.magenta,
  secondaryColor: BRAND.lilac,
  secondaryTextColor: BRAND.navy,
  secondaryBorderColor: BRAND.magentaDeep,
  tertiaryColor: BRAND.white,
  tertiaryTextColor: BRAND.navy,
  tertiaryBorderColor: BRAND.pink,

  lineColor: BRAND.navy,
  textColor: BRAND.navy,
  mainBkg: BRAND.pink,
  nodeBorder: BRAND.magenta,
  clusterBkg: BRAND.lilac,
  clusterBorder: BRAND.pink,
  edgeLabelBackground: BRAND.white,
  titleColor: BRAND.navy,

  // Sequence diagrams.
  actorBkg: BRAND.pink,
  actorBorder: BRAND.magenta,
  actorTextColor: BRAND.navy,
  actorLineColor: BRAND.navy,
  signalColor: BRAND.navy,
  signalTextColor: BRAND.navy,
  labelBoxBkgColor: BRAND.lilac,
  labelBoxBorderColor: BRAND.magentaDeep,
  labelTextColor: BRAND.navy,
  loopTextColor: BRAND.navy,
  noteBkgColor: BRAND.lilac,
  noteBorderColor: BRAND.magentaDeep,
  noteTextColor: BRAND.navy,

  // Gantt charts.
  sectionBkgColor: BRAND.lilac,
  sectionBkgColor2: BRAND.pink,
  altSectionBkgColor: BRAND.white,
  taskBkgColor: BRAND.pink,
  taskBorderColor: BRAND.magenta,
  taskTextColor: BRAND.navy,
  taskTextOutsideColor: BRAND.navy,
  taskTextDarkColor: BRAND.navy,
  activeTaskBkgColor: BRAND.magentaDeep,
  activeTaskBorderColor: BRAND.navy,
  doneTaskBkgColor: BRAND.lilac,
  doneTaskBorderColor: BRAND.navy,
  // `crit` defaults to a pure red bar, which is the one colour on the page that
  // belongs to nothing else in the brand. Amber instead — the same pair the
  // document's own decision nodes use, so "pay attention here" reads the same
  // way in a gantt as it does in a flowchart.
  critBkgColor: "#fff3d6",
  critBorderColor: "#b8860b",
  gridColor: "#d8d8e4",
  todayLineColor: BRAND.magenta,

  // Timelines and pies walk `cScale0..n` per section. Eight stops rather than
  // four, because mermaid falls back to its own palette the moment it runs out
  // — a five-section timeline was rendering its last band in a stock salmon
  // that belongs to nothing else on the page.
  //
  // The second stop is a pale navy rather than `lilac`: lilac is within a
  // hair of the page background, so that band read as an unfilled gap between
  // two filled ones.
  cScale0: BRAND.pink,
  cScale1: "#dcdce8",
  cScale2: BRAND.magenta,
  cScale3: BRAND.navy,
  cScale4: BRAND.pink,
  cScale5: "#dcdce8",
  cScale6: BRAND.magenta,
  cScale7: BRAND.navy,
  cScaleLabel0: BRAND.navy,
  cScaleLabel1: BRAND.navy,
  cScaleLabel2: BRAND.white,
  cScaleLabel3: BRAND.white,
  cScaleLabel4: BRAND.navy,
  cScaleLabel5: BRAND.navy,
  cScaleLabel6: BRAND.white,
  cScaleLabel7: BRAND.white,
  // The rule mermaid draws under each timeline band. Left to itself it cycles
  // through greens and olives that appear nowhere else on the site.
  cScalePeer0: BRAND.navy,
  cScalePeer1: BRAND.navy,
  cScalePeer2: BRAND.navy,
  cScalePeer3: BRAND.navy,
  cScalePeer4: BRAND.navy,
  cScalePeer5: BRAND.navy,
  cScalePeer6: BRAND.navy,
  cScalePeer7: BRAND.navy,
} as const;

/**
 * How far a diagram may be shrunk to fit its column before scrolling is the
 * better trade.
 *
 * `useMaxWidth` scales an oversized diagram down to the container, which is
 * right for something a little too wide and wrong for something three times too
 * wide — the 3,190px timeline in this document lands at 35% and its labels stop
 * being words. Below this ratio the diagram is pinned to its own size and the
 * container scrolls instead: a scrollbar is a nuisance, unreadable text is not
 * a diagram at all.
 */
const MIN_LEGIBLE_SCALE = 0.74;

/** Natural width mermaid recorded on the SVG, in px, or null. */
function naturalWidthOf(svg: SVGElement): number | null {
  const inline = Number.parseFloat(svg.style.maxWidth);
  if (Number.isFinite(inline) && inline > 0) return inline;
  const viewBox = svg.getAttribute("viewBox")?.split(/[\s,]+/);
  const fromViewBox = viewBox ? Number.parseFloat(viewBox[2]) : NaN;
  return Number.isFinite(fromViewBox) && fromViewBox > 0 ? fromViewBox : null;
}

/** Pins a diagram to its natural width when fitting would make it unreadable. */
function fitOrScroll(container: HTMLElement, svg: SVGElement): void {
  const natural = naturalWidthOf(svg);
  if (natural === null) return;

  // Measure the space the SVG actually has, padding excluded.
  const style = getComputedStyle(container);
  const available =
    container.clientWidth -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight);
  if (!Number.isFinite(available) || available <= 0) return;

  // `useMaxWidth` renders at min(natural, available), so the shrink factor is
  // available/natural — and is 1, never a shrink, for a diagram that already
  // fits. Comparing the ratio the other way round pins exactly the small
  // diagrams that needed no help.
  const pin = natural > available && available / natural < MIN_LEGIBLE_SCALE;
  svg.style.width = pin ? `${natural}px` : "";
  container.classList.toggle("mermaid-pinned", pin);
}

export function MermaidRenderer() {
  useEffect(() => {
    let cancelled = false;

    async function render() {
      const containers = Array.from(
        document.querySelectorAll<HTMLElement>(".mermaid"),
      );
      if (containers.length === 0) return;

      // Keep each diagram's source before mermaid replaces it. A failed render
      // otherwise leaves an empty box with nothing to debug from, and the
      // reader loses the one thing that was still useful — the text.
      const sources = new Map(
        containers.map((el) => [el, el.textContent ?? ""] as const),
      );

      // Wait for the webfonts before rendering anything.
      //
      // Mermaid sizes every node by measuring its label in the DOM, and the
      // measurement is final — the box is a fixed width from then on. The site
      // loads Instrument Sans with `display: swap`, so a diagram rendered too
      // early is measured in the fallback (system-ui, narrower) and re-painted
      // in the real face, which is wider: the box no longer fits the words and
      // long labels are cut mid-word with no ellipsis to say so.
      try {
        await document.fonts.ready;
      } catch {
        // A browser without the Font Loading API renders in whatever it has.
      }
      if (cancelled) return;

      let mermaid;
      try {
        mermaid = (await import("mermaid")).default;
      } catch (error) {
        console.error("[playbook] mermaid failed to load", error);
        return;
      }
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: THEME_VARIABLES,
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          useMaxWidth: true,
          // `wrappingWidth` defaults to 200px, and mermaid enforces it as a
          // hard `max-width` on a `white-space: nowrap` label — so a label
          // longer than that is not wrapped, it is CUT, mid-word, with nothing
          // to say it happened. Twenty-one labels in this document were losing
          // their ends that way, including file paths and command lines where
          // the end is the part that matters. Raised to a width no label in a
          // technical diagram plausibly exceeds.
          wrappingWidth: 560,
        },
        sequence: { useMaxWidth: true },
        // `leftPadding` defaults to 75px, which is narrower than most section
        // names — the label then sits under the first bar of its own row.
        gantt: { useMaxWidth: true, leftPadding: 150 },
      });

      // One `run()` per diagram, not one for the page. A single malformed
      // diagram would otherwise abort the batch and leave every diagram after
      // it as raw text — on a document whose whole value is the pictures, that
      // reads as a broken page rather than as one broken picture.
      for (const el of containers) {
        if (cancelled) return;
        try {
          await mermaid.run({ nodes: [el], suppressErrors: false });
          const svg = el.querySelector("svg");
          if (svg) fitOrScroll(el, svg);
        } catch (error) {
          console.error("[playbook] a diagram failed to render", error);
          el.textContent = sources.get(el) ?? el.textContent;
          el.removeAttribute("data-processed");
          el.classList.add("mermaid-failed");
        }
      }

      // The fit/scroll decision depends on the column width, so it has to be
      // retaken when the window changes — most visibly when a laptop is plugged
      // into the projector this document is about.
      const onResize = () => {
        for (const el of containers) {
          const svg = el.querySelector("svg");
          if (svg) fitOrScroll(el, svg);
        }
      };
      window.addEventListener("resize", onResize);
      cleanup = () => window.removeEventListener("resize", onResize);
    }

    let cleanup: (() => void) | undefined;
    void render();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
