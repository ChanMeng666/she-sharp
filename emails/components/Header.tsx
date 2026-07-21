/**
 * Newsletter masthead — a pure-typography magazine nameplate (no art image).
 *
 * Two solid-purple bands stacked as a cover plate: the primary purpleDark band
 * carries a mint kicker over the white She Sharp wordmark; a deeper purpleDeep
 * strip below holds the issue month, set wide like a dateline. The two tones
 * come from `bgcolor`-safe solid fills (no CSS gradient/shadow), so the plate
 * renders identically in Outlook. A 6px signature gradient band caps it as the
 * cover accent. Any cover photo sits separately below on the page background.
 */

import * as React from "react";
import { Section, Img, Text } from "@react-email/components";
import { COLORS, LOGO_WHITE_URL, RADIUS, SPACE, FONT_STACK } from "../brand";
import { GradientBar } from "./GradientBar";

export function Header({
  monthLabel,
  flushBottom = false,
}: {
  /** e.g. "July 2026". */
  monthLabel: string;
  /** True when a cover photo follows directly — drop the bottom gap so the
   *  nameplate and cover shot read as one continuous cover plate. */
  flushBottom?: boolean;
}): React.JSX.Element {
  return (
    <Section style={{ marginBottom: flushBottom ? 0 : `${SPACE.lg}px` }}>
      {/* Upper band: kicker + wordmark on the primary brand purple. */}
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
            letterSpacing: "4px",
            color: COLORS.mint,
            textTransform: "uppercase",
          }}
        >
          The Monthly
        </Text>
        <Img
          src={LOGO_WHITE_URL}
          alt="She Sharp"
          width="156"
          height="auto"
          style={{
            display: "block",
            margin: "0 auto",
            border: 0,
            outline: "none",
            textDecoration: "none",
          }}
        />
      </Section>

      {/* Lower strip: the issue dateline on a deeper purple (solid two-tone). */}
      <Section
        style={{
          backgroundColor: COLORS.purpleDeep,
          padding: `${SPACE.md}px ${SPACE.xxl}px`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: FONT_STACK,
            fontSize: "13px",
            lineHeight: "18px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "rgba(255,255,255,0.92)",
            textTransform: "uppercase",
          }}
        >
          {monthLabel}
        </Text>
      </Section>

      <GradientBar height={6} />
    </Section>
  );
}
