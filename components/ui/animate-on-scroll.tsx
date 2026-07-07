"use client";

/**
 * Back-compat shim.
 *
 * AnimateOnScroll is now a thin wrapper over <Reveal> (components/ui/reveal.tsx)
 * so the ~30 existing call sites keep working unchanged while adopting the new
 * flash-free entrance behavior. Prefer importing `Reveal` directly in new code.
 */
import { Reveal, type RevealProps } from "@/components/ui/reveal";

export type AnimateOnScrollProps = RevealProps;

export function AnimateOnScroll(props: RevealProps) {
  return <Reveal {...props} />;
}

export { Reveal };
