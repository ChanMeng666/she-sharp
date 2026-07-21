/**
 * Event cards used in the recap and upcoming sections.
 *
 * `RecapEventCard` is compact (thumbnail left, title/date/blurb right, a
 * "Read more" link). `UpcomingEventCard` is a fuller card (cover on top,
 * title, a date/time/location meta line, plus "Add to calendar" and
 * "Register" text links). The single primary CTA button is rendered once by
 * the upcoming section, not per card.
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
import { googleCalendarUrl } from "../utils";

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
          {blurb ? (
            <Text
              style={{
                margin: `${SPACE.xs}px 0 0`,
                fontFamily: FONT_STACK,
                fontSize: "14px",
                lineHeight: "21px",
                color: COLORS.text,
              }}
            >
              {blurb}
            </Text>
          ) : null}
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
  // Multi-day events embed full dates in timeLabel (e.g. "Fri 7 Aug, 5:00pm –
  // Sat 8 Aug"); showing dateLabel too would repeat the date on one line.
  const timeLabelHasDate =
    event.timeLabel !== null &&
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(event.timeLabel);
  const meta = [
    timeLabelHasDate ? null : event.dateLabel,
    event.timeLabel,
    event.locationLabel,
  ]
    .filter((v): v is string => Boolean(v))
    .join("  ·  ");
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
        {calUrl && event.registrationUrl ? (
          <span style={{ color: COLORS.gray }}>{"  ·  "}</span>
        ) : null}
        {event.registrationUrl ? (
          <Link href={event.registrationUrl} style={textLink}>
            Register
          </Link>
        ) : null}
      </Text>
    </Section>
  );
}
