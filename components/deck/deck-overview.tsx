"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { CSSProperties } from "react";

import type { Deck, Slide } from "@/lib/deck/types";
import { groupSlides, slideLabel, toneOf } from "@/lib/deck/utils";
import { cn } from "@/lib/utils";

export interface DeckOverviewProps {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Zero-based index of the slide on screen, highlighted in the grid. */
  currentIndex: number;
  /** Called with the chosen index; the viewport jumps and closes the panel. */
  onSelect: (index: number) => void;
}

/** Small swatch showing whether a slide is drawn on the dark or light canvas. */
function ToneDot({ slide }: { slide: Slide }) {
  const tone = toneOf(slide);
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/40"
      style={{ background: tone === "dark" ? "#0b0a14" : "#ffffff" }}
    />
  );
}

/**
 * The "we're running late, what can I skip" panel.
 *
 * Radix Dialog gives the focus trap, the scroll lock and Escape-to-close, the
 * same way `components/ui/lightbox.tsx` uses it. Slides are grouped by their
 * `section` so the host reads chapters rather than 35 numbered tiles, and an
 * `optional` slide is drawn with a dashed outline plus a literal "optional"
 * tag: the flag only earns its place if it is legible at a glance from a lectern.
 *
 * Deliberately text-only — no slide thumbnails. Rendering 35 scaled stages
 * behind a dialog costs more than it tells you, and the title is what the host
 * is actually scanning for.
 */
export function DeckOverview({
  deck,
  open,
  onOpenChange,
  currentIndex,
  onSelect,
}: DeckOverviewProps) {
  const groups = groupSlides(deck.slides);
  const total = deck.slides.length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/90" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[70] flex flex-col bg-[#0b0a14] text-white focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight">
                {deck.title}
              </DialogPrimitive.Title>
              <p className="text-[12px] text-white/55">
                {total} slides &middot; click one to jump there
              </p>
            </div>
            <DialogPrimitive.Close
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/75 transition-colors hover:border-white/45 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close the slide overview"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {groups.map((group, groupIndex) => (
              <section
                key={`${group.section}-${groupIndex}`}
                className={cn(groupIndex > 0 && "mt-8")}
              >
                {group.section && (
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    {group.section}
                  </h2>
                )}

                <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                  {group.slides.map(({ slide, index }) => {
                    const isCurrent = index === currentIndex;
                    return (
                      <li key={slide.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(index)}
                          aria-current={isCurrent ? "true" : undefined}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                            slide.optional
                              ? "border border-dashed border-white/35 hover:border-white/60"
                              : "border border-white/10 bg-white/5 hover:bg-white/10",
                            isCurrent && "border-solid",
                          )}
                          // The accent is per-deck data, so the "you are here"
                          // highlight cannot be a static utility class.
                          style={
                            isCurrent
                              ? ({
                                  borderColor: deck.theme.accent.onDark,
                                  background: `color-mix(in srgb, ${deck.theme.accent.onDark} 22%, transparent)`,
                                } as CSSProperties)
                              : undefined
                          }
                        >
                          <span className="mt-0.5 w-7 shrink-0 text-[12px] font-semibold tabular-nums text-white/55">
                            {index + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <ToneDot slide={slide} />
                              <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
                                {slideLabel(slide)}
                              </span>
                            </span>

                            <span className="mt-1.5 flex items-center gap-2">
                              <span className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                                {slide.type}
                              </span>
                              {slide.optional && (
                                <span className="rounded-full border border-dashed border-white/50 px-2 py-px text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
                                  optional
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
