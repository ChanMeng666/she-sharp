/**
 * Event cards used in the recap and upcoming sections.
 *
 * `RecapEventCard` is compact (thumbnail left, title/date/blurb right, a
 * "Read more" link). `UpcomingEventCard` is a fuller card (cover on top,
 * title, a date/time/location meta line, plus "Add to calendar" and either a
 * "Register" or an "Event details" text link). The single primary CTA button
 * is rendered once by the upcoming section, not per card.
 */

import * as React from "react";
import {
  Section,
  Row,
  Column,
  Img,
  Heading,
  Text,
  Link,
} from "@react-email/components";
import type { AutoEvent } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK } from "../brand";
import { eventMetaLine, googleCalendarUrl } from "../utils";

/** Short, decorative date accent (recap cards). */
const metaText: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "19px",
  fontWeight: 600,
  color: COLORS.periwinkle,
};

/** Longer date/time/location line — muted ink for legibility (AA contrast). */
const metaLine: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  lineHeight: "20px",
  fontWeight: 600,
  color: COLORS.textMuted,
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "17px",
  lineHeight: "23px",
  fontWeight: 700,
  color: COLORS.ink,
};

const textLink: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: "14px",
  fontWeight: 700,
  color: COLORS.purpleDark,
  textDecoration: "none",
};

/**
 * Splits a blurb into paragraphs on blank lines.
 *
 * A blurb used to be one sentence-pair rendered as a single `<Text>`, where a
 * `\n\n` collapses to a space like any other whitespace in HTML. The August
 * 2026 recap is two paragraphs, so that break has to become real markup. A
 * one-paragraph blurb still renders exactly one `<Text>` with exactly the old
 * style, which is what keeps earlier issues re-rendering unchanged in the
 * on-site archive.
 *
 * @param blurb The blurb text, or null when the event has none.
 * @returns One entry per paragraph; empty when there is no blurb.
 */
function splitParagraphs(blurb: string | null): string[] {
  if (!blurb) return [];
  return blurb
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Compact recap card: thumbnail + title + date + blurb + read-more. */
export function RecapEventCard({
  event,
  blurb,
  isLast,
}: {
  event: AutoEvent;
  blurb: string | null;
  isLast: boolean;
}): React.JSX.Element {
  const blurbParagraphs = splitParagraphs(blurb);

  return (
    <Section
      style={{
        paddingBottom: isLast ? 0 : `${SPACE.lg}px`,
        marginBottom: isLast ? 0 : `${SPACE.lg}px`,
        borderBottom: isLast ? undefined : `1px solid ${COLORS.border}`,
      }}
    >
      <Row>
        {event.coverImageUrl ? (
          <Column
            style={{
              width: "112px",
              verticalAlign: "top",
              paddingRight: `${SPACE.lg}px`,
            }}
          >
            <Img
              src={event.coverImageUrl}
              alt={event.title}
              width="96"
              height="96"
              style={{
                display: "block",
                width: "96px",
                height: "96px",
                borderRadius: `${RADIUS - 4}px`,
                objectFit: "cover",
                border: `1px solid ${COLORS.border}`,
              }}
            />
          </Column>
        ) : null}
        <Column style={{ verticalAlign: "top" }}>
          <Text style={{ ...metaText, marginBottom: `${SPACE.xs}px` }}>
            {event.dateLabel}
          </Text>
          <Heading as="h3" style={cardTitle}>
            {event.title}
          </Heading>
          {blurbParagraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={{
                margin: `${index === 0 ? SPACE.xs : SPACE.md}px 0 0`,
                fontFamily: FONT_STACK,
                fontSize: "14px",
                lineHeight: "21px",
                color: COLORS.text,
              }}
            >
              {paragraph}
            </Text>
          ))}
          <Text style={{ margin: `${SPACE.sm}px 0 0` }}>
            <Link href={event.url} style={textLink}>
              Read more →
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

/** Fuller upcoming card: cover on top, meta line, calendar/register links. */
export function UpcomingEventCard({
  event,
  isLast,
}: {
  event: AutoEvent;
  isLast: boolean;
}): React.JSX.Element {
  const meta = eventMetaLine(event);
  const calUrl = googleCalendarUrl(event);

  return (
    <Section
      style={{
        paddingBottom: isLast ? 0 : `${SPACE.xl}px`,
        marginBottom: isLast ? 0 : `${SPACE.xl}px`,
        borderBottom: isLast ? undefined : `1px solid ${COLORS.border}`,
      }}
    >
      {event.coverImageUrl ? (
        <Img
          src={event.coverImageUrl}
          alt={event.title}
          width="536"
          height="auto"
          style={{
            display: "block",
            width: "100%",
            maxWidth: "536px",
            borderRadius: `${RADIUS}px`,
            border: `1px solid ${COLORS.border}`,
            marginBottom: `${SPACE.md}px`,
          }}
        />
      ) : null}
      <Heading as="h3" style={cardTitle}>
        {event.title}
      </Heading>
      <Text style={{ ...metaLine, marginTop: `${SPACE.xs}px` }}>{meta}</Text>
      <Text style={{ margin: `${SPACE.md}px 0 0` }}>
        {calUrl ? (
          <Link href={calUrl} style={textLink}>
            Add to calendar
          </Link>
        ) : null}
        {calUrl ? <span style={{ color: COLORS.gray }}>{"  ·  "}</span> : null}
        {/* Without registration the card would otherwise dead-end, so fall
            back to the event page rather than rendering no link at all. */}
        {event.registrationUrl ? (
          <Link href={event.registrationUrl} style={textLink}>
            Register
          </Link>
        ) : (
          <Link href={event.url} style={textLink}>
            Event details →
          </Link>
        )}
      </Text>
    </Section>
  );
}
