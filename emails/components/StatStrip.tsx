/**
 * "By the numbers" stat strip: a full-width navy band with three columns —
 * mint numerals over white labels (members / sponsors / events).
 */

import * as React from "react";
import { Section, Row, Column, Text } from "@react-email/components";
import type { IssueAuto } from "@/lib/newsletter/schema";
import { COLORS, RADIUS, SPACE, FONT_STACK } from "../brand";

const numeral: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "28px",
  lineHeight: "34px",
  fontWeight: 800,
  color: COLORS.mint,
};

const label: React.CSSProperties = {
  margin: `${SPACE.xs}px 0 0`,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "16px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: COLORS.white,
};

const cell: React.CSSProperties = {
  width: "33.33%",
  textAlign: "center",
  verticalAlign: "middle",
  padding: `0 ${SPACE.sm}px`,
};

export function StatStrip({
  stats,
}: {
  stats: IssueAuto["stats"];
}): React.JSX.Element {
  const items: Array<[string, string]> = [
    [stats.members, "Members"],
    [stats.sponsors, "Sponsors"],
    [stats.events, "Events since 2014"],
  ];
  return (
    <Section
      style={{
        backgroundColor: COLORS.navyDark,
        borderRadius: `${RADIUS}px`,
        padding: `${SPACE.xl}px ${SPACE.lg}px`,
        marginBottom: `${SPACE.lg}px`,
      }}
    >
      <Row>
        {items.map(([value, name], idx) => (
          <Column key={idx} style={cell}>
            <Text style={numeral}>{value}</Text>
            <Text style={label}>{name}</Text>
          </Column>
        ))}
      </Row>
    </Section>
  );
}
