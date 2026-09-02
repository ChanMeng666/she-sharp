/**
 * Decides which painted surfaces are cards that vanish into their own page.
 *
 * Split out of `scripts/verify-panel-contrast.ts` so the test can import it
 * without running the CLI: that script calls `main()` at module scope, and a
 * test that imports it inherits a browser launch and an exit code that has
 * nothing to do with the assertions. A `import.meta.url === argv[1]` guard
 * would also work, but that comparison silently fails through a junctioned
 * worktree on this machine — exit 0, no output, no run — and a verification
 * tool that fails green is worse than one that fails loudly.
 *
 * Everything here is a pure function over measurements the browser took, which
 * is what lets `verify-panel-contrast.test.ts` run offline and in CI.
 */

/** Below this, a surface is a chip or an icon button, not a panel. */
const MIN_PANEL_WIDTH = 80;
const MIN_PANEL_HEIGHT = 40;
/** Below this, a radius is decoration rather than a boundary. */
const MIN_PANEL_RADIUS = 12;

/**
 * One painted surface, as the browser measured it.
 *
 * Deliberately raw: no judgement is baked into the collector, so every rule
 * below is testable without a browser.
 */
export interface RawSurface {
  cls: string;
  bg: string;
  borderWidth: number;
  borderStyle: string;
  /** Top-left, top-right, bottom-left, bottom-right, in px. */
  radii: [number, number, number, number];
  width: number;
  height: number;
  viewportWidth: number;
  /** True when an img/video/canvas covers ~all of it. */
  mediaCovered: boolean;
  /** Background of the nearest ancestor that paints one; null if none does. */
  groundBg: string | null;
  groundCls: string;
}

export interface Finding {
  cls: string;
  bg: string;
  border: string;
  radius: string;
  groundCls: string;
  size: string;
  count: number;
}

/**
 * Whether a background actually covers what is behind it.
 *
 * A translucent fill is not a contrast failure even when its colour matches:
 * the ground is showing through on purpose. Chromium reports alpha in two
 * spellings — `rgba(…, 0.1)` and `oklab(… / 0.4)` — and both have to be caught,
 * because the site's `bg-white/10` footer field and its `border-background/40`
 * carousel arrows are each one of them.
 */
export function isOpaque(color: string): boolean {
  if (!color || color === "transparent") return false;
  const rgbaAlpha = /,\s*([0-9.]+)\s*\)$/.exec(color);
  if (rgbaAlpha && Number(rgbaAlpha[1]) < 1) return false;
  const slashAlpha = /\/\s*([0-9.]+)\s*\)/.exec(color);
  if (slashAlpha && Number(slashAlpha[1]) < 1) return false;
  return true;
}

/**
 * Finds every bounded panel that paints the same colour as the ground behind it.
 *
 * A panel is a *bounded* surface: bounded by a border, or by a radius applied
 * evenly to all four corners. Each exclusion below exists because a real
 * element on this site matched it:
 *
 *   * **Full-bleed sections are the ground, not panels.** A section painting
 *     the page colour is how an alternating band is switched off.
 *   * **A single-corner radius is a shape effect, not a boundary.**
 *     `components/ui/inflected-card.tsx` carves the notch around its arrow
 *     button with a pseudo-element painted in the page colour, so matching the
 *     ground exactly is the design. Keying on an even radius excludes that on a
 *     principle rather than by name — an allow-list would eventually silence a
 *     real finding.
 *   * **A fill nobody can see is not a contrast problem.** Image wells paint a
 *     placeholder the media then covers; on /mentorship those are `bg-muted`
 *     inside a `bg-muted` section.
 *   * **Small controls are carried by their border and their icon.** Including
 *     them turned every chip on the site into noise that buried the real cards.
 *
 * @param surfaces Every painted surface on one page.
 * @returns One finding per distinct class signature, with how many matched.
 */
export function classify(surfaces: RawSurface[]): Finding[] {
  const seen = new Map<string, Finding>();

  for (const s of surfaces) {
    if (!isOpaque(s.bg)) continue;

    const bordered = s.borderWidth > 0 && s.borderStyle !== "none";
    const evenRadius =
      s.radii.every((r) => r === s.radii[0]) && s.radii[0] >= MIN_PANEL_RADIUS;
    if (!bordered && !evenRadius) continue;

    if (s.width < MIN_PANEL_WIDTH || s.height < MIN_PANEL_HEIGHT) continue;
    if (s.width >= s.viewportWidth - 1) continue;
    if (s.mediaCovered) continue;

    if (s.groundBg === null) continue;
    if (s.groundBg !== s.bg) continue;

    const key = `${s.cls}|${s.bg}`;
    const existing = seen.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    seen.set(key, {
      cls: s.cls,
      bg: s.bg,
      border: bordered ? `${s.borderWidth}px` : "none",
      radius: `${s.radii[0]}px`,
      groundCls: s.groundCls,
      size: `${Math.round(s.width)}x${Math.round(s.height)}`,
      count: 1,
    });
  }

  return [...seen.values()];
}
