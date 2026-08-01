"use client";

import {
  Component,
  useEffect,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from "react";

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
  children,
}: SlideFrameProps) {
  const ref = useRef<HTMLElement | null>(null);
  useFitContent(ref, slide.id);

  return (
    <section
      ref={ref}
      className="deck-slide"
      data-tone={toneOf(slide)}
      data-active={active}
      role="group"
      aria-roledescription="slide"
      aria-label={slideAriaLabel(slide, index, total)}
      inert={!active || undefined}
      aria-hidden={!active || undefined}
    >
      <SlideBoundary slide={slide}>{children}</SlideBoundary>
    </section>
  );
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
 */
function useFitContent(
  ref: React.RefObject<HTMLElement | null>,
  slideId: string,
) {
  useEffect(() => {
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
  }, [ref, slideId]);
}
