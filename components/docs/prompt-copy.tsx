"use client";

import { useEffect } from "react";

/**
 * Puts a copy button on every prompt block on the playbook page.
 *
 * The page is a list of short sections, and almost every one of them ends in a
 * fenced block of words the reader is meant to paste into Cursor whole.
 * Selecting one by hand is where that goes wrong: the blocks are hard-wrapped
 * prose, a drag-select on a phone catches the paragraph above, and a prompt
 * copied with its first line missing fails in a way the reader has no way to
 * diagnose. One button removes the whole class of mistake.
 *
 * Like `MermaidRenderer`, this is DOM-driven rather than prop-driven: the
 * blocks are produced by `scripts/docs/build-playbook.mts` and injected as a
 * string, so React never owns them. The `.playbook-prompt` wrapper each button
 * hangs off is emitted at build time, not created here — a script that built
 * its own container would reflow every block on the page at hydration, under
 * the reader, on exactly the elements they were reaching for.
 */

/** How long the button stays changed after a click, in ms. */
const RESET_MS = 2000;

export function PromptCopyButtons() {
  useEffect(() => {
    // Degrade silently. `navigator.clipboard` is undefined on any non-secure
    // origin — which includes a laptop serving this page to a phone over the
    // LAN, a plausible way for an organiser to read it. No button is a page
    // that still works; a button that does nothing is a page that looks broken.
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    const buttons: HTMLButtonElement[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();

    for (const wrapper of document.querySelectorAll<HTMLElement>(
      ".playbook-prompt",
    )) {
      const pre = wrapper.querySelector("pre");
      if (!pre) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "playbook-copy";
      button.textContent = "Copy";
      // No `aria-label`: it would freeze the accessible name at "Copy", and the
      // confirmation the sighted reader gets from the label changing is the
      // only confirmation there is. `aria-live` announces the change instead.
      button.setAttribute("aria-live", "polite");

      const flash = (label: string) => {
        button.textContent = label;
        const timer = setTimeout(() => {
          button.textContent = "Copy";
          timers.delete(timer);
        }, RESET_MS);
        timers.add(timer);
      };

      button.addEventListener("click", () => {
        // `textContent`, not `innerText`: the block is `white-space: pre` and
        // its line breaks are load-bearing — the prompts are hard-wrapped
        // prose. `innerText` is rendering-aware and would fold them.
        // The trailing newline is the fence's, not the author's.
        const text = (pre.textContent ?? "").replace(/\n+$/, "");
        void navigator.clipboard.writeText(text).then(
          () => flash("Copied"),
          // A rejection here is a permission the reader cannot grant from the
          // page. Say so plainly and leave the text where it is to select.
          () => flash("Copy failed"),
        );
      });

      wrapper.appendChild(button);
      buttons.push(button);
    }

    return () => {
      for (const timer of timers) clearTimeout(timer);
      for (const button of buttons) button.remove();
    };
  }, []);

  return null;
}
