/**
 * Member/mentor spotlight card: circular photo, name + role, and a short
 * Q&A where each question is bold purple and the answer sits below it.
 */

import * as React from "react";
import {
  Section,
  Row,
  Column,
  Img,
  Heading,
  Text,
} from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK } from "../brand";

type SpotlightData = NonNullable<IssueEditorial["spotlight"]>;

export function Spotlight({
  spotlight,
}: {
  spotlight: SpotlightData;
}): React.JSX.Element {
  return (
    <Section style={styles.card}>
      <Text style={styles.eyebrow}>Spotlight</Text>
      <Row>
        <Column
          style={{
            width: "96px",
            verticalAlign: "top",
            paddingRight: `${SPACE.lg}px`,
          }}
        >
          <Img
            src={spotlight.photoUrl}
            alt={spotlight.name}
            width="80"
            height="80"
            style={{
              display: "block",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${COLORS.purpleLight}`,
            }}
          />
        </Column>
        <Column style={{ verticalAlign: "top" }}>
          <Heading
            as="h2"
            style={{ ...styles.h2, margin: 0, color: COLORS.ink }}
          >
            {spotlight.name}
          </Heading>
          <Text
            style={{
              margin: `${SPACE.xs}px 0 0`,
              fontFamily: FONT_STACK,
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 600,
              color: COLORS.periwinkle,
            }}
          >
            {spotlight.role}
          </Text>
        </Column>
      </Row>

      <Section
        style={{
          marginTop: `${SPACE.lg}px`,
          padding: `${SPACE.lg}px ${SPACE.xl}px`,
          backgroundColor: COLORS.periwinkleLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: `${RADIUS}px`,
        }}
      >
        {spotlight.qa.map((item, idx) => (
          <Section
            key={idx}
            style={{
              marginBottom:
                idx === spotlight.qa.length - 1 ? 0 : `${SPACE.md}px`,
            }}
          >
            <Text
              style={{
                margin: `0 0 ${SPACE.xs}px`,
                fontFamily: FONT_STACK,
                fontSize: "15px",
                lineHeight: "22px",
                fontWeight: 700,
                color: COLORS.purpleDark,
              }}
            >
              {item.q}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: "15px",
                lineHeight: "23px",
                color: COLORS.text,
              }}
            >
              {item.a}
            </Text>
          </Section>
        ))}
      </Section>
    </Section>
  );
}
