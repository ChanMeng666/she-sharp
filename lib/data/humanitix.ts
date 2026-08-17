/**
 * The Humanitix ticketing archive: typed access, and the normalisation rules
 * the offline builder and the app must agree on.
 *
 * She Sharp has sold tickets through Humanitix since 2020. The raw exports
 * carry names, addresses, dates of birth and live access codes, so they live in
 * a gitignored vault; what is committed under `lib/data/json/humanitix/` is
 * aggregate-only and safe. This module is the single place that reads it.
 *
 * The normalisation functions live here rather than in `scripts/` for the same
 * reason `lib/email/hash.ts` does: the builder and anything reading the archive
 * must derive the same instance key and the same segment from the same string.
 * If they ever diverged, one event would silently become two, and the totals
 * would stay plausible while being wrong.
 *
 * Read `docs/development/HUMANITIX_ARCHIVE.md` before quoting any number from
 * here. Two traps in particular: Humanitix holds nothing before 2020, and 25 of
 * the 62 instances never ran a check-in at all, so a check-in rate computed
 * across everything is wrong by construction.
 */
import aggregatesJson from "./json/humanitix/aggregates.json";
import crosswalkJson from "./json/humanitix/crosswalk.json";
import eventsJson from "./json/humanitix/events.json";
import manifestJson from "./json/humanitix/manifest.json";
import organisationsJson from "./json/humanitix/organisations.json";
import segmentsJson from "./json/humanitix/segments.json";

import type {
  HumanitixAggregates,
  HumanitixCrosswalk,
  HumanitixEventInstance,
  HumanitixEvents,
  HumanitixManifest,
  HumanitixOrganisations,
  HumanitixSegments,
} from "@/types/humanitix";

export const humanitixManifest = manifestJson as unknown as HumanitixManifest;
export const humanitixEvents = eventsJson as unknown as HumanitixEvents;
export const humanitixAggregates = aggregatesJson as unknown as HumanitixAggregates;
export const humanitixCrosswalk = crosswalkJson as unknown as HumanitixCrosswalk;
export const humanitixSegments = segmentsJson as unknown as HumanitixSegments;
export const humanitixOrganisations =
  organisationsJson as unknown as HumanitixOrganisations;

// ============================================
// Normalisation — shared with scripts/humanitix/
// ============================================

/**
 * Cleans a Humanitix event or ticket-type string for comparison.
 *
 * Humanitix preserves whatever was typed into the event editor, which over six
 * years has included leading spaces, doubled internal spaces, and — in two 2020
 * ticket types — a stray byte-order mark in the middle of the string. Left
 * alone, those produce distinct keys for what is plainly one event.
 */
export function normalizeHumanitixText(raw: string): string {
  return raw
    .replace(/﻿/g, "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

/** Slug body for an instance key: lowercase, alphanumerics and single dashes. */
export function slugifyHumanitixName(name: string): string {
  return normalizeHumanitixText(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The canonical key for one (event, date) instance: `2026-05-05--her-waka-may-2026`.
 *
 * Not the Humanitix Event ID, which exists only in the payout report and covers
 * 39 of 62 instances — it cannot be a primary key, so it is carried as an
 * attribute instead. Date first so the file sorts chronologically, and because
 * two events genuinely share a name in different years.
 */
export function humanitixInstanceKey(eventName: string, isoDate: string): string {
  return `${isoDate}--${slugifyHumanitixName(eventName)}`;
}

/**
 * Maps a raw ticket-type string to an audience segment via `segments.json`.
 *
 * Returns null when no rule matches, and the caller decides what that means.
 * The builder treats it as fatal: an unclassified ticket type is a new kind of
 * ticket nobody has looked at, and silently bucketing it as "other" would let
 * the audience mix drift without anyone noticing.
 */
export function resolveSegment(
  ticketType: string,
  segments: HumanitixSegments = humanitixSegments
): string | null {
  const needle = normalizeHumanitixText(ticketType).toLowerCase();

  for (const rule of segments.rules) {
    switch (rule.match) {
      case "exact":
        if (needle === rule.pattern) return rule.segment;
        break;
      case "prefix":
        if (needle.startsWith(rule.pattern)) return rule.segment;
        break;
      case "contains":
        if (needle.includes(rule.pattern)) return rule.segment;
        break;
      case "regex":
        if (new RegExp(rule.pattern).test(needle)) return rule.segment;
        break;
    }
  }
  return null;
}

/** The declared label for a segment id, or the id itself if undeclared. */
export function segmentLabel(
  id: string,
  segments: HumanitixSegments = humanitixSegments
): string {
  return segments.segments.find((segment) => segment.id === id)?.label ?? id;
}

/**
 * Maps a self-reported employer string to a canonical organisation id.
 *
 * Returns null for the strings that mean "did not answer" — blank, `NA`, `-`
 * and friends, 47 of which are literally the two letters "NA". Those are not an
 * organisation and must not be counted as one.
 *
 * Unlisted strings become their own id, so the count of distinct organisations
 * is honest about the long tail rather than collapsing it.
 */
export function canonicalOrganisationId(
  raw: string,
  organisations: HumanitixOrganisations = humanitixOrganisations
): string | null {
  const cleaned = normalizeHumanitixText(raw);
  if (!cleaned) return null;

  const compare = (value: string) =>
    organisations.matching.stripPunctuation
      ? value.toLowerCase().replace(/[^a-z0-9]+/g, "")
      : value.toLowerCase();

  // "Student, AUT", "Student - UoA", "Student at Massey" and "AcademyEx Student"
  // all name an institution that is genuinely represented; the word says what
  // the person does there, not who they belong to. Stripping it generally beats
  // listing every combination, which is a list that only ever grows.
  const withoutStudent = cleaned
    .replace(/^students?\s*[,\-–—:]\s*|^students?\s+at\s+/i, "")
    .replace(/\s*[,\-–—:]?\s*students?$/i, "")
    .trim();

  const candidates =
    organisations.matching.stripStudentPrefix && withoutStudent !== cleaned
      ? [cleaned, withoutStudent]
      : [cleaned];

  for (const candidate of candidates) {
    const needle = compare(candidate);
    if (!needle) continue;

    if (organisations.nullish.some((value) => compare(value) === needle)) {
      return null;
    }
    for (const entry of organisations.canonical) {
      if (entry.aliases.some((alias) => compare(alias) === needle)) {
        return entry.id;
      }
    }
  }

  const final = candidates[candidates.length - 1];
  return compare(final) ? slugifyHumanitixName(final) : null;
}

/**
 * A comparison key for a person's name: lowercase, alphanumerics only.
 *
 * Used to catch the attendees who typed their own name into the checkout's
 * Company/Organisation box. Six of them did, and each one would otherwise be
 * counted as an organisation and — far worse — printed by name in the funder
 * report's "largest organisations represented" table. Comparing against the
 * names actually present in the export makes that a test rather than a hunch.
 */
export function personNameKey(first: string, last: string): string {
  const strip = (value: string) =>
    normalizeHumanitixText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  return strip(first) + strip(last);
}

/**
 * True when an employer string is really somebody's own name.
 *
 * A string that a canonical entry claims is exempt: "She Sharp" collides with a
 * registrant's name and is unambiguously the organisation.
 */
export function isPersonalName(
  raw: string,
  personNameKeys: ReadonlySet<string>,
  organisations: HumanitixOrganisations = humanitixOrganisations
): boolean {
  const id = canonicalOrganisationId(raw, organisations);
  if (!id) return false;
  if (organisations.canonical.some((entry) => entry.id === id)) return false;
  return personNameKeys.has(
    normalizeHumanitixText(raw)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
  );
}

// ============================================
// Accessors
// ============================================

/** Every (event, date) instance, in chronological order. */
export function getHumanitixInstances(): HumanitixEventInstance[] {
  return humanitixEvents.instances;
}

export function getHumanitixInstanceByKey(
  key: string
): HumanitixEventInstance | undefined {
  return humanitixEvents.instances.find((instance) => instance.key === key);
}

/**
 * The instances belonging to one site event slug.
 *
 * Returns an array, not a single instance, because two 2020 series ran across
 * several dates that the site models as one record. The site's own figure for
 * those is the sum, which is why the caller must not assume `[0]`.
 */
export function getHumanitixInstancesForSlug(
  slug: string
): HumanitixEventInstance[] {
  const keys = new Set<string>();

  for (const link of humanitixCrosswalk.links) {
    if (link.siteSlug === slug) keys.add(link.humanitixKey);
  }
  for (const series of humanitixCrosswalk.series) {
    if (series.siteSlug === slug) {
      for (const key of series.sessionKeys) keys.add(key);
    }
  }

  return humanitixEvents.instances.filter((instance) => keys.has(instance.key));
}

/**
 * Registrations and attendance for a site event, summed across its instances.
 *
 * `checkedIn` is null when no instance recorded a check-in — that is "not
 * recorded", and it is not the same as nobody turning up. 25 of the 62
 * instances are in that position, all of 2020–2022 among them.
 */
export function getHumanitixFiguresForSlug(slug: string): {
  registered: number;
  checkedIn: number | null;
  instances: number;
} | null {
  const instances = getHumanitixInstancesForSlug(slug);
  if (instances.length === 0) return null;

  const withCheckIn = instances.filter((instance) => instance.checkInDataPresent);

  return {
    registered: instances.reduce((sum, instance) => sum + instance.registered, 0),
    checkedIn:
      withCheckIn.length === 0
        ? null
        : withCheckIn.reduce((sum, instance) => sum + instance.checkedIn, 0),
    instances: instances.length,
  };
}
