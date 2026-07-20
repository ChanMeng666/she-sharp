/**
 * Founder's note: a warm opening card with a personalized greeting, short
 * markdown body (paragraphs + inline links) and a signature line.
 */

import * as React from "react";
import { Section, Heading, Text } from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, FONT_STACK } from "../brand";
import { renderMarkdown } from "../utils";

export function FounderNote({
  note,
  greeting,
}: {
  note: IssueEditorial["founderNote"];
  greeting: string;
}): React.JSX.Element {
  return (
    <Section style={styles.card}>
      <Heading as="h1" style={styles.h1}>
        {note.heading}
      </Heading>
      <Text style={{ ...styles.bodyText, marginBottom: `${SPACE.md}px` }}>
        {greeting}
      </Text>
      {renderMarkdown(note.bodyMd)}
      <Text
        style={{
          margin: `${SPACE.sm}px 0 0`,
          fontFamily: FONT_STACK,
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: 700,
          fontStyle: "italic",
          color: COLORS.purpleDark,
        }}
      >
        {note.signature}
      </Text>
    </Section>
  );
}
