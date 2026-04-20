/**
 * Apply an EventPatch to the events-custom.json text, returning the
 * updated JSON as a pretty-printed string (ready to commit to Git).
 *
 * Pure function: does not mutate its inputs, does not touch the fs.
 */

import type { ValidatedEventPatch } from "./schema";

interface EventsFile {
  template?: unknown;
  events: Array<Record<string, unknown>>;
}

export function applyPatch(currentJsonText: string, patch: ValidatedEventPatch): string {
  if (patch.op === "clarify") {
    // clarify is never applied; caller should guard.
    return currentJsonText;
  }

  const data = JSON.parse(currentJsonText) as EventsFile;
  const events = [...data.events];

  if (patch.op === "update") {
    const idx = events.findIndex((e) => e.slug === patch.eventSlug);
    if (idx === -1) {
      throw new Error(`Event not found: slug=${patch.eventSlug}`);
    }
    events[idx] = deepMerge(events[idx], patch.fields);
  } else if (patch.op === "create") {
    const maxId = events.reduce((m, e) => Math.max(m, Number(e.id ?? 0)), 0);
    const newEvent = { ...patch.event, id: patch.event.id ?? maxId + 1 };
    events.unshift(newEvent as Record<string, unknown>);
  }

  const out = { ...data, events };
  return JSON.stringify(out, null, 2) + "\n";
}

/**
 * Recursive merge: patch values win; arrays are replaced (not merged).
 * Objects are deep-merged key by key.
 */
function deepMerge(base: unknown, patch: unknown): Record<string, unknown> {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return patch as Record<string, unknown>;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
