/**
 * Static registry of monthly newsletter issue fixtures.
 *
 * Next.js only bundles JSON imported by a static path, so each issue is
 * imported explicitly and mapped by its "YYYY-MM" id. When a new issue ships,
 * add ONE import line and ONE map entry below (same spirit as
 * `lib/data/newsletters-manual.ts`).
 */

import { newsletterIssueSchema, type NewsletterIssueData } from "./schema";

import issue2026_06 from "@/lib/data/json/newsletter-issues/2026-06.json";
import issue2026_07 from "@/lib/data/json/newsletter-issues/2026-07.json";
import issue2026_08 from "@/lib/data/json/newsletter-issues/2026-08.json";
import issue2026_09 from "@/lib/data/json/newsletter-issues/2026-09.json";

const ISSUES: Record<string, unknown> = {
  "2026-06": issue2026_06,
  "2026-07": issue2026_07,
  "2026-08": issue2026_08,
  "2026-09": issue2026_09,
};

/** Returns the validated issue for `id`, or null when unknown/invalid-id. */
export function getIssue(id: string): NewsletterIssueData | null {
  const raw = ISSUES[id];
  if (!raw) return null;
  return newsletterIssueSchema.parse(raw);
}

/** All registered issue ids (unsorted). */
export function listIssueIds(): string[] {
  return Object.keys(ISSUES);
}
