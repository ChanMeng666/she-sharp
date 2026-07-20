/**
 * Sponsor thank-you box: a soft purple panel with a short gratitude note.
 * Rendered only when `text` is provided.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { COLORS, RADIUS, SPACE, FONT_STACK } from "../brand";

export function SponsorThanks({
  text,
}: {
  text: string;
}): React.JSX.Element {
  return (
    <Section
      style={{
        backgroundColor: COLORS.purpleLight,
        borderRadius: `${RADIUS}px`,
        padding: `${SPACE.xl}px`,
        marginBottom: `${SPACE.lg}px`,
      }}
    >
      <Text
        style={{
          margin: `0 0 ${SPACE.sm}px`,
          fontFamily: FONT_STACK,
          fontSize: "12px",
          lineHeight: "16px",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: COLORS.purpleDark,
        }}
      >
        With thanks
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: FONT_STACK,
          fontSize: "15px",
          lineHeight: "23px",
          color: COLORS.ink,
        }}
      >
        {text}
      </Text>
    </Section>
  );
}
