"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, Trash2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Opt-in navigation debug overlay.
 *
 * Visible only when the URL carries `?debug=nav`, so it never shows for normal
 * visitors. It records a timestamped ring buffer of the events that matter when
 * diagnosing why a top-nav dropdown click "won't navigate": pointer/click events
 * on nav links (and whether the click was preventDefault-ed), committed route
 * changes, dropdown open/close transitions, and the viewport width. A one-click
 * "Copy" button puts the whole log on the clipboard to share for debugging.
 *
 * Gating is derived from `window.location.search` inside an effect rather than
 * `useSearchParams()` — under Partial Prerendering the latter can read empty
 * during hydration, which left the listeners unattached.
 */

type LogEntry = { t: string; kind: string; detail: string };

const MAX_ENTRIES = 200;

function stamp(): string {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
    d.getMilliseconds(),
    3
  )}`;
}

export function NavDebugPanel() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-evaluate gating from the real URL. Runs on mount and whenever the route
  // changes, so a false->true transition reliably re-triggers the listener effect.
  useEffect(() => {
    setEnabled(
      new URLSearchParams(window.location.search).get("debug") === "nav"
    );
  }, [pathname]);

  // Single append helper kept stable so listeners can be attached once.
  const log = useCallback((kind: string, detail: string) => {
    setEntries((prev) => {
      const next = [...prev, { t: stamp(), kind, detail }];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }, []);

  // Attach DOM listeners that observe nav interactions and menu state.
  useEffect(() => {
    if (!enabled) return;

    const linkInfo = (target: EventTarget | null): { href: string } | null => {
      const el = target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return null;
      // Only care about links that live inside the header.
      if (!a.closest("header")) return null;
      return { href: a.getAttribute("href") || "" };
    };

    const onPointerDown = (e: PointerEvent) => {
      const info = linkInfo(e.target);
      if (info) log("pointerdown", `${info.href}  (${e.pointerType})`);
    };
    const onPointerUp = (e: PointerEvent) => {
      const info = linkInfo(e.target);
      if (info) log("pointerup", info.href);
    };
    // Bubble phase on document runs after React/Link handlers, so
    // `defaultPrevented` reflects whether navigation was intercepted.
    const onClick = (e: MouseEvent) => {
      const info = linkInfo(e.target);
      if (info) {
        log("click", `${info.href}  defaultPrevented=${e.defaultPrevented}`);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("click", onClick, false);

    // Observe Radix dropdown open/close via the trigger's data-state attribute.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== "attributes" || m.attributeName !== "data-state") continue;
        const el = m.target as HTMLElement;
        if (el.getAttribute("data-slot") !== "navigation-menu-trigger") continue;
        const name = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
        log("menu", `${name || "?"} -> ${el.getAttribute("data-state")}`);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });

    const onResize = () => log("resize", `width=${window.innerWidth}px`);
    window.addEventListener("resize", onResize);

    log("init", `width=${window.innerWidth}px  ua=${navigator.userAgent.slice(0, 40)}`);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("click", onClick, false);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [enabled, log]);

  // Log each committed route change while enabled.
  useEffect(() => {
    if (!enabled) return;
    log("route", `pathname=${pathname}`);
  }, [enabled, pathname, log]);

  // Keep the newest entry in view.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleCopy = useCallback(async () => {
    const text = entries.map((e) => `${e.t} | ${e.kind} | ${e.detail}`).join("\n");
    try {
      await navigator.clipboard.writeText(text || "(no events captured yet)");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail without a user gesture / permission; ignore.
    }
  }, [entries]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 left-3 z-[100] w-[340px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-purple-dark/30 bg-white/95 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-dark"
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", collapsed && "-rotate-90")}
          />
          Nav Debug
          <span className="font-normal text-muted-foreground">({entries.length})</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-purple-dark px-2 py-1 text-[11px] font-medium text-white hover:opacity-90"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setEntries([])}
            className="flex items-center gap-1 rounded-md border border-black/15 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-black/5"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          ref={scrollRef}
          className="max-h-[260px] overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-relaxed text-foreground"
        >
          {entries.length === 0 ? (
            <p className="text-muted-foreground">
              Interact with the top nav to capture events…
            </p>
          ) : (
            entries.map((e, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                <span className="text-muted-foreground">{e.t}</span>{" "}
                <span className="font-semibold text-purple-dark">{e.kind}</span>{" "}
                {e.detail}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
