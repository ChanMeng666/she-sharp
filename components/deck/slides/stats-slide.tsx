import { DeckImage } from "@/components/deck/deck-image";
import type { StatsSlide } from "@/lib/deck/types";

/**
 * The credibility slide: the one figure that says how big this thing is, and
 * the two or three that qualify it.
 *
 * Shown while a host introduces She Sharp to a room that has mostly never heard
 * of it — "3000+ members" lands in four seconds and a paragraph does not. The
 * first figure takes `.deck-stat` alone and the rest take `.deck-stat-minor`,
 * because four numbers at the same size are four numbers nobody remembers. Every
 * value is display-ready in the data, so the layout never formats a number and
 * never invents one.
 */
export function StatsSlideLayout({ slide }: { slide: StatsSlide }) {
  const [hero, ...rest] = slide.stats;

  return (
    <div className="deck-safe">
      <div className="deck-content flex flex-1" style={{ gap: "var(--deck-gap-xl)" }}>
        <div
          className="flex flex-1 flex-col justify-center"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
            <h2 className="deck-title">{slide.title}</h2>
            {slide.lead && <p className="deck-lead">{slide.lead}</p>}
          </div>

          {hero && (
            <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
              {/* The annotation sits on the hero figure's baseline, not under
                  it: it is an aside about that number, and a script line on its
                  own row reads as a second heading instead. */}
              <div
                className="flex flex-wrap items-end"
                style={{ columnGap: "var(--deck-gap-md)" }}
              >
                <p className="deck-stat deck-accent">{hero.value}</p>
                {slide.annotation && (
                  <p className="deck-eyebrow">{slide.annotation}</p>
                )}
              </div>
              <p className="deck-label" style={{ color: "var(--slide-ink)" }}>
                {hero.label}
              </p>
              {hero.detail && <p className="deck-body deck-muted">{hero.detail}</p>}
            </div>
          )}

          {rest.length > 0 && (
            <>
              <hr className="deck-rule" />
              {/* auto-fit rather than a fixed column count: the subordinate
                  figures sit in one row on a 16:9 or 21:9 stage and fold to two
                  on a 4:3 projector, or beside the plate, with no breakpoint. */}
              <ul
                className="grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  columnGap: "var(--deck-gap-lg)",
                  rowGap: "var(--deck-gap-md)",
                }}
              >
                {rest.map((stat) => (
                  <li
                    key={stat.label}
                    className="flex flex-col"
                    style={{ gap: "var(--deck-gap-xs)" }}
                  >
                    <p className="deck-stat-minor">{stat.value}</p>
                    <p className="deck-label">{stat.label}</p>
                    {stat.detail && (
                      <p className="deck-body deck-muted">{stat.detail}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {slide.image && (
          /* A single subject photograph, so it keeps its colour. Hidden on
             narrow stages so the figures keep the width they need. */
          <div
            className="deck-frame deck-full-colour self-stretch @max-[1560px]/deck:hidden"
            style={{ flex: "0 0 40%" }}
          >
            <DeckImage image={slide.image} />
          </div>
        )}
      </div>
    </div>
  );
}
