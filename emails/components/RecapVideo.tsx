/**
 * The month's recap film, rendered as a link panel inside "Looking back".
 *
 * No email client plays video: Gmail strips a `<video>` tag and Outlook strips
 * the iframe a YouTube embed needs, and both do it silently, leaving a hole
 * where the film was. So this block is a panel of text and one anchor — the
 * only two things every client renders — sized and coloured to read as a
 * distinct thing to click rather than as another paragraph.
 *
 * It is deliberately not a `Button`: the issue's one primary CTA is the
 * register button on the headline plate, and a second filled button beside it
 * splits the clicks that CTA exists to collect.
 *
 * There is no poster frame. The obvious still is YouTube's own thumbnail, which
 * for the August 2026 issue is the same group photograph as the photo of the
 * month directly above it — and `NewsletterEmail` already treats a repeated
 * photo as a defect it de-duplicates rather than a layout it ships.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, SPACE, RADIUS, FONT_STACK } from "../brand";

export function RecapVideo({
  video,
}: {
  video: NonNullable<IssueEditorial["recapVideo"]>;
}): React.JSX.Element {
  return (
    <Section
      style={{
        backgroundColor: COLORS.periwinkleLight,
        border: `1px solid ${COLORS.border}`,
        borderRadius: `${RADIUS}px`,
        padding: `${SPACE.lg}px ${SPACE.xl}px`,
        // Top margin only: the panel closes the "Looking back" card, so a
        // bottom margin would add a second gap inside the card's own padding.
        marginTop: `${SPACE.xl}px`,
      }}
    >
      <Text
        style={{
          margin: `0 0 ${SPACE.xs}px`,
          fontFamily: FONT_STACK,
          fontSize: "12px",
          lineHeight: "16px",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: COLORS.periwinkle,
        }}
      >
        Watch
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: FONT_STACK,
          fontSize: "17px",
          lineHeight: "23px",
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {video.title}
      </Text>
      <Text style={{ margin: `${SPACE.sm}px 0 0` }}>
        <Link
          href={video.url}
          style={{
            fontFamily: FONT_STACK,
            fontSize: "14px",
            fontWeight: 700,
            color: COLORS.purpleDark,
            textDecoration: "none",
          }}
        >
          Watch the recap →
        </Link>
      </Text>
    </Section>
  );
}
