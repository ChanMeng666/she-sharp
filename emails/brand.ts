/**
 * She Sharp email brand tokens.
 *
 * Plain TypeScript constants and shared inline-style objects consumed by the
 * react-email newsletter components. Email clients (especially Outlook) do not
 * support external stylesheets or `<style>` reliably, so every visual rule
 * lives here as an inline `CSSProperties` object.
 *
 * Colors mirror `styles/tokens/colors.css`; logo URLs are copied from
 * `lib/email/layout.ts` (must be absolute, publicly hosted URLs).
 */

import type { CSSProperties } from "react";

/** Brand palette (hex — email clients need explicit hex, never CSS vars). */
export const COLORS = {
  purpleDark: "#9b2e83",
  /** A deeper purple for the masthead's lower nameplate strip (solid two-tone). */
  purpleDeep: "#7c2569",
  purpleMid: "#c846ab",
  purpleLight: "#f7e5f3",
  periwinkle: "#8982ff",
  periwinkleLight: "#f4f4fa",
  navyDark: "#1f1e44",
  mint: "#b1f6e9",
  mintLight: "#effefb",
  pageBg: "#f9f5f8",
  white: "#ffffff",
  ink: "#1f1e44",
  text: "#3a3956",
  textMuted: "#5a5880",
  gray: "#9b9b9b",
  border: "#efe7ec",
  borderNavy: "rgba(255,255,255,0.14)",
} as const;

/** The three signature-gradient stops, in order. */
export const GRADIENT_STOPS = [
  COLORS.purpleDark,
  COLORS.periwinkle,
  COLORS.mint,
] as const;

/** Outlook-safe CSS gradient string for the signature bar. */
export const GRADIENT_CSS = `linear-gradient(90deg, ${COLORS.purpleDark}, ${COLORS.periwinkle}, ${COLORS.mint})`;

/** Corner radius used on cards, images and boxes. */
export const RADIUS = 16;

/** Spacing scale (px) — a 4/8 rhythm; sections breathe on 24 / 32. */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Container width per email best practice. */
export const CONTAINER_WIDTH = 600;

/** System font stack — no web fonts (unreliable across clients). */
export const FONT_STACK =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Publicly hosted logos (copied from lib/email/layout.ts). */
export const LOGO_WHITE_URL =
  "https://6r3qs9uxjugyi2m1.public.blob.vercel-storage.com/she-sharp/she-sharp-logo-white.png";
export const LOGO_PURPLE_URL =
  "https://6r3qs9uxjugyi2m1.public.blob.vercel-storage.com/she-sharp/she-sharp-logo-purple-dark-500x500.png";

/** Inner content width of a padded card (CONTAINER_WIDTH − 2 × card padding). */
export const CARD_INNER_WIDTH = CONTAINER_WIDTH - SPACE.xxl * 2;

/* ------------------------------------------------------------------ */
/* Shared style objects                                               */
/* ------------------------------------------------------------------ */

export const styles = {
  /** Outer page background — every text sits on a solid color (dark-mode safe). */
  body: {
    margin: 0,
    padding: 0,
    width: "100%",
    backgroundColor: COLORS.pageBg,
    color: COLORS.text,
    fontFamily: FONT_STACK,
    WebkitTextSizeAdjust: "100%",
    MozTextSizeAdjust: "100%",
    textSizeAdjust: "100%",
  } as CSSProperties,

  container: {
    width: "100%",
    maxWidth: `${CONTAINER_WIDTH}px`,
    margin: "0 auto",
    backgroundColor: COLORS.pageBg,
  } as CSSProperties,

  /** White content card with rounded corners and hairline border. */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: `${RADIUS}px`,
    border: `1px solid ${COLORS.border}`,
    padding: `${SPACE.xxl}px`,
    marginBottom: `${SPACE.lg}px`,
  } as CSSProperties,

  h1: {
    margin: `0 0 ${SPACE.md}px`,
    fontFamily: FONT_STACK,
    fontSize: "26px",
    lineHeight: "32px",
    fontWeight: 800,
    letterSpacing: "-0.3px",
    color: COLORS.ink,
  } as CSSProperties,

  h2: {
    margin: `0 0 ${SPACE.lg}px`,
    fontFamily: FONT_STACK,
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: 800,
    letterSpacing: "-0.2px",
    color: COLORS.purpleDark,
  } as CSSProperties,

  /** Small eyebrow label above a section heading. */
  eyebrow: {
    margin: `0 0 ${SPACE.sm}px`,
    fontFamily: FONT_STACK,
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: COLORS.periwinkle,
  } as CSSProperties,

  bodyText: {
    margin: `0 0 ${SPACE.lg}px`,
    fontFamily: FONT_STACK,
    fontSize: "16px",
    lineHeight: "26px",
    color: COLORS.text,
  } as CSSProperties,

  smallText: {
    margin: 0,
    fontFamily: FONT_STACK,
    fontSize: "13px",
    lineHeight: "20px",
    color: COLORS.textMuted,
  } as CSSProperties,

  link: {
    color: COLORS.purpleDark,
    fontWeight: 600,
    textDecoration: "underline",
  } as CSSProperties,

  /** The single large primary CTA of the email. */
  button: {
    backgroundColor: COLORS.purpleDark,
    borderRadius: `${RADIUS}px`,
    color: COLORS.white,
    fontFamily: FONT_STACK,
    fontSize: "16px",
    fontWeight: 700,
    textDecoration: "none",
    textAlign: "center",
    padding: "14px 32px",
    display: "inline-block",
  } as CSSProperties,

  hr: {
    borderColor: COLORS.border,
    borderTop: `1px solid ${COLORS.border}`,
    margin: `${SPACE.xl}px 0`,
    width: "100%",
  } as CSSProperties,
} as const;
