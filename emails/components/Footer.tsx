/**
 * Newsletter footer: gradient bar, navy band with the circular purple logo,
 * labeled social links, charity registration, a "view in browser" link, a
 * warm reply prompt, and the unsubscribe line.
 *
 * Social labels come from `footerConfig.socialLinks` (Mailchimp excluded); the
 * unsubscribe href/title are passed in so the caller controls broadcast vs
 * preview behaviour.
 */

import * as React from "react";
import { Section, Img, Text, Link } from "@react-email/components";
import { footerConfig } from "@/lib/config/footer";
import { SITE_URL, CHARITY_REGISTRATION } from "@/lib/seo/site";
import {
  COLORS,
  LOGO_PURPLE_URL,
  FOOTER_MOTIF_URL,
  RADIUS,
  SPACE,
  FONT_STACK,
} from "../brand";
import { GradientBar } from "./GradientBar";

/** Labeled socials to surface in the footer, in display order. */
const FOOTER_SOCIALS = ["Instagram", "Facebook", "LinkedIn", "X", "YouTube"]
  .map((name) => footerConfig.socialLinks.find((s) => s.name === name))
  .filter((s): s is (typeof footerConfig.socialLinks)[number] => Boolean(s));

const footerText: React.CSSProperties = {
  margin: `0 0 ${SPACE.sm}px`,
  fontFamily: FONT_STACK,
  fontSize: "12px",
  lineHeight: "18px",
  color: "rgba(255,255,255,0.72)",
  textAlign: "center",
};

const footerLink: React.CSSProperties = {
  color: COLORS.mint,
  fontFamily: FONT_STACK,
  fontSize: "13px",
  fontWeight: 600,
  textDecoration: "none",
};

export function Footer({
  browserUrl,
  unsubscribeHref,
  unsubscribeTitle,
}: {
  browserUrl: string;
  unsubscribeHref: string;
  unsubscribeTitle?: string;
}): React.JSX.Element {
  return (
    <Section>
      <GradientBar />
      <Section
        style={{
          backgroundColor: COLORS.navyDark,
          borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          padding: `${SPACE.xxl}px ${SPACE.xl}px`,
          textAlign: "center",
        }}
      >
        <Img
          src={LOGO_PURPLE_URL}
          alt="She Sharp"
          width="44"
          height="44"
          style={{
            display: "block",
            margin: `0 auto ${SPACE.md}px`,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: 0,
            outline: "none",
          }}
        />
        <Text
          style={{
            margin: `0 0 ${SPACE.lg}px`,
            fontFamily: FONT_STACK,
            fontSize: "13px",
            lineHeight: "18px",
            fontWeight: 700,
            color: COLORS.mint,
          }}
        >
          Empowering women in STEM
        </Text>

        {/* Decorative constellation motif (light strokes for the navy band). */}
        <Img
          src={FOOTER_MOTIF_URL}
          alt=""
          width="120"
          height="120"
          style={{
            display: "block",
            margin: `0 auto ${SPACE.lg}px`,
            width: "120px",
            height: "120px",
            border: 0,
            outline: "none",
          }}
        />

        {/* Social links */}
        <Text style={{ margin: `0 0 ${SPACE.lg}px`, textAlign: "center" }}>
          {FOOTER_SOCIALS.map((social, idx) => (
            <React.Fragment key={social.name}>
              {idx > 0 ? (
                <span style={{ color: "rgba(255,255,255,0.3)" }}>
                  {"   ·   "}
                </span>
              ) : null}
              <Link href={social.href} style={footerLink}>
                {social.name}
              </Link>
            </React.Fragment>
          ))}
        </Text>

        <Text style={footerText}>
          She Sharp — a registered New Zealand charity ({CHARITY_REGISTRATION})
        </Text>
        <Text style={footerText}>
          Bridging the gender gap in STEM, one woman at a time · Auckland, New
          Zealand
        </Text>

        <Text style={{ ...footerText, margin: `${SPACE.md}px 0 ${SPACE.sm}px` }}>
          Got news to share? Just hit reply — we read everything.
        </Text>

        <Text style={{ ...footerText, margin: `${SPACE.md}px 0 0` }}>
          <Link href={browserUrl} style={{ ...footerLink, fontWeight: 400 }}>
            View this email in your browser
          </Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>{"   ·   "}</span>
          <Link
            href={unsubscribeHref}
            title={unsubscribeTitle}
            style={{ ...footerLink, fontWeight: 400 }}
          >
            Unsubscribe
          </Link>
        </Text>
      </Section>
    </Section>
  );
}
