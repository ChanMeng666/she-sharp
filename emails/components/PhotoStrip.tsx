/**
 * "Snapshots" — a highlights strip of photos from the month's events.
 *
 * Renders nothing when there are no photos. Layout is a table-based 2-column
 * grid (Outlook-safe, no CSS grid/flex): with an odd number of photos the
 * first runs full width as the lead image, and the remainder pair up two per
 * row. A right-aligned "View all photos" link points at the month's album when
 * one is set. Columns use percentage widths so the grid scales down (rather
 * than overflowing) on narrow mobile viewports.
 */

import * as React from "react";
import { Section, Row, Column, Img, Text, Link, Heading } from "@react-email/components";
import type { IssueAuto } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK, CARD_INNER_WIDTH } from "../brand";

type StripPhoto = IssueAuto["photoStrip"][number];

const caption: React.CSSProperties = {
  margin: `${SPACE.sm}px 0 0`,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "17px",
  fontStyle: "italic",
  color: COLORS.textMuted,
};

/** A rounded, bordered photo with an italic caption drawn from its alt text. */
function Photo({
  photo,
  width,
}: {
  photo: StripPhoto;
  width: number;
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
      <Text style={caption}>{photo.alt}</Text>
    </>
  );
}

export function PhotoStrip({
  photos,
  albumUrl,
}: {
  photos: IssueAuto["photoStrip"];
  albumUrl: string | null;
}): React.JSX.Element | null {
  if (photos.length === 0) return null;

  // Odd count → first photo leads full-width; the rest pair into rows of two.
  const leadFullWidth = photos.length % 2 === 1;
  const lead = leadFullWidth ? photos[0] : null;
  const grid = leadFullWidth ? photos.slice(1) : photos;

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

      {lead ? (
        <Section style={{ marginBottom: `${SPACE.lg}px` }}>
          <Photo photo={lead} width={CARD_INNER_WIDTH} />
        </Section>
      ) : null}

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
            <Photo photo={pair[0]} width={halfWidth} />
          </Column>
          <Column
            style={{
              width: "50%",
              verticalAlign: "top",
              paddingLeft: `${SPACE.sm}px`,
            }}
          >
            {pair[1] ? <Photo photo={pair[1]} width={halfWidth} /> : null}
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
