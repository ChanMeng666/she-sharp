/**
 * Newsletter header: solid purple band with the white She Sharp logo and an
 * issue label in mint, capped by the signature gradient bar.
 */

import * as React from "react";
import { Section, Img, Text } from "@react-email/components";
import { COLORS, LOGO_WHITE_URL, RADIUS, SPACE, FONT_STACK } from "../brand";
import { GradientBar } from "./GradientBar";

export function Header({
  issueLabel,
}: {
  issueLabel: string;
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
            margin: `${SPACE.md}px 0 0`,
            fontFamily: FONT_STACK,
            fontSize: "13px",
            lineHeight: "18px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: COLORS.mint,
            textTransform: "uppercase",
          }}
        >
          {issueLabel}
        </Text>
      </Section>
      <GradientBar />
    </Section>
  );
}
