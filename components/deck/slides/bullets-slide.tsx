import { DeckImage } from "@/components/deck/deck-image";
import type { BulletsSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * The marker that sits on the leading edge of a bullet.
 *
 * Three flavours because the three jobs are different: a checklist is a set of
 * things the audience must do, a numbered list is an order they must follow,
 * and a plain list is neither.
 */
function BulletMarker({ variant, index }: { variant: string; index: number }) {
  if (variant === "checklist") {
    return (
      <svg
        width={40}
        height={40}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--slide-accent)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0, marginBlockStart: 4 }}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (variant === "numbered") {
    return (
      <span
        aria-hidden="true"
        className="deck-subtitle deck-accent deck-tabular"
        style={{ flexShrink: 0, minInlineSize: 56, lineHeight: 1.1 }}
      >
        {index + 1}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        inlineSize: 44,
        blockSize: 4,
        marginBlockStart: 22,
        background: "var(--slide-accent)",
      }}
    />
  );
}

/**
 * The workhorse content slide: a claim and up to five short supports.
 *
 * Used for house rules, "what happens next", and the handful of things a host
 * says out loud and then wants left on screen while people act on them. The
 * linter caps it at five bullets of ten words because anything longer is a
 * document, and a document belongs behind the QR slide instead.
 */
export function BulletsSlideLayout({ slide }: { slide: BulletsSlide }) {
  const variant = slide.variant ?? "plain";
  const twoColumns = slide.columns === 2;

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex min-h-0 flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div
          className="flex min-h-0 flex-1 items-start"
          style={{ gap: "var(--deck-gap-xl)" }}
        >
          <ul
            className={cn(
              "grid flex-1",
              twoColumns
                ? "grid-cols-2 @max-[1560px]/deck:grid-cols-1"
                : "grid-cols-1",
            )}
            style={{ columnGap: "var(--deck-gap-xl)", rowGap: "var(--deck-gap-md)" }}
          >
            {slide.items.map((item, index) => (
              <li
                key={item}
                className="flex items-start"
                style={{ gap: "var(--deck-gap-sm)" }}
              >
                <BulletMarker variant={variant} index={index} />
                <span className="deck-bullet">{item}</span>
              </li>
            ))}
          </ul>

          {slide.image && (
            /* Hidden on narrow stages so the text keeps its measure rather than
               being squeezed into a column nobody can read from row ten. */
            <div
              className="self-stretch overflow-hidden @max-[1600px]/deck:hidden"
              style={{
                flex: "0 0 38%",
                borderRadius: "var(--deck-radius)",
                minBlockSize: 420,
              }}
            >
              <DeckImage image={slide.image} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
