/**
 * Headline event — the issue's one marquee upcoming event.
 *
 * A dark navy plate capped by the signature gradient, sitting directly under
 * the founder note: a gradient-capped eyebrow, a purple date rail, the event
 * title and meta line, the editorial blurb, and the issue's single CTA. Every
 * hard fact comes from the `auto.upcomingEvents` snapshot; only the framing
 * copy (eyebrow, date badge, blurb, CTA labels) is editorial, so the block can
 * never drift from the event data.
 *
 * Outlook safety: no CSS gradient outside `GradientBar`, no SVG, no
 * box-shadow, and no `rgba()` text colours — some Outlook builds drop rgba
 * colour declarations and inherit black, which is unreadable on navy. Solid
 * `COLORS.inkOnNavy` is used for muted copy instead.
 *
 * Note: `dedupePhotoStrip` in `newsletter.tsx` does not know about this block.
 * If it ever gains an image, extend that guard so the photo strip cannot
 * repeat it.
 */

import * as React from "react";
import { Section, Row, Column, Heading, Text, Button, Link } from "@react-email/components";
import type { AutoEvent, IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK } from "../brand";
import { eventMetaLine, googleCalendarUrl } from "../utils";
import { GradientBar, bgcolorAttr } from "./GradientBar";

type Headline = NonNullable<IssueEditorial["headline"]>;

export function HeadlineEvent({
  headline,
  event,
}: {
  headline: Headline;
  event: AutoEvent;
}): React.JSX.Element {
  const ctaHref = headline.ctaHref ?? event.registrationUrl ?? event.url;
  const ctaLabel = headline.ctaLabel ?? "Register";
  const calUrl = googleCalendarUrl(event);

  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      <GradientBar height={6} />

      <Section
        style={{
          backgroundColor: COLORS.navyDark,
          borderRadius: "0 0 16px 16px",
          padding: `${SPACE.xxl}px`,
        }}
      >
        <Text
          style={{
            margin: `0 0 ${SPACE.lg}px`,
            fontFamily: FONT_STACK,
            fontSize: "11px",
            lineHeight: "15px",
            fontWeight: 700,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: COLORS.mint,
          }}
        >
          {headline.eyebrow}
        </Text>

        <Row>
          <Column
            {...bgcolorAttr(COLORS.purpleMid)}
            style={{
              width: "96px",
              backgroundColor: COLORS.purpleMid,
              borderRadius: `${RADIUS - 4}px`,
              textAlign: "center",
              verticalAlign: "middle",
              padding: `${SPACE.md}px ${SPACE.sm}px`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: "30px",
                lineHeight: "34px",
                fontWeight: 800,
                color: COLORS.white,
                textAlign: "center",
              }}
            >
              {headline.dateBadge.day}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: "12px",
                lineHeight: "16px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: COLORS.mint,
                textAlign: "center",
              }}
            >
              {headline.dateBadge.month}
            </Text>
          </Column>
          <Column style={{ verticalAlign: "middle", paddingLeft: `${SPACE.lg}px` }}>
            <Heading
              as="h3"
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: "22px",
                lineHeight: "28px",
                fontWeight: 800,
                letterSpacing: "-0.2px",
                color: COLORS.white,
              }}
            >
              {event.title}
            </Heading>
            <Text
              style={{
                margin: `${SPACE.xs}px 0 0`,
                fontFamily: FONT_STACK,
                fontSize: "13px",
                lineHeight: "20px",
                fontWeight: 600,
                color: COLORS.inkOnNavy,
              }}
            >
              {eventMetaLine(event)}
            </Text>
          </Column>
        </Row>

        <Text
          style={{
            margin: `${SPACE.lg}px 0 0`,
            fontFamily: FONT_STACK,
            fontSize: "15px",
            lineHeight: "24px",
            color: COLORS.inkOnNavy,
          }}
        >
          {headline.blurb}
        </Text>

        <Section style={{ marginTop: `${SPACE.xl}px` }}>
          <Button href={ctaHref} style={styles.buttonOnDark}>
            {ctaLabel}
          </Button>
          {calUrl ? (
            <>
              <span style={{ color: COLORS.navyMid }}>{"  ·  "}</span>
              <Link
                href={calUrl}
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: "14px",
                  fontWeight: 700,
                  color: COLORS.mint,
                  textDecoration: "none",
                }}
              >
                Add to calendar
              </Link>
            </>
          ) : null}
        </Section>
      </Section>
    </Section>
  );
}
