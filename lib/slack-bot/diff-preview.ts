/**
 * Build the human-readable preview for the ephemeral Slack message:
 * a one-line summary, a compact JSON diff, and the image checklist.
 */

import { diff, type Diff } from "deep-diff";

import type { ValidatedEventPatch } from "./schema";

export interface PreviewData {
  summary: string;
  diffLines: string[];
  imageChecklist: Array<{ path: string; description: string; alreadyExists?: boolean }>;
}

const MAX_DIFF_LINES = 40;

export function buildPreview(
  beforeJsonText: string,
  afterJsonText: string,
  patch: ValidatedEventPatch,
): PreviewData {
  const summary = patch.op === "clarify" ? "Clarification needed" : patch.summary;
  const imageChecklist = patch.op === "clarify" ? [] : patch.imageChecklist;

  let diffLines: string[] = [];
  if (patch.op !== "clarify") {
    const before = JSON.parse(beforeJsonText);
    const after = JSON.parse(afterJsonText);
    const differences = diff(before, after) ?? [];
    diffLines = differences.flatMap(formatDiff).slice(0, MAX_DIFF_LINES);
    if (differences.length > MAX_DIFF_LINES) {
      diffLines.push(`… (${differences.length - MAX_DIFF_LINES} more changes)`);
    }
  }

  return { summary, diffLines, imageChecklist };
}

function formatDiff(d: Diff<unknown>): string[] {
  const path = (d.path ?? []).join(".");
  switch (d.kind) {
    case "N":
      return [`+ ${path}: ${trunc(JSON.stringify(d.rhs))}`];
    case "D":
      return [`- ${path}: ${trunc(JSON.stringify(d.lhs))}`];
    case "E":
      return [`~ ${path}: ${trunc(JSON.stringify(d.lhs))} → ${trunc(JSON.stringify(d.rhs))}`];
    case "A":
      return [`[${path}[${d.index}]] ${formatDiff(d.item as Diff<unknown>).join(" ")}`];
    default:
      return [];
  }
}

function trunc(s: string, n = 120): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}
