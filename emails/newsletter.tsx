/**
 * She Sharp monthly newsletter — root react-email template.
 *
 * Renders a `NewsletterIssueData` into a single-column, 600px, Outlook-safe
 * email. Styling comes exclusively from inline style objects in `./brand`
 * (no Tailwind wrapper) for predictable rendering across clients.
 *
 * `mode` controls merge-tag behaviour:
 *  - "broadcast": Resend merge tags are emitted literally (personalized
 *    greeting + unsubscribe URL) for the sending pipeline to substitute.
 *  - "preview": tags are replaced with safe, inert values for local review.
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
} from "@react-email/components";
import type { NewsletterIssueData } from "@/lib/newsletter/schema";
import { SITE_URL } from "@/lib/seo/site";
import { COLORS, styles, SPACE, RADIUS, FONT_STACK, CONTAINER_WIDTH } from "./brand";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FounderNote } from "./components/FounderNote";
import { Spotlight } from "./components/Spotlight";
import { PhotoStrip } from "./components/PhotoStrip";
import { RecapEventCard, UpcomingEventCard } from "./components/EventCard";
import { Pulse } from "./components/Pulse";
import { StatStrip } from "./components/StatStrip";
import { Opportunities } from "./components/Opportunities";
import { SponsorThanks } from "./components/SponsorThanks";
import { Footer } from "./components/Footer";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-07" → "July 2026". */
function monthLabel(id: string): string {
  const [year, month] = id.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${year}`;
}

export function NewsletterEmail({
  issue,
  mode,
}: {
  issue: NewsletterIssueData;
  mode: "broadcast" | "preview";
}): React.JSX.Element {
  const { editorial, auto } = issue;

  const greeting =
    mode === "broadcast"
      ? "Hi {{{contact.first_name|there}}},"
      : "Hi there,";

  const unsubscribeHref =
    mode === "broadcast" ? "{{{RESEND_UNSUBSCRIBE_URL}}}" : "#";
  const unsubscribeTitle =
    mode === "broadcast" ? undefined : "Unsubscribe (preview)";

  const browserUrl = `${SITE_URL}/resources/newsletters/${issue.id}`;

  const hasRecap = auto.recapEvents.length > 0 || editorial.photoOfTheMonth;
  const hasUpcoming = auto.upcomingEvents.length > 0;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{editorial.previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container} width={CONTAINER_WIDTH}>
          <Header monthLabel={monthLabel(issue.id)} />

          <Hero src={editorial.heroImageUrl} />

          <FounderNote note={editorial.founderNote} greeting={greeting} />

          {editorial.spotlight ? (
            <Spotlight spotlight={editorial.spotlight} />
          ) : null}

          <PhotoStrip
            photos={auto.photoStrip}
            albumUrl={auto.photoAlbumUrl}
          />

          {hasRecap ? (
            <Section style={styles.card}>
              <Text style={styles.eyebrow}>Last month</Text>
              <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
                Looking back
              </Heading>
              <Text style={styles.bodyText}>{editorial.recapIntro}</Text>

              {editorial.photoOfTheMonth ? (
                <Section style={{ marginBottom: `${SPACE.xl}px` }}>
                  <Img
                    src={editorial.photoOfTheMonth.src}
                    alt={editorial.photoOfTheMonth.caption}
                    width="536"
                    height="auto"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "536px",
                      borderRadius: `${RADIUS}px`,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  />
                  <Text
                    style={{
                      margin: `${SPACE.sm}px 0 0`,
                      fontFamily: FONT_STACK,
                      fontSize: "13px",
                      lineHeight: "19px",
                      fontStyle: "italic",
                      textAlign: "center",
                      color: COLORS.textMuted,
                    }}
                  >
                    {editorial.photoOfTheMonth.caption}
                  </Text>
                </Section>
              ) : null}

              {auto.recapEvents.map((event, idx) => (
                <RecapEventCard
                  key={event.slug}
                  event={event}
                  blurb={
                    editorial.eventBlurbs[event.slug] ??
                    event.shortDescription ??
                    null
                  }
                  isLast={idx === auto.recapEvents.length - 1}
                />
              ))}
            </Section>
          ) : null}

          {hasUpcoming ? (
            <Section style={styles.card}>
              <Text style={styles.eyebrow}>What's next</Text>
              <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
                Upcoming events
              </Heading>
              {auto.upcomingEvents.map((event, idx) => (
                <UpcomingEventCard
                  key={event.slug}
                  event={event}
                  isLast={idx === auto.upcomingEvents.length - 1}
                />
              ))}
              <Section style={{ textAlign: "center", marginTop: `${SPACE.xl}px` }}>
                <Button href={editorial.primaryCta.href} style={styles.button}>
                  {editorial.primaryCta.label}
                </Button>
              </Section>
            </Section>
          ) : null}

          {editorial.pulse ? <Pulse pulse={editorial.pulse} /> : null}

          <StatStrip stats={auto.stats} />

          <Opportunities items={editorial.opportunities} />

          {editorial.sponsorThanks ? (
            <SponsorThanks text={editorial.sponsorThanks} />
          ) : null}

          <Footer
            browserUrl={browserUrl}
            unsubscribeHref={unsubscribeHref}
            unsubscribeTitle={unsubscribeTitle}
          />
        </Container>
      </Body>
    </Html>
  );
}

export default NewsletterEmail;
