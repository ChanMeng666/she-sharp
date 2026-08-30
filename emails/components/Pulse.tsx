/**
 * "NZ Tech Pulse" — the monthly data feature.
 *
 * A light-periwinkle band whose star is a single large statistic (the
 * `heroStat`), followed by an optional news bite (compact white card) and an
 * optional "Did you know?" line. Every figure carries a source link, but the
 * link text never names the publication: it reads "Source", "(Source)", or the
 * item's own dateline. `sourceLabel` stays in the data — `check-facts.ts`,
 * `lint-pulse.ts` and `pulse-copy.ts` key on it, and it is the record of where
 * each number came from — it is simply not spelled out in the copy, because
 * the link already carries the attribution. A thin
 * signature gradient rule sits above the band as a coded transition from the
 * editorial sections into the data section. Rendered only when `pulse` is set.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import type { IssueEditorial } from "@/lib/newsletter/schema";
import { COLORS, SPACE, RADIUS, FONT_STACK } from "../brand";
import { GradientBar } from "./GradientBar";

type PulseData = NonNullable<IssueEditorial["pulse"]>;

const kicker: React.CSSProperties = {
  margin: `0 0 ${SPACE.md}px`,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "16px",
  fontWeight: 700,
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: COLORS.periwinkle,
  textAlign: "center",
};

/** The headline numeral — the section's focal point. */
const stat: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: "52px",
  lineHeight: "58px",
  fontWeight: 800,
  letterSpacing: "-1px",
  color: COLORS.purpleDark,
  textAlign: "center",
};

const statLabel: React.CSSProperties = {
  margin: `${SPACE.sm}px 0 0`,
  fontFamily: FONT_STACK,
  fontSize: "16px",
  lineHeight: "23px",
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: "center",
};

const statContext: React.CSSProperties = {
  margin: `${SPACE.md}px auto 0`,
  maxWidth: "420px",
  fontFamily: FONT_STACK,
  fontSize: "15px",
  lineHeight: "23px",
  color: COLORS.text,
  textAlign: "center",
};

/** Small muted, underlined source attribution — a link, never a name. */
const sourceLink: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: "12px",
  fontWeight: 600,
  color: COLORS.textMuted,
  textDecoration: "underline",
};

/** Small centred label introducing the news list. */
const newsLabel: React.CSSProperties = {
  margin: `${SPACE.xl}px 0 ${SPACE.md}px`,
  fontFamily: FONT_STACK,
  fontSize: "11px",
  lineHeight: "15px",
  fontWeight: 700,
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: COLORS.purpleDark,
  textAlign: "center",
};

export function Pulse({ pulse }: { pulse: PulseData }): React.JSX.Element {
  const { heroStat, newsBite, newsBites, didYouKnow } = pulse;

  // `newsBites` supersedes the legacy single `newsBite`; issues predating the
  // list (e.g. 2026-06) carry only the latter, and many carry neither.
  const items = newsBites?.length ? newsBites : newsBite ? [newsBite] : [];

  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      {/* Coded transition into the data section — the signature gradient as a
          thin rule (degrades to a purple→periwinkle→mint tri-band in Outlook). */}
      <Section style={{ marginBottom: `${SPACE.xl}px` }}>
        <GradientBar height={3} />
      </Section>

      <Section
        style={{
          backgroundColor: COLORS.periwinkleLight,
          borderRadius: `${RADIUS}px`,
          border: "1px solid rgba(137,130,255,0.22)",
          padding: `${SPACE.xxl}px`,
        }}
      >
        <Text style={kicker}>NZ Tech Pulse</Text>

        <Text style={stat}>{heroStat.value}</Text>
        <Text style={statLabel}>{heroStat.label}</Text>
        <Text style={statContext}>{heroStat.context}</Text>
        <Text style={{ margin: `${SPACE.sm}px 0 0`, textAlign: "center" }}>
          <Link href={heroStat.sourceUrl} style={sourceLink}>
            Source
          </Link>
        </Text>

        {items.length > 0 ? (
          <>
            <Text style={newsLabel}>
              {items.length > 1 ? "What we're reading" : "In the news"}
            </Text>
            {items.map((item, idx) => (
              <Section
                key={item.url}
                style={{
                  // Tight gap so several items read as one list, not as
                  // separate sections.
                  marginTop: idx === 0 ? 0 : `${SPACE.md}px`,
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: `${RADIUS - 4}px`,
                  padding: `${SPACE.lg}px ${SPACE.xl}px`,
                }}
              >
                <Text
                  style={{
                    margin: `0 0 ${SPACE.xs}px`,
                    fontFamily: FONT_STACK,
                    fontSize: "15px",
                    lineHeight: "21px",
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    margin: `0 0 ${SPACE.sm}px`,
                    fontFamily: FONT_STACK,
                    fontSize: "14px",
                    lineHeight: "21px",
                    color: COLORS.text,
                  }}
                >
                  {item.summary}
                </Text>
                <Link href={item.url} style={sourceLink}>
                  {item.dateLabel ?? "Source"} →
                </Link>
              </Section>
            ))}
          </>
        ) : null}

        {didYouKnow ? (
          <Section
            style={{
              marginTop: `${SPACE.xl}px`,
              paddingTop: `${SPACE.xl}px`,
              borderTop: "1px solid rgba(137,130,255,0.22)",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: "14px",
                lineHeight: "22px",
                fontStyle: "italic",
                color: COLORS.text,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontStyle: "normal",
                  letterSpacing: "0.5px",
                  color: COLORS.purpleDark,
                }}
              >
                Did you know?{" "}
              </span>
              {didYouKnow.text}{" "}
              <Link href={didYouKnow.sourceUrl} style={sourceLink}>
                (Source)
              </Link>
            </Text>
          </Section>
        ) : null}
      </Section>
    </Section>
  );
}
