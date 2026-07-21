/**
 * Founder's note: a warm opening card with a personalized greeting, short
 * markdown body (paragraphs + inline links) and a signature line. When the
 * note carries a `photoUrl`, the signature is shown as a circular headshot
 * beside the signature text; otherwise it is text only.
 */

import * as React from "react";
import { Section, Row, Column, Img, Heading, Text } from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, FONT_STACK } from "../brand";
import { renderMarkdown } from "../utils";

/** Purple italic signature text, shared by the avatar and text-only variants. */
const signatureText: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: 700,
  fontStyle: "italic",
  color: COLORS.purpleDark,
};

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
      {note.photoUrl ? (
        <Row style={{ marginTop: `${SPACE.lg}px` }}>
          <Column
            style={{
              width: "56px",
              verticalAlign: "middle",
              paddingRight: `${SPACE.md}px`,
            }}
          >
            <Img
              src={note.photoUrl}
              alt={note.signature}
              width="56"
              height="56"
              style={{
                display: "block",
                width: "56px",
                height: "56px",
                // 28px squares off gracefully in Outlook (which ignores the
                // radius), which is acceptable for the signature headshot.
                borderRadius: "28px",
                objectFit: "cover",
                border: `2px solid ${COLORS.purpleLight}`,
              }}
            />
          </Column>
          <Column style={{ verticalAlign: "middle" }}>
            <Text style={signatureText}>{note.signature}</Text>
          </Column>
        </Row>
      ) : (
        <Text style={{ ...signatureText, margin: `${SPACE.sm}px 0 0` }}>
          {note.signature}
        </Text>
      )}
    </Section>
  );
}
