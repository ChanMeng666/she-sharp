import { DeckImage } from "@/components/deck/deck-image";
import type { StatsSlide } from "@/lib/deck/types";

/**
 * The credibility slide: three or four figures that say how big this thing is.
 *
 * Shown while a host introduces She Sharp to a room that has mostly never heard
 * of it — "3000+ members, 94 events since 2014" lands in four seconds and a
 * paragraph does not. Every figure is display-ready in the data, so the layout
 * never formats a number and never invents one.
 */
export function StatsSlideLayout({ slide }: { slide: StatsSlide }) {
  return (
    <div className="deck-safe">
      <div
        className="deck-content flex min-h-0 flex-1"
        style={{ gap: "var(--deck-gap-xl)" }}
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}
            <h2 className="deck-title">{slide.title}</h2>
            {slide.lead && <p className="deck-lead">{slide.lead}</p>}
          </div>

          {/* auto-fit rather than a fixed column count: four figures sit in one
              row on a 16:9 or 21:9 stage and fold to two rows on a 4:3
              projector, or beside the plate, without a breakpoint. */}
          <ul
            className="grid min-h-0 flex-1 content-center"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              columnGap: "var(--deck-gap-lg)",
              rowGap: "var(--deck-gap-lg)",
            }}
          >
            {slide.stats.map((stat) => (
              <li
                key={stat.label}
                className="flex flex-col"
                style={{ gap: "var(--deck-gap-xs)" }}
              >
                <p className="deck-stat deck-accent">{stat.value}</p>
                <p className="deck-label" style={{ color: "var(--slide-ink)" }}>
                  {stat.label}
                </p>
                {stat.detail && <p className="deck-body deck-muted">{stat.detail}</p>}
              </li>
            ))}
          </ul>
        </div>

        {slide.image && (
          <div
            className="self-stretch overflow-hidden @max-[1560px]/deck:hidden"
            style={{ flex: "0 0 40%", borderRadius: "var(--deck-radius)" }}
          >
            <DeckImage image={slide.image} />
          </div>
        )}
      </div>
    </div>
  );
}
