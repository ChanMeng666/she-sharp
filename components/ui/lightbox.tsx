"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LightboxProps {
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * useLightbox — small controlled-state helper for photo grids.
 *
 * Returns the props a grid needs to open the Lightbox at a given tile and the
 * controlled state to spread onto <Lightbox />.
 */
export function useLightbox(images: LightboxImage[]) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const openAt = React.useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
  }, []);

  return {
    images,
    open,
    index,
    openAt,
    onOpenChange: setOpen,
    onIndexChange: setIndex,
  };
}

/**
 * Lightbox — full-screen photo viewer for event galleries.
 *
 * Built on Radix Dialog (focus trap, scroll lock, Escape-to-close come for
 * free). Left/right arrow keys and on-screen buttons page through the set;
 * under reduced motion the crossfade/zoom is dropped.
 */
export function Lightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: LightboxProps) {
  const reduceMotion = useReducedMotion();
  const count = images.length;

  const go = React.useCallback(
    (delta: number) => {
      if (count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  // Arrow-key navigation while the viewer is open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const current = images[index];
  if (!current) return null;

  const circleButton =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col focus:outline-none"
          aria-label="Event photo viewer"
        >
          <DialogPrimitive.Title className="sr-only">
            Event photos
          </DialogPrimitive.Title>

          {/* Top bar: counter + close */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <span className="text-[13px] font-medium tabular-nums text-mint">
              {index + 1} / {count}
            </span>
            <DialogPrimitive.Close
              className={circleButton}
              aria-label="Close photo viewer"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
            {count > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className={cn(circleButton, "absolute left-3 z-10 sm:left-6")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <motion.img
              key={current.src}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              }
              className="max-h-[85vh] max-w-full rounded-[16px] object-contain"
            />

            {count > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className={cn(circleButton, "absolute right-3 z-10 sm:right-6")}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Caption */}
          {current.alt && (
            <div className="px-4 pb-6 text-center sm:px-16">
              <p className="mx-auto max-w-3xl text-[13px] leading-relaxed text-white/70">
                {current.alt}
              </p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
