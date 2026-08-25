"use client";

import { useScrollToHash } from "@/hooks/use-scroll-to-hash";

/**
 * ScrollToHash — the client half of a page that is otherwise server-rendered.
 *
 * `/about` used to carry `"use client"` at the page level for this one hook,
 * which put the whole page inside the client boundary and made it impossible
 * for the timeline to read `lib/data/events` (about 960 KB of event JSON that
 * has no business in a browser bundle). Rendering this instead keeps the hook
 * and moves everything else back to the server.
 */
export function ScrollToHash() {
  useScrollToHash();
  return null;
}
