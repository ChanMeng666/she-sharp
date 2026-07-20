/**
 * Small rendering helpers for the newsletter email.
 *
 * Kept deliberately tiny: a minimal inline-markdown parser (paragraphs +
 * `[text](url)` links only, per the founder-note contract) and a Google
 * Calendar "add to calendar" URL builder.
 */

import * as React from "react";
import { Link, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import { styles } from "./brand";

/**
 * Parse a single line of text into React nodes, converting `[label](url)`
 * markdown links into <Link> elements. All other text is passed through
 * verbatim (no HTML injection — plain strings only).
 */
function renderInlineLinks(line: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = linkRe.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    nodes.push(
      <Link key={`${keyPrefix}-${i}`} href={href} style={styles.link}>
        {label}
      </Link>
    );
    lastIndex = linkRe.lastIndex;
    i += 1;
  }
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }
  return nodes;
}

/**
 * Render short markdown (blank-line separated paragraphs, inline links only)
 * as a sequence of styled <Text> paragraphs.
 */
export function renderMarkdown(
  md: string,
  paragraphStyle: CSSProperties = styles.bodyText
): React.ReactNode[] {
  return md
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block, idx) => (
      <Text key={`p-${idx}`} style={paragraphStyle}>
        {renderInlineLinks(block.replace(/\n/g, " "), `p-${idx}`)}
      </Text>
    ));
}

/** Compact `YYYYMMDDTHHMMSSZ` UTC stamp for Google Calendar. */
function toCalendarStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Build a Google Calendar "add event" template URL from an event's ISO start.
 * Returns null when the start instant is missing/unparsable (caller omits the
 * link). Defaults the event to a 2-hour block since we only snapshot a start.
 */
export function googleCalendarUrl(input: {
  title: string;
  startIso: string | null;
  locationLabel: string | null;
  url: string;
}): string | null {
  if (!input.startIso) return null;
  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    details: `More details: ${input.url}`,
  });
  if (input.locationLabel) params.set("location", input.locationLabel);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
