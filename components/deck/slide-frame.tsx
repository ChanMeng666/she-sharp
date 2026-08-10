"use client";

import {
  Component,
  useEffect,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { useSlideSkin } from "@/components/deck/surfaces";
import { playSlideMotion, type MotionHandle } from "@/lib/deck/motion";
import type { Slide } from "@/lib/deck/types";
import { slideAriaLabel, slideLabel, toneOf } from "@/lib/deck/utils";

/** Never shrink past this — below it the copy stops being legible from a room. */
const MIN_FIT_SCALE = 0.72;

interface SlideBoundaryProps {
  slide: Slide;
  children: ReactNode;
}

interface SlideBoundaryState {
  failed: boolean;
}

/**
 * Error boundary around one slide's layout.
 *
 * A deck is projected in front of a room with no console open and no way to
 * recover, so a single malformed slide must degrade to "this one is broken"
 * rather than to a black screen for the rest of the event. The fallback keeps
 * the slide's own tone and shows its title, so the host can still talk to it.
 */
export class SlideBoundary extends Component<
  SlideBoundaryProps,
  SlideBoundaryState
> {
  state: SlideBoundaryState = { failed: false };

  static getDerivedStateFromError(): SlideBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Nobody is watching the console mid-talk, but the recording of it matters
    // afterwards when someone asks why slide 14 looked like that.
    console.error(
      `[deck] slide "${this.props.slide.id}" failed to render`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="deck-safe">
        <div className="deck-content my-auto">
          <p className="deck-title">{slideLabel(this.props.slide)}</p>
          <p className="deck-label" style={{ marginTop: 24 }}>
            This slide failed to render
          </p>
        </div>
      </div>
    );
  }
}

export interface SlideFrameProps {
  slide: Slide;
  /** Zero-based position in the deck. */
  index: number;
  total: number;
  /** Whether this is the slide currently on screen. */
  active: boolean;
  /**
   * Whether entrance motion may play. `false` is low-power / reduced-motion /
   * print, and means the slide simply appears already composed.
   *
   * Defaults to `false` so that a caller which does not think about motion —
   * the print sheet, which renders all thirty-eight slides `active` at once —
   * cannot accidentally start thirty-eight recipes on one page.
   */
  motion?: boolean;
  children: ReactNode;
}

/**
 * The `.deck-slide` wrapper: tone, visibility and accessibility for one slide.
 *
 * Every slide stays mounted for the whole session so advancing never waits on
 * layout, image decode or the venue's network. That makes hiding the inactive
 * ones a correctness problem rather than a cosmetic one: `inert` takes them out
 * of the tab order and `aria-hidden` takes them out of the accessibility tree,
 * so a keyboard or screen-reader user is never dropped into slide 30 while
 * slide 4 is on the projector. Both are needed — neither implies the other in
 * every browser.
 */
export function SlideFrame({
  slide,
  index,
  total,
  active,
  motion = false,
  children,
}: SlideFrameProps) {
  const ref = useRef<HTMLElement | null>(null);
  const skin = useSlideSkin(slide);
  useFitContent(ref, slide.id, active);
  useSlideMotion(ref, slide.type, active, motion, skin.tempo);

  return (
    <section
      ref={ref}
      className="deck-slide"
      data-tone={toneOf(slide)}
      // Every skin rule in `deck-skins.css` hangs off this. It is on the SLIDE
      // rather than on the stage because the two skins coexist inside one deck:
      // the organisational slides wear the house while the event's wear its own.
      data-skin={skin.key}
      data-active={active}
      role="group"
      aria-roledescription="slide"
      aria-label={slideAriaLabel(slide, index, total)}
      inert={!active || undefined}
      aria-hidden={!active || undefined}
      data-rail={railVariant(slide)}
    >
      <SlideRail slide={slide} index={index} total={total} />
      <SlideBoundary slide={slide}>{children}</SlideBoundary>
    </section>
  );
}

/**
 * The running header: brand mark leading, position and chapter trailing.
 *
 * Rendered here rather than by the layouts for a plain reason — a layout is
 * given only its slide, and the rail has to say "12 / 38", which nothing but the
 * frame knows. It is on every slide without exception. That constancy is the
 * point: like a page number, it is what makes thirty-eight slides read as one
 * object rather than thirty-eight posters.
 *
 * It is deliberately excluded from every entry animation. Furniture should
 * already be there when the slide arrives; a header that flies in is a header
 * the room notices, and nobody should ever notice this.
 */
function SlideRail({
  slide,
  index,
  total,
}: {
  slide: Slide;
  index: number;
  total: number;
}) {
  const position = String(index + 1).padStart(2, "0");
  const chapter = slide.section?.trim();

  return (
    <div className="deck-rail" aria-hidden="true">
      {/* The mark is "She#", not the words spelled out. It carried "SHE ♯ SHARP"
          until Mahsa read it off the projector on 5 Aug 2026 and asked for both
          corrections at once: drop the trailing word, and set the sign upright.
          U+266F MUSIC SHARP SIGN slants its horizontal bars by design — at rail
          size that reads as a skewed logo rather than a musical accidental, so
          the plain number sign is the truer mark here. */}
      <span className="deck-rail-brand">
        SHE <i className="deck-rail-sharp">#</i>
      </span>
      <span className="deck-rail-meta">
        {position} / {total}
        {/* Only when there is a chapter — a dangling separator looks like a bug. */}
        {chapter ? ` · ${chapter.toUpperCase()}` : ""}
      </span>
    </div>
  );
}

/**
 * How the rail sits on this slide.
 *
 * An opaque bar squares off the top of a full-colour photograph, so slides whose
 * ground is a photographic plate get a sheer rail instead. Everything else keeps
 * the solid one, which is what lets the chapter label stay legible over a busy
 * archive wall.
 */
function railVariant(slide: Slide): "sheer" | undefined {
  if (slide.type === "karakia" || slide.type === "photo") return "sheer";
  // A section or break slide is only photographic when it has been given a
  // plate; without one its ground is the archive wall or flat colour, and there
  // the solid bar is what keeps the chapter label legible.
  if ((slide.type === "section" || slide.type === "break") && slide.background) {
    return "sheer";
  }
  return undefined;
}

/**
 * Plays this slide type's motion recipe whenever the slide comes on screen.
 *
 * Keyed to `active` rather than to mount, because every slide is mounted for
 * the whole session: an unkeyed entrance would play all thirty-eight at once in
 * the first three seconds and be long finished by the time anyone reached slide
 * twenty. Re-entering a slide replays it, which is what a presenter stepping
 * back to re-make a point expects.
 *
 * The recipe is stopped on the way out and whenever motion is switched off, and
 * "stopped" always means "revealed": see the guarantee in `lib/deck/motion.ts`.
 * The effect deliberately has no other dependencies — a recipe restarting
 * because an unrelated prop changed would look like a glitch from the room.
 */
function useSlideMotion(
  ref: React.RefObject<HTMLElement | null>,
  type: Slide["type"],
  active: boolean,
  motion: boolean,
  tempo: number | undefined,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !active || !motion) return;

    let handle: MotionHandle | null = null;
    // One frame of headroom so the recipe measures a laid-out slide: the frame
    // it becomes active in is also the frame the cross-fade starts, and an SVG
    // ring has no length until it has been laid out at least once.
    const raf = requestAnimationFrame(() => {
      handle = playSlideMotion(element, type, tempo);
    });

    return () => {
      cancelAnimationFrame(raf);
      handle?.stop();
    };
  }, [ref, type, active, motion, tempo]);
}

/**
 * Last-resort guard against a slide taller than the stage.
 *
 * Layouts already adapt — run sheets split into columns, people grids shrink
 * their portraits — but decks are authored by event organisers, not designers,
 * and the failure mode of "one line too many" is content sliding off the bottom
 * of a projector mid-sentence. Nobody in the room can fix that.
 *
 * So after layout, if the safe area's content still exceeds the stage, the whole
 * block is scaled down to fit. It is measured per slide and re-measured when the
 * stage width changes, because the same slide fits on a 21:9 wall and does not
 * on a 4:3 projector. The floor at 72% is deliberate: past that the type is too
 * small to read from the back of the room, and the honest answer is to cut a
 * line rather than to shrink it, so the overflow is logged for the author.
 *
 * ONLY THE ACTIVE SLIDE MEASURES. Every slide is mounted, so an ungated version
 * put one ResizeObserver per slide on the ONE shared `.deck-stage` element, plus
 * a `load` listener on every image in the deck — roughly seventy observers and
 * four thousand listeners, each of whose callbacks reads `scrollHeight` and so
 * forces a synchronous layout of the whole stage. Every tile that finished
 * decoding triggered one. Gating on `active` also measures at a better moment:
 * on entry the fonts and this slide's images have actually loaded, whereas at
 * mount they had not. The trade is that the dev overflow warning below now
 * appears when you visit the offending slide rather than all at once on load —
 * the multi-screen preview pass steps through every slide anyway, so nothing
 * goes unreported.
 */
function useFitContent(
  ref: React.RefObject<HTMLElement | null>,
  slideId: string,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    const slide = ref.current;
    const safe = slide?.querySelector<HTMLElement>(".deck-safe");
    if (!slide || !safe) return;

    let raf = 0;

    const measure = () => {
      safe.style.removeProperty("--slide-fit");
      // `scrollHeight` on the flex column reports the height its children
      // actually need, including anything that has already overflowed.
      const needed = safe.scrollHeight;
      const available = safe.clientHeight;
      if (needed <= available + 1) return;

      const scale = Math.max(MIN_FIT_SCALE, available / needed);
      safe.style.setProperty("--slide-fit", scale.toFixed(4));

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[deck] slide "${slideId}" overflows the stage by ${Math.round(
            needed - available,
          )}px and was scaled to ${Math.round(scale * 100)}%. Cut a line instead.`,
        );
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();

    const stage = slide.closest(".deck-stage");
    const observer = new ResizeObserver(schedule);
    if (stage) observer.observe(stage);
    // Late-decoding images change the height after the first measurement.
    const images = slide.querySelectorAll("img");
    images.forEach((image) => image.addEventListener("load", schedule));

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      images.forEach((image) => image.removeEventListener("load", schedule));
    };
  }, [ref, slideId, active]);
}
