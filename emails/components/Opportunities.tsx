/**
 * Opportunities list: a compact stack of get-involved items, each with a bold
 * purple title, a short body line, and a text link.
 */

import * as React from "react";
import { Section, Heading, Text, Link } from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, FONT_STACK } from "../brand";

export function Opportunities({
  items,
}: {
  items: IssueEditorial["opportunities"];
}): React.JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <Section style={styles.card}>
      <Text style={styles.eyebrow}>Get involved</Text>
      <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
        Opportunities this month
      </Heading>
      {items.map((item, idx) => (
        <Section
          key={idx}
          style={{
            marginBottom: idx === items.length - 1 ? 0 : `${SPACE.lg}px`,
            paddingBottom: idx === items.length - 1 ? 0 : `${SPACE.lg}px`,
            borderBottom:
              idx === items.length - 1
                ? undefined
                : `1px solid ${COLORS.border}`,
          }}
        >
          <Text
            style={{
              margin: `0 0 ${SPACE.xs}px`,
              fontFamily: FONT_STACK,
              fontSize: "16px",
              lineHeight: "22px",
              fontWeight: 700,
              color: COLORS.purpleDark,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              margin: `0 0 ${SPACE.xs}px`,
              fontFamily: FONT_STACK,
              fontSize: "14px",
              lineHeight: "21px",
              color: COLORS.text,
            }}
          >
            {item.body}
          </Text>
          <Link
            href={item.href}
            style={{
              fontFamily: FONT_STACK,
              fontSize: "14px",
              fontWeight: 700,
              color: COLORS.purpleDark,
              textDecoration: "none",
            }}
          >
            Learn more →
          </Link>
        </Section>
      ))}
    </Section>
  );
}
