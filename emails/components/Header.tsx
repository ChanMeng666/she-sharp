/**
 * Newsletter masthead: a solid purple band carrying a small mint kicker, the
 * white She Sharp wordmark, and the issue's month set large — a magazine-cover
 * nameplate. Capped by the signature gradient bar. The cover art (Hero) sits
 * separately below it on the page background.
 */

import * as React from "react";
import { Section, Img, Text } from "@react-email/components";
import { COLORS, LOGO_WHITE_URL, RADIUS, SPACE, FONT_STACK } from "../brand";
import { GradientBar } from "./GradientBar";

export function Header({
  monthLabel,
}: {
  /** e.g. "July 2026". */
  monthLabel: string;
}): React.JSX.Element {
  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      <Section
        style={{
          backgroundColor: COLORS.purpleDark,
          borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
          padding: `${SPACE.xxl}px ${SPACE.xxl}px ${SPACE.xl}px`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: `0 0 ${SPACE.lg}px`,
            fontFamily: FONT_STACK,
            fontSize: "11px",
            lineHeight: "14px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: COLORS.mint,
            textTransform: "uppercase",
          }}
        >
          The Monthly
        </Text>
        <Img
          src={LOGO_WHITE_URL}
          alt="She Sharp"
          width="150"
          height="auto"
          style={{
            display: "block",
            margin: "0 auto",
            border: 0,
            outline: "none",
            textDecoration: "none",
          }}
        />
        <Text
          style={{
            margin: `${SPACE.lg}px 0 0`,
            fontFamily: FONT_STACK,
            fontSize: "15px",
            lineHeight: "20px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            color: COLORS.white,
            textTransform: "uppercase",
          }}
        >
          {monthLabel}
        </Text>
      </Section>
      <GradientBar />
    </Section>
  );
}
