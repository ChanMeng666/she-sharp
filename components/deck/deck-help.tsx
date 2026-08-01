"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export interface DeckHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Every binding the viewport listens for, in the order a host learns them. */
const BINDINGS: { keys: string; action: string }[] = [
  { keys: "→  ↓  Page Down  Enter", action: "Next slide" },
  { keys: "Space", action: "Next slide — except on a break slide" },
  { keys: "←  ↑  Page Up  Backspace", action: "Previous slide" },
  { keys: "Home / End", action: "First / last slide" },
  { keys: "F", action: "Full screen on and off" },
  { keys: "O", action: "Overview — jump to any slide" },
  { keys: "B", action: "Blackout the screen; any key brings it back" },
  { keys: "?", action: "This list" },
  { keys: "Escape", action: "Close overview, then help, then blackout" },
  { keys: "Click / tap", action: "Next slide; the left quarter goes back" },
  { keys: "Swipe", action: "Left for next, right for previous" },
];

/**
 * Keyboard reference, opened with `?`.
 *
 * Exists because the one thing a host cannot do mid-talk is read documentation:
 * the shortcuts have to be reachable from inside the deck, in one keystroke,
 * without leaving the slide that is on the projector.
 */
export function DeckHelp({ open, onOpenChange }: DeckHelpProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/80" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[80] w-[min(620px,calc(100vw-32px))] max-h-[calc(100vh-64px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-[#0b0a14] p-6 text-white shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight">
                Presenter controls
              </DialogPrimitive.Title>
              <p className="mt-1 text-[12px] text-white/55">
                Press <kbd className="font-sans font-semibold text-white/80">?</kbd>{" "}
                any time to bring this back.
              </p>
            </div>
            <DialogPrimitive.Close
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/75 transition-colors hover:border-white/45 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close the controls list"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <table className="w-full border-collapse text-left">
            <tbody>
              {BINDINGS.map((binding) => (
                <tr
                  key={binding.keys}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <th
                    scope="row"
                    className="w-[46%] py-2.5 pr-4 align-top text-[12px] font-semibold text-white/85"
                  >
                    {binding.keys}
                  </th>
                  <td className="py-2.5 align-top text-[12px] text-white/65">
                    {binding.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[12px] leading-relaxed text-white/70">
            On a <strong className="font-semibold text-white/90">break</strong>{" "}
            slide, Space starts and pauses the countdown and does{" "}
            <strong className="font-semibold text-white/90">not</strong> advance
            the deck. Use the arrow keys to move on.
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
