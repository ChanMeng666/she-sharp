/**
 * She Sharp announcement email — react-email root template.
 *
 * Renders a `MessageSpec` in the same visual system as the monthly newsletter
 * (600px single column, the brand token set from `./brand`, the signature
 * gradient bar, the navy footer) so a one-off announcement never looks like a
 * different organisation. Where the newsletter has a month-bound masthead, an
 * announcement leads with a plain wordmark plate and puts `spec.title` in the
 * body as the headline.
 *
 * `mode` controls what the substitutable slots carry:
 *  - "broadcast": the first-name Resend merge tag, and
 *    `UNSUBSCRIBE_URL_PLACEHOLDER` for the sending pipeline to substitute.
 *  - "preview": both are replaced with inert values for local review.
 */

import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
  Button,
  Link,
  Hr,
} from "@react-email/components";
import type { Block, MessageSpec } from "@/lib/email/message";
import { UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/unsubscribe-headers";
import { SITE_URL } from "@/lib/seo/site";
import {
  COLORS,
  styles,
  SPACE,
  RADIUS,
  FONT_STACK,
  CONTAINER_WIDTH,
  LOGO_WHITE_URL,
} from "./brand";
import { GradientBar } from "./components/GradientBar";
import { Footer } from "./components/Footer";
import { renderMarkdown } from "./utils";

/** Wordmark plate — the announcement's stand-in for the newsletter masthead. */
function Masthead({
  flushBottom = false,
}: {
  /** True when a cover photo follows directly — drop the gap so the plate reads
   *  as one continuous cover. */
  flushBottom?: boolean;
}): React.JSX.Element {
  return (
    <Section style={{ marginBottom: flushBottom ? 0 : `${SPACE.lg}px` }}>
      <Section
        style={{
          backgroundColor: COLORS.purpleDark,
          borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
          padding: `${SPACE.xxl}px`,
          textAlign: "center",
        }}
      >
        <Img
          src={LOGO_WHITE_URL}
          alt="She Sharp"
          width="156"
          height="auto"
          style={{
            display: "block",
            margin: "0 auto",
            border: 0,
            outline: "none",
            textDecoration: "none",
          }}
        />
      </Section>
      <GradientBar height={6} />
    </Section>
  );
}

/**
 * Cover photo under the masthead.
 *
 * Mirrors `components/Cover.tsx` visually but takes the alt text from the spec:
 * an announcement's cover is author-chosen, and its alt is what subscribers
 * read while images are still blocked.
 */
function AnnouncementCover({
  cover,
}: {
  cover: { url: string; alt: string };
}): React.JSX.Element {
  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      <Img
        src={cover.url}
        alt={cover.alt}
        width={CONTAINER_WIDTH}
        height="auto"
        style={{
          display: "block",
          width: "100%",
          maxWidth: `${CONTAINER_WIDTH}px`,
          borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          borderLeft: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      />
    </Section>
  );
}

/** Renders one content block with the shared newsletter tokens. */
function BlockView({ block }: { block: Block }): React.JSX.Element | null {
  switch (block.type) {
    case "paragraph":
      return <>{renderMarkdown(block.text, styles.bodyText)}</>;

    case "heading":
      return (
        <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
          {block.text}
        </Heading>
      );

    case "button":
      return (
        <Section style={{ textAlign: "center", margin: `${SPACE.xl}px 0` }}>
          <Button href={block.url} style={styles.button}>
            {block.text}
          </Button>
        </Section>
      );

    case "info":
      return (
        <Section
          style={{
            backgroundColor: COLORS.purpleLight,
            borderLeft: `4px solid ${COLORS.purpleDark}`,
            borderRadius: `0 ${RADIUS}px ${RADIUS}px 0`,
            padding: `${SPACE.lg}px ${SPACE.xl}px`,
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: "15px",
              lineHeight: "23px",
              color: COLORS.ink,
            }}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </Section>
      );

    case "warning":
      return (
        <Section
          style={{
            backgroundColor: "#fff3e0",
            borderLeft: "4px solid #e65100",
            borderRadius: `0 ${RADIUS}px ${RADIUS}px 0`,
            padding: `${SPACE.lg}px ${SPACE.xl}px`,
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: "15px",
              lineHeight: "23px",
              color: "#3a2a12",
            }}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </Section>
      );

    case "success":
      return (
        <Section style={{ textAlign: "center", marginBottom: `${SPACE.lg}px` }}>
          <Text
            style={{
              display: "inline-block",
              margin: 0,
              padding: `${SPACE.sm}px ${SPACE.xl}px`,
              backgroundColor: "#2e7d32",
              borderRadius: "20px",
              fontFamily: FONT_STACK,
              fontSize: "14px",
              fontWeight: 700,
              color: COLORS.white,
            }}
          >
            {block.text}
          </Text>
        </Section>
      );

    case "details":
      return (
        <Section
          style={{
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: `${RADIUS}px`,
            padding: `${SPACE.xl}px`,
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          {block.rows.map((row) => (
            <Text
              key={row.label}
              style={{
                margin: `0 0 ${SPACE.sm}px`,
                fontFamily: FONT_STACK,
                fontSize: "15px",
                lineHeight: "23px",
                color: COLORS.ink,
              }}
            >
              <strong style={{ color: COLORS.purpleDark }}>{row.label}:</strong>{" "}
              {row.value}
            </Text>
          ))}
        </Section>
      );

    case "link":
      return (
        <Section
          style={{
            backgroundColor: COLORS.purpleLight,
            borderRadius: `${RADIUS}px`,
            padding: `${SPACE.md}px ${SPACE.lg}px`,
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          {block.label ? (
            <Text style={{ ...styles.smallText, marginBottom: `${SPACE.xs}px` }}>
              {block.label}
            </Text>
          ) : null}
          <Link
            href={block.url}
            style={{
              ...styles.link,
              fontSize: "13px",
              wordBreak: "break-all",
            }}
          >
            {block.url}
          </Link>
        </Section>
      );

    case "divider":
      return <Hr style={styles.hr} />;
  }
}

export function AnnouncementEmail({
  spec,
  mode,
}: {
  spec: MessageSpec;
  mode: "broadcast" | "preview";
}): React.JSX.Element {
  const greeting =
    mode === "broadcast" ? "Hi {{{contact.first_name|there}}}," : "Hi there,";

  // A template rendered once — or rendered by code that does not yet know the
  // address — cannot write a per-recipient unsubscribe URL, so it emits a
  // placeholder and `substituteUnsubscribeUrl()` swaps in the signed URL for
  // each person at send time. The placeholder is deliberately NOT
  // brace-delimited: `gateMergeTags` in `lib/email/gates.ts` fails any unknown
  // `{{…}}` / `{{{…}}}` tag, and this must not look like one.
  const unsubscribeHref =
    mode === "broadcast" ? UNSUBSCRIBE_URL_PLACEHOLDER : "#";
  const unsubscribeTitle =
    mode === "broadcast" ? undefined : "Unsubscribe (preview)";

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      {spec.preheader ? <Preview>{spec.preheader}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container} width={CONTAINER_WIDTH}>
          <Masthead flushBottom={Boolean(spec.cover)} />

          {spec.cover ? <AnnouncementCover cover={spec.cover} /> : null}

          <Section style={styles.card}>
            <Text style={styles.bodyText}>{greeting}</Text>
            <Heading as="h1" style={styles.h1}>
              {spec.title}
            </Heading>
            {spec.blocks.map((block, idx) => (
              <BlockView key={`block-${idx}`} block={block} />
            ))}
          </Section>

          <Footer
            browserUrl={SITE_URL}
            unsubscribeHref={unsubscribeHref}
            unsubscribeTitle={unsubscribeTitle}
          />
        </Container>
      </Body>
    </Html>
  );
}

export default AnnouncementEmail;
