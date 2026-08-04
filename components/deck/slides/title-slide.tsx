import { Fragment, type CSSProperties } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import type { TitleSlide } from "@/lib/deck/types";

import {
  ArchiveWall,
  Kicker,
  PANEL_SAFE_PAD,
  PANEL_SPLIT,
  seedFrom,
} from "./archive";

/** Splits a headline so its final word can carry the accent colour. */
function splitHeadline(title: string): { lead: string; tail: string } {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { lead: "", tail: title };
  return { lead: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

/**
 * The slide that is on screen while the room is still finding its seats, and
 * again while it is leaving.
 *
 * COMPOSITION. The archive runs the full bleed and an opaque panel is cut into
 * its leading edge, leaving two to three tiles of untouched wall on the trailing
 * edge — so the first thing anyone sees is twelve years of rooms that filled up,
 * with the event's name cut out of the middle of it. The headline is solid ink,
 * not a photo knockout: it is four words long, and four words at 152px filled
 * with four different fragments of four different photographs is mush. The
 * knockout is reserved for the section numerals and the hero figures.
 *
 * `variant: "end"` drops the facts and centres the same voice under a sheer
 * incision: by then the details are behind the audience, not ahead of it.
 */
export function TitleSlideLayout({ slide }: { slide: TitleSlide }) {
  const isEnd = slide.variant === "end";
  const { lead, tail } = splitHeadline(slide.title);
  const meta = isEnd ? [] : (slide.meta ?? []);
  const logos = isEnd ? [] : (slide.logos ?? []);
  const seed = seedFrom(slide.id);

  if (isEnd) {
    return (
      <>
        <ArchiveWall seed={seed} />

        {/* A sheer cut rather than an opaque one: the room is leaving, and the
            last thing on the screen should be the archive still running. */}
        <div
          className="deck-incision deck-incision-sheer deck-edge-block-start deck-edge-block-end"
          style={{
            insetInline: 0,
            insetBlockStart: 254,
            blockSize: 498,
            "--incision-pad": "0px",
          } as CSSProperties}
          aria-hidden="true"
        />

        <div className="deck-safe">
          <div
            className="deck-content flex flex-1 flex-col items-center text-center"
            style={{ gap: "var(--deck-gap-md)" }}
          >
            <Kicker text={slide.eyebrow} />
            <h1 className="deck-display">
              {lead && <span>{lead} </span>}
              <span className="deck-accent">{tail}</span>
            </h1>
            {slide.subtitle && (
              <p className="deck-lead mx-auto">{slide.subtitle}</p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ArchiveWall seed={seed} />

      {/* The panel is a bare surface; the type lives in `.deck-safe` above it so
          the stage-overflow guard in `SlideFrame` can still measure and rescue
          it. An animated transform on the safe area would fight that guard. */}
      <div
        className="deck-incision deck-edge-inline-end"
        style={{
          insetBlockStart: "var(--deck-rail-h)",
          insetBlockEnd: 0,
          insetInlineStart: 0,
          inlineSize: PANEL_SPLIT,
          "--incision-pad": "0px",
        } as CSSProperties}
        aria-hidden="true"
      />

      <div className="deck-safe" style={{ paddingInlineEnd: PANEL_SAFE_PAD }}>
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-md)", marginInline: 0 }}
        >
          <Kicker text={slide.eyebrow} />

          <h1 className="deck-display">
            {lead && <span>{lead} </span>}
            <span className="deck-accent">{tail}</span>
          </h1>

          {slide.subtitle && (
            <p className="deck-lead">{slide.subtitle}</p>
          )}

          {meta.length > 0 && (
            <div
              className="flex flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              <hr className="deck-rule deck-rule-accent" />
              <div
                className="flex flex-wrap items-center"
                style={{ gap: "var(--deck-gap-sm)" }}
              >
                {meta.map((fact, index) => (
                  <Fragment key={fact}>
                    {index > 0 && (
                      <span
                        className="deck-rule-v deck-rule-accent"
                        style={{ blockSize: "1em" }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="deck-body">{fact}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Pushed to the foot of the panel. `mt-auto` is the one thing that
              beats the optical centring `.deck-content.flex-col` applies.

              Label on its own line, marks on one row beneath. Side by side they
              compete for a content column that is only ~600px wide on a 4:3
              projector, and the label wins — which collapsed the marks into a
              vertical stack and cost the slide about 250px of height it does
              not have. A row that shrinks is cheaper than a row that wraps. */}
          {logos.length > 0 && (
            <div className="mt-auto flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
              <span className="deck-label deck-faint">In partnership with</span>
              <div
                className="flex items-center"
                style={{ gap: "var(--deck-gap-sm)", minInlineSize: 0 }}
              >
                {logos.slice(0, 5).map((logo) => (
                  <div
                    key={logo.name}
                    className="deck-logo-chip"
                    style={{
                      // Shrink together rather than wrap; the chip's own
                      // `object-fit: contain` keeps every mark whole.
                      flex: "1 1 0",
                      maxInlineSize: 178,
                      minInlineSize: 0,
                      blockSize: 84,
                    }}
                  >
                    <DeckImage
                      image={{ src: logo.logo, alt: logo.name }}
                      fit="contain"
                      priority
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
