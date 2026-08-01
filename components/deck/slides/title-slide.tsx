import { Fragment } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import type { TitleSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

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
 * `variant: "open"` carries the event name, the date and venue facts a late
 * arrival needs, and the partner logos the sponsors paid to see. `variant:
 * "end"` is the same headline centred with the facts dropped — by then the
 * details are behind the audience, not ahead of it.
 */
export function TitleSlideLayout({ slide }: { slide: TitleSlide }) {
  const isEnd = slide.variant === "end";
  const { lead, tail } = splitHeadline(slide.title);
  const meta = isEnd ? [] : (slide.meta ?? []);
  const logos = slide.logos ?? [];

  return (
    <>
      <div className="deck-burst" aria-hidden="true" />

      <div className="deck-safe">
        <div
          className={cn(
            "deck-content flex min-h-0 flex-1 flex-col",
            isEnd && "items-center text-center",
          )}
          style={{ gap: "var(--deck-gap-md)" }}
        >
          {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col justify-center",
              isEnd && "items-center",
            )}
            style={{ gap: "var(--deck-gap-sm)" }}
          >
            <h1 className="deck-display">
              {lead && <span>{lead} </span>}
              <span className="deck-accent">{tail}</span>
            </h1>
            {slide.subtitle && (
              <p className={cn("deck-lead", isEnd && "mx-auto")}>{slide.subtitle}</p>
            )}
          </div>

          {meta.length > 0 && (
            <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
              <hr className="deck-rule" />
              <div
                className="flex flex-wrap items-center"
                style={{ gap: "var(--deck-gap-md)" }}
              >
                {meta.map((fact, index) => (
                  <Fragment key={fact}>
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          inlineSize: 2,
                          blockSize: 30,
                          background: "var(--slide-hairline)",
                        }}
                      />
                    )}
                    <span className="deck-label" style={{ color: "var(--slide-ink)" }}>
                      {fact}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {logos.length > 0 && (
            <div
              className={cn("flex flex-wrap items-center", isEnd && "justify-center")}
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              {logos.map((logo) => (
                <div
                  key={logo.name}
                  className="deck-logo-chip"
                  style={{ inlineSize: 210, blockSize: 96 }}
                >
                  <DeckImage
                    image={{ src: logo.logo, alt: logo.name }}
                    fit="contain"
                    priority
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
