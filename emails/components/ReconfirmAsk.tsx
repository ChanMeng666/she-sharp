/**
 * "Still want this?" panel — the re-permission ask.
 *
 * Rendered only when the issue sets `editorial.askToReconfirm`, and only in
 * broadcast mode. In preview mode it is omitted entirely rather than rendered
 * inert: the on-site archive at `/resources/newsletters/<issue>` serves the
 * preview render to anybody, and a public page showing a dead "confirm my
 * subscription" button would be a consent control that does nothing — worse
 * than an honest absence. The footer's unsubscribe link is inert in preview for
 * legal-presence reasons; this block has no such requirement.
 *
 * The link carries `RECONFIRM_URL_PLACEHOLDER`, which the batch builder swaps
 * for a signed per-recipient URL. It is a link and not a form because email
 * clients cannot POST; the page it opens is where the button lives.
 *
 * Tone matters here as much as mechanism. Nobody's subscription lapses if they
 * ignore this, and saying so is what keeps the ask from reading as a threat to
 * cut them off — which is the version that earns unsubscribes and complaints
 * from people who were perfectly happy.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";

import { COLORS, FONT_STACK, RADIUS, SPACE } from "../brand";

export function ReconfirmAsk({ href }: { href: string }): React.JSX.Element {
  return (
    <Section
      style={{
        backgroundColor: COLORS.mintLight,
        border: `1px solid ${COLORS.mint}`,
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
        One small favour
      </Text>
      <Text
        style={{
          margin: `0 0 ${SPACE.md}px`,
          fontFamily: FONT_STACK,
          fontSize: "15px",
          lineHeight: "23px",
          color: COLORS.ink,
        }}
      >
        Some of you joined this list years ago — through a ticket, or an import
        from an older system — and our records do not clearly show that you chose
        to be here. We would rather ask than assume. One press tells us you still
        want these, and nothing changes if you ignore it.
      </Text>
      <Link
        href={href}
        style={{
          fontFamily: FONT_STACK,
          fontSize: "15px",
          fontWeight: 700,
          color: COLORS.purpleDark,
          textDecoration: "underline",
        }}
      >
        Yes, keep sending it
      </Link>
    </Section>
  );
}
