/**
 * She Sharp monthly newsletter — root react-email template.
 *
 * Renders a `NewsletterIssueData` into a single-column, 600px, Outlook-safe
 * email. Styling comes exclusively from inline style objects in `./brand`
 * (no Tailwind wrapper) for predictable rendering across clients.
 *
 * `mode` controls what the footer's unsubscribe link carries:
 *  - "broadcast": `UNSUBSCRIBE_URL_PLACEHOLDER`, which the send path swaps for
 *    a signed per-recipient URL.
 *  - "preview": an inert "#" for local review.
 *
 * The re-permission ask (`editorial.askToReconfirm`) follows the same split, but
 * is omitted outright in preview rather than made inert — see
 * `./components/ReconfirmAsk`.
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
import type { IssueAuto, NewsletterIssueData } from "@/lib/newsletter/schema";
import { UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/unsubscribe-headers";
import { RECONFIRM_URL_PLACEHOLDER } from "@/lib/newsletter/reconfirm-link";
import { SITE_URL } from "@/lib/seo/site";
import { COLORS, styles, SPACE, RADIUS, CONTAINER_WIDTH } from "./brand";
import { Header } from "./components/Header";
import { Cover } from "./components/Cover";
import { FounderNote } from "./components/FounderNote";
import { HeadlineEvent } from "./components/HeadlineEvent";
import { PhotoStrip } from "./components/PhotoStrip";
import { RecapVideo } from "./components/RecapVideo";
import { RecapEventCard, UpcomingEventCard } from "./components/EventCard";
import { Pulse } from "./components/Pulse";
import { StatStrip } from "./components/StatStrip";
import { Opportunities } from "./components/Opportunities";
import { ReconfirmAsk } from "./components/ReconfirmAsk";
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

/**
 * Photo no-repeat guard: no image may appear twice across the issue. Strip
 * photos lose against everything else — any strip src equal to the cover, the
 * photo-of-the-month, or a recap event's cover thumbnail is dropped, and the
 * strip is de-duplicated within itself (first occurrence wins).
 */
function dedupePhotoStrip(issue: NewsletterIssueData): IssueAuto["photoStrip"] {
  const { editorial, auto } = issue;
  const used = new Set<string>();
  if (editorial.heroImageUrl) used.add(editorial.heroImageUrl);
  if (editorial.photoOfTheMonth?.src) used.add(editorial.photoOfTheMonth.src);
  for (const event of auto.recapEvents) {
    if (event.coverImageUrl) used.add(event.coverImageUrl);
  }

  const result: IssueAuto["photoStrip"] = [];
  for (const photo of auto.photoStrip) {
    if (used.has(photo.src)) continue;
    used.add(photo.src);
    result.push(photo);
  }
  return result;
}

export function NewsletterEmail({
  issue,
  mode,
}: {
  issue: NewsletterIssueData;
  mode: "broadcast" | "preview";
}): React.JSX.Element {
  const { editorial, auto } = issue;

  // The same greeting for everyone, in both modes. Per-recipient
  // personalisation was deliberately dropped when the newsletter moved off
  // Resend broadcasts: the batch path renders this template ONCE for the whole
  // list, and the first names imported from Mailchimp are of uneven quality —
  // a wrong name reads worse than no name at all.
  const greeting = "Hi there,";

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

  // Only in a real send: the block carries a per-recipient placeholder that
  // nothing substitutes in preview, and the preview render is what the public
  // on-site archive serves.
  const showReconfirmAsk = editorial.askToReconfirm && mode === "broadcast";

  const browserUrl = `${SITE_URL}/resources/newsletters/${issue.id}`;

  const photoStrip = dedupePhotoStrip(issue);

  // The promoted event is rendered by the headline plate and dropped from the
  // "What's next" list so it never appears twice. A slug that matches nothing
  // degrades silently to no headline block rather than an empty plate.
  const headlineEvent = editorial.headline
    ? (auto.upcomingEvents.find(
        (event) => event.slug === editorial.headline?.eventSlug
      ) ?? null)
    : null;
  const restUpcoming = headlineEvent
    ? auto.upcomingEvents.filter((event) => event.slug !== headlineEvent.slug)
    : auto.upcomingEvents;

  const hasRecap = auto.recapEvents.length > 0 || editorial.photoOfTheMonth;
  const hasUpcoming = restUpcoming.length > 0;

  /**
   * A headline issue reads narrative-first: the recap card explains the month,
   * then the photo grid shows it. Issues without a headline plate keep the
   * original strip-then-recap order, so an already-sent issue re-renders in the
   * web archive exactly as its subscribers received it.
   */
  const narrativeFirst = Boolean(editorial.headline && headlineEvent);

  const photoStripBlock = (
    <PhotoStrip photos={photoStrip} albumUrl={auto.photoAlbumUrl} />
  );

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{editorial.previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container} width={CONTAINER_WIDTH}>
          <Header
            monthLabel={monthLabel(issue.id)}
            flushBottom={Boolean(editorial.heroImageUrl)}
          />

          <Cover src={editorial.heroImageUrl} />

          <FounderNote note={editorial.founderNote} greeting={greeting} />

          {editorial.headline && headlineEvent ? (
            <HeadlineEvent headline={editorial.headline} event={headlineEvent} />
          ) : null}

          {narrativeFirst ? null : photoStripBlock}

          {hasRecap ? (
            <Section style={styles.card}>
              <Text style={styles.eyebrow}>Last month</Text>
              <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
                Looking back
              </Heading>
              <Text style={styles.bodyText}>{editorial.recapIntro}</Text>

              {/* No caption under the photo — see `alt` in the schema: the
                  photograph speaks for itself, and the only text about it is
                  the one a screen reader needs. */}
              {editorial.photoOfTheMonth ? (
                <Section style={{ marginBottom: `${SPACE.xl}px` }}>
                  <Img
                    src={editorial.photoOfTheMonth.src}
                    alt={editorial.photoOfTheMonth.alt}
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

              {editorial.recapVideo ? (
                <RecapVideo video={editorial.recapVideo} />
              ) : null}
            </Section>
          ) : null}

          {narrativeFirst ? photoStripBlock : null}

          {hasUpcoming ? (
            <Section style={styles.card}>
              <Text style={styles.eyebrow}>What's next</Text>
              <Heading as="h2" style={{ ...styles.h2, color: COLORS.ink }}>
                Upcoming events
              </Heading>
              {restUpcoming.map((event, idx) => (
                <UpcomingEventCard
                  key={event.slug}
                  event={event}
                  isLast={idx === restUpcoming.length - 1}
                />
              ))}
              {/* The headline plate already carries the issue's one CTA. */}
              {headlineEvent ? null : (
                <Section style={{ textAlign: "center", marginTop: `${SPACE.xl}px` }}>
                  <Button href={editorial.primaryCta.href} style={styles.button}>
                    {editorial.primaryCta.label}
                  </Button>
                </Section>
              )}
            </Section>
          ) : null}

          {editorial.pulse ? <Pulse pulse={editorial.pulse} /> : null}

          <StatStrip stats={auto.stats} />

          <Opportunities items={editorial.opportunities} />

          {editorial.sponsorThanks ? (
            <SponsorThanks text={editorial.sponsorThanks} />
          ) : null}

          {showReconfirmAsk ? (
            <ReconfirmAsk href={RECONFIRM_URL_PLACEHOLDER} />
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
