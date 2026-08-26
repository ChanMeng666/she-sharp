/**
 * Live ticket status for an upcoming event, fetched from the browser.
 *
 * Why a client-side fetch rather than a server read: the public site is
 * statically prerendered, and `/events/[slug]` builds ~97 pages at build time
 * (CLAUDE.md §"Rendering: keep the root layout static"). Reading Humanitix on
 * the server would either freeze a sold-out flag into the HTML at build time or
 * force the whole page dynamic. So the page ships exactly as it does today and
 * this hook layers the live bit on afterwards.
 *
 * No `"use client"` directive, matching `hooks/use-media-query.ts`: every
 * consumer is already a client component, so the directive would be noise.
 */

import { useEffect, useState } from "react";

/**
 * What the ticket page is doing right now, in the only terms the UI needs.
 *
 * Deliberately **not** a count. `docs/development/CONTENT_RULES.md` defines
 * `event.attendees` as a historical registrations snapshot, and no live number —
 * tickets left, capacity, headcount — may reach the page. Three booleans in,
 * one word out.
 *
 * `"unknown"` is the safe value and the default: it means "render the page
 * exactly as it renders without this hook".
 */
export type TicketStatus =
  | "on-sale"
  | "sold-out"
  | "closed"
  | "unpublished"
  | "unknown";

/** Status per **site** event slug (not the Humanitix slug). */
export type TicketStatusMap = Record<string, TicketStatus>;

/** The one endpoint that knows how to join site slugs to Humanitix events. */
const TICKET_STATUS_ENDPOINT = "/api/events/ticket-status";

/** Narrows an arbitrary JSON value to a status, defaulting to `"unknown"`. */
function asTicketStatus(value: unknown): TicketStatus {
  return value === "on-sale" ||
    value === "sold-out" ||
    value === "closed" ||
    value === "unpublished"
    ? value
    : "unknown";
}

/**
 * Resolves the live ticket status for one event slug.
 *
 * Every failure path — offline, non-2xx, malformed body, unmount mid-flight —
 * leaves the value at `"unknown"`, because a wrong "Sold out" is worse than no
 * badge at all: it turns people away from an event they could still attend.
 *
 * @param slug - The site event slug, or `null`/`undefined` to skip the request
 *   entirely (past events have nothing to sell).
 * @returns The status; `"unknown"` until the response lands, and after any
 *   failure.
 */
export function useTicketStatus(slug: string | null | undefined): TicketStatus {
  const [status, setStatus] = useState<TicketStatus>("unknown");

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    // Fire-and-forget: nothing on the page waits for this, and the catch is the
    // whole error policy — stay "unknown" and say nothing.
    void (async () => {
      try {
        const res = await fetch(TICKET_STATUS_ENDPOINT, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body: unknown = await res.json();
        if (!body || typeof body !== "object") return;
        const next = asTicketStatus((body as Record<string, unknown>)[slug]);
        if (next !== "unknown") setStatus(next);
      } catch {
        // Aborted, offline, or unparseable. "unknown" already covers it.
      }
    })();

    return () => controller.abort();
  }, [slug]);

  return status;
}
