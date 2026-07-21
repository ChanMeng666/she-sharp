/**
 * "Snapshots" — the month's marquee photo section: real event photography is
 * the visual hero of the newsletter.
 *
 * The first photo always runs full width as the lead shot; the rest pair up in
 * a table-based 2-column grid (Outlook-safe, no CSS grid/flex — columns use
 * percentage widths so the grid scales down on narrow mobile rather than
 * overflowing). Each caption is venue-grounded: the photo's `eventSlug` is
 * resolved against the recap events and captioned "<short event title> ·
 * <location>" (e.g. "Her Waka · academyEX, Auckland") so locality — real rooms,
 * real venues — is the point. When no event matches, the photo's own alt text
 * is used. Renders nothing when there are no photos.
 */

import * as React from "react";
import { Section, Row, Column, Img, Text, Link, Heading } from "@react-email/components";
import type { IssueAuto } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK, CARD_INNER_WIDTH } from "../brand";

type StripPhoto = IssueAuto["photoStrip"][number];
type RecapEvent = IssueAuto["recapEvents"][number];

const caption: React.CSSProperties = {
  margin: `${SPACE.sm}px 0 0`,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "17px",
  fontWeight: 600,
  color: COLORS.textMuted,
};

/**
 * Trim an event title down to its lead phrase for a compact caption — cut at
 * the first parenthesis, colon, dash, or em/en-dash clause (e.g. "Her Waka
 * (June 2026) — Personal Branding…" → "Her Waka").
 */
function shortEventTitle(title: string): string {
  const cut = title.split(/\s+[—–]|\s*[(:]|\s+-\s+/)[0];
  return cut.trim() || title;
}

/**
 * Venue-grounded caption for a strip photo: "<short title> · <location>" when
 * the photo's event resolves and has a location; otherwise the photo alt text.
 */
function captionFor(photo: StripPhoto, bySlug: Map<string, RecapEvent>): string {
  const event = photo.eventSlug ? bySlug.get(photo.eventSlug) : undefined;
  if (event?.locationLabel) {
    return `${shortEventTitle(event.title)} · ${event.locationLabel}`;
  }
  return photo.alt;
}

/** A rounded, bordered photo with its venue-grounded caption below. */
function Photo({
  photo,
  width,
  text,
}: {
  photo: StripPhoto;
  width: number;
  text: string;
}): React.JSX.Element {
  return (
    <>
      <Img
        src={photo.src}
        alt={photo.alt}
        width={width}
        height="auto"
        style={{
          display: "block",
          width: "100%",
          maxWidth: `${width}px`,
          borderRadius: `${RADIUS - 4}px`,
          border: `1px solid ${COLORS.border}`,
        }}
      />
      <Text style={caption}>{text}</Text>
    </>
  );
}

export function PhotoStrip({
  photos,
  recapEvents,
  albumUrl,
}: {
  photos: IssueAuto["photoStrip"];
  recapEvents: IssueAuto["recapEvents"];
  albumUrl: string | null;
}): React.JSX.Element | null {
  if (photos.length === 0) return null;

  const bySlug = new Map(recapEvents.map((e) => [e.slug, e]));

  // The first photo always leads full width; the rest pair into rows of two.
  const lead = photos[0];
  const grid = photos.slice(1);

  const rows: StripPhoto[][] = [];
  for (let i = 0; i < grid.length; i += 2) {
    rows.push(grid.slice(i, i + 2));
  }

  // Half-width column inner image size (card inner minus the center gutter).
  const halfWidth = Math.floor((CARD_INNER_WIDTH - SPACE.lg) / 2);

  return (
    <Section style={styles.card}>
      <Text style={styles.eyebrow}>Snapshots</Text>
      <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
        Moments from the month
      </Heading>

      <Section style={{ marginBottom: grid.length > 0 ? `${SPACE.lg}px` : 0 }}>
        <Photo
          photo={lead}
          width={CARD_INNER_WIDTH}
          text={captionFor(lead, bySlug)}
        />
      </Section>

      {rows.map((pair, idx) => (
        <Row
          key={idx}
          style={{ marginBottom: idx === rows.length - 1 ? 0 : `${SPACE.lg}px` }}
        >
          <Column
            style={{
              width: "50%",
              verticalAlign: "top",
              paddingRight: `${SPACE.sm}px`,
            }}
          >
            <Photo
              photo={pair[0]}
              width={halfWidth}
              text={captionFor(pair[0], bySlug)}
            />
          </Column>
          <Column
            style={{
              width: "50%",
              verticalAlign: "top",
              paddingLeft: `${SPACE.sm}px`,
            }}
          >
            {pair[1] ? (
              <Photo
                photo={pair[1]}
                width={halfWidth}
                text={captionFor(pair[1], bySlug)}
              />
            ) : null}
          </Column>
        </Row>
      ))}

      {albumUrl ? (
        <Text style={{ margin: `${SPACE.lg}px 0 0`, textAlign: "right" }}>
          <Link
            href={albumUrl}
            style={{
              fontFamily: FONT_STACK,
              fontSize: "14px",
              fontWeight: 700,
              color: COLORS.purpleDark,
              textDecoration: "none",
            }}
          >
            View all photos →
          </Link>
        </Text>
      ) : null}
    </Section>
  );
}
