/**
 * "Snapshots" — the month's marquee photo section: real event photography is
 * the visual hero of the newsletter.
 *
 * The first photo always runs full width as the lead shot; the rest pair up in
 * a table-based 2-column grid (Outlook-safe, no CSS grid/flex — columns use
 * percentage widths so the grid scales down on narrow mobile rather than
 * overflowing). Renders nothing when there are no photos.
 *
 * **No photo carries a visible caption.** Captions here were written about
 * frames nobody re-checked, so they asserted things the photograph did not
 * show; the photograph alone is the honest version. The `alt` attribute
 * survives because a screen reader needs *something*, and it is held to the
 * same standard: it identifies the event the photo is from and describes
 * nothing else.
 */

import * as React from "react";
import { Section, Row, Column, Img, Text, Link, Heading } from "@react-email/components";
import type { IssueAuto } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK, CARD_INNER_WIDTH } from "../brand";

type StripPhoto = IssueAuto["photoStrip"][number];

/** A rounded, bordered photo, shown on its own with no caption below. */
function Photo({
  photo,
  width,
}: {
  photo: StripPhoto;
  width: number;
}): React.JSX.Element {
  return (
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
        <Photo photo={lead} width={CARD_INNER_WIDTH} />
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
