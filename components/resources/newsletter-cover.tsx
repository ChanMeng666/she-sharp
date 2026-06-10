import { cn } from "@/lib/utils";
import {
  MONTH_COVER_LABELS,
  NEWSLETTER_COVER_THEMES,
} from "@/types/newsletter";

interface NewsletterCoverProps {
  month: number;
  year: number;
  /** Position-based index used to rotate through the cover color palette. */
  themeIndex: number;
  /** Optional explicit theme override (wins over themeIndex). */
  theme?: number;
  className?: string;
}

/**
 * Renders a newsletter cover entirely in CSS/SVG — the She Sharp bracket motif
 * with the month spelled out between oversized parentheses and the year below.
 * No image assets are required; new issues only need month/year data.
 */
export function NewsletterCover({
  month,
  year,
  themeIndex,
  theme,
  className,
}: NewsletterCoverProps) {
  const palette =
    NEWSLETTER_COVER_THEMES[
      (theme ?? themeIndex) % NEWSLETTER_COVER_THEMES.length
    ];
  const label = MONTH_COVER_LABELS[month] ?? "";

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{ backgroundColor: palette.bg, containerType: "inline-size" }}
      aria-hidden="true"
    >
      <div className="flex h-full w-full items-center justify-center gap-[5%] px-[8%]">
        <Bracket side="left" color={palette.fg} />

        <div className="flex flex-col items-center leading-none">
          <span
            className="font-black tracking-tight text-[clamp(1.5rem,11cqw,5rem)]"
            style={{ color: palette.fg }}
          >
            {label}
          </span>
          <span
            className="mt-[10%] font-black tracking-[0.18em] text-[clamp(0.65rem,3.4cqw,1.5rem)]"
            style={{ color: palette.fg }}
          >
            {year}
          </span>
        </div>

        <Bracket side="right" color={palette.fg} />
      </div>
    </div>
  );
}

/** A single oversized parenthesis with flat-cut ends, matching the legacy art. */
function Bracket({ side, color }: { side: "left" | "right"; color: string }) {
  // Cubic Bézier with control points pushed outward for a fuller, rounder bow.
  const d =
    side === "left"
      ? "M46,16 C4,92 4,208 46,284"
      : "M14,16 C56,92 56,208 14,284";
  return (
    <svg
      viewBox="0 0 60 300"
      className="h-[56%] w-auto shrink-0"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={d} stroke={color} strokeWidth="20" strokeLinecap="butt" />
    </svg>
  );
}
