/**
 * Runnable render checks — no test framework.
 *
 *   npx tsx lib/newsletter/render.test.ts
 *
 * Builds a representative issue and asserts merge-tag behaviour per mode,
 * size budget, absolute image URLs, presence of the signature gradient, the
 * real-photo cover, and venue-grounded snapshot captions.
 */

import assert from "node:assert";
import { newsletterIssueSchema, type NewsletterIssueData } from "./schema";
import { renderNewsletter } from "./render";

/** A real (non-AI) cover photo URL, unique so it can be asserted present/absent. */
const COVER_URL = "https://www.shesharp.org.nz/img/newsletter/cover-june.jpg";

/** The founder's signature headshot, unique so the avatar row can be asserted. */
const FOUNDER_PHOTO_URL =
  "https://www.shesharp.org.nz/img/newsletter/founder-signature.jpg";

const sample: NewsletterIssueData = newsletterIssueSchema.parse({
  id: "2026-07",
  meta: {
    status: "draft",
    generatedAt: "2026-07-01T00:00:00.000Z",
    broadcastId: null,
    scheduledAt: null,
  },
  editorial: {
    subjectLine: "She Sharp — July highlights & what's next",
    previewText:
      "Last month's wins, community photos, and the events you won't want to miss.",
    founderNote: {
      heading: "A note from our founder",
      bodyMd:
        "Winter has been buzzing at She Sharp. We welcomed new mentees, ran two sold-out events, and saw our community grow.\n\nRead more on our [events page](https://www.shesharp.org.nz/events) — there's a lot to be proud of.",
      signature: "— Medhavi, Founder",
      photoUrl: FOUNDER_PHOTO_URL,
    },
    photoOfTheMonth: {
      src: "https://www.shesharp.org.nz/img/events/cover.jpg",
      caption: "Our June networking night at AUT City Campus.",
    },
    recapIntro: "Here's what we got up to last month.",
    eventBlurbs: {
      "june-networking": "150+ women connected over kai and career talks.",
    },
    primaryCta: {
      label: "See all upcoming events",
      href: "https://www.shesharp.org.nz/events",
    },
    opportunities: [
      {
        title: "Become a mentor",
        body: "Share your experience with the next generation of women in STEM.",
        href: "https://www.shesharp.org.nz/mentorship/mentor",
      },
    ],
    sponsorThanks:
      "Huge thanks to our sponsors whose support makes every event possible.",
    heroImageUrl: COVER_URL,
    pulse: {
      heroStat: {
        value: "3.3%",
        label: "of NZ job ads now reference AI skills",
        context:
          "Job ads that reference AI skills increased 3.9% month-on-month and now make up 3.3% of total job ads.",
        sourceLabel: "SEEK NZ Employment Report",
        sourceUrl:
          "https://www.seek.co.nz/about/news/article/seeknz-employment-report-may26",
      },
      newsBite: {
        title:
          "Beyond automation: Why AI is forcing us to rethink how work gets done",
        summary:
          "Businesses that treat AI as a mere efficiency tool risk missing bigger gains from redesigning how work actually happens.",
        sourceLabel: "IT Brief NZ",
        url: "https://itbrief.co.nz/story/beyond-automation-why-ai-is-forcing-us-to-rethink-how-work-gets-done",
      },
      didYouKnow: {
        text: "NZ's tech 'skills shortage' is really a skills mismatch — the greatest unmet demand is for senior, experienced people.",
        sourceLabel: "NZTech Digital Skills Aotearoa",
        sourceUrl:
          "https://technewzealand.org.nz/reports/digital-skills-for-tomorrow-today-report/",
      },
    },
  },
  auto: {
    recapEvents: [
      {
        slug: "june-networking",
        title: "June Networking Night",
        dateLabel: "Thursday, June 26",
        startIso: "2026-06-26T18:00:00+12:00",
        timeLabel: "6:00 PM",
        locationLabel: "AUT City Campus, Auckland",
        coverImageUrl: "https://www.shesharp.org.nz/img/events/june.jpg",
        url: "https://www.shesharp.org.nz/events/june-networking",
        registrationUrl: null,
        shortDescription: "An evening of connection and career talks.",
      },
      {
        slug: "june-workshop",
        title: "Intro to Data Science Workshop",
        dateLabel: "Saturday, June 14",
        startIso: "2026-06-14T10:00:00+12:00",
        timeLabel: "10:00 AM",
        locationLabel: "Online",
        coverImageUrl: "https://www.shesharp.org.nz/img/events/workshop.jpg",
        url: "https://www.shesharp.org.nz/events/june-workshop",
        registrationUrl: null,
        shortDescription: "Hands-on introduction to data science.",
      },
    ],
    upcomingEvents: [
      {
        slug: "july-panel",
        title: "Women in AI Panel",
        dateLabel: "Wednesday, July 30",
        startIso: "2026-07-30T18:30:00+12:00",
        timeLabel: "6:30 PM",
        locationLabel: "Microsoft Auckland",
        coverImageUrl: "https://www.shesharp.org.nz/img/events/panel.jpg",
        url: "https://www.shesharp.org.nz/events/july-panel",
        registrationUrl: "https://www.shesharp.org.nz/events/july-panel",
        shortDescription: "Leaders in AI share their journeys.",
      },
      {
        slug: "august-mentoring",
        title: "Mentoring Kickoff",
        dateLabel: "Tuesday, August 5",
        startIso: null,
        timeLabel: null,
        locationLabel: "Online",
        coverImageUrl: null,
        url: "https://www.shesharp.org.nz/events/august-mentoring",
        registrationUrl: null,
        shortDescription: "Meet your mentor and set goals for the season.",
      },
    ],
    stats: { members: "3000+", sponsors: "50+", events: "94+" },
    photoStrip: [
      {
        src: "https://www.shesharp.org.nz/img/events/one.jpg",
        alt: "Members networking at the June event",
        eventSlug: "june-networking",
      },
      {
        src: "https://www.shesharp.org.nz/img/events/two.jpg",
        alt: "Speakers on stage during the panel",
        eventSlug: "june-networking",
      },
      {
        src: "https://www.shesharp.org.nz/img/events/three.jpg",
        alt: "Attendees collaborating in the workshop",
      },
    ],
    photoAlbumUrl: "https://photos.google.com/share/example-album",
  },
});

/**
 * A copy of `sample` with the photo strip cleared and no cover photo, to prove
 * both the snapshots section and the cover are omitted when absent.
 */
const sampleNoStrip: NewsletterIssueData = newsletterIssueSchema.parse({
  ...sample,
  editorial: { ...sample.editorial, heroImageUrl: null },
  auto: { ...sample.auto, photoStrip: [], photoAlbumUrl: null },
});

/** A strip src duplicated within the strip and against another strip entry. */
const DUP_STRIP_URL = "https://www.shesharp.org.nz/img/events/dup.jpg";
/** A strip src that is unique and must survive the dedupe. */
const UNIQUE_STRIP_URL = "https://www.shesharp.org.nz/img/events/unique.jpg";

/**
 * A copy of `sample` whose photo strip collides with the cover (heroImageUrl)
 * and contains an internal duplicate, to prove the no-repeat guard drops the
 * cover collision and de-duplicates within the strip.
 */
const sampleDupePhotos: NewsletterIssueData = newsletterIssueSchema.parse({
  ...sample,
  auto: {
    ...sample.auto,
    photoStrip: [
      { src: COVER_URL, alt: "same as the cover photo" },
      { src: DUP_STRIP_URL, alt: "first copy of a repeated photo" },
      { src: DUP_STRIP_URL, alt: "second copy of a repeated photo" },
      { src: UNIQUE_STRIP_URL, alt: "a one-off photo" },
    ],
  },
});

function assertAllImagesHttps(html: string, label: string): void {
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]*)"/gi)].map((m) => m[1]);
  assert.ok(srcs.length > 0, `${label}: expected at least one <img>`);
  for (const src of srcs) {
    assert.ok(
      src.startsWith("https://"),
      `${label}: image src is not https → ${src}`
    );
  }
}

/** Counts how many <img> tags carry exactly the given src URL. */
function countImgSrc(html: string, url: string): number {
  return [...html.matchAll(/<img[^>]+src="([^"]*)"/gi)].filter(
    (m) => m[1] === url
  ).length;
}

async function main(): Promise<void> {
  const broadcast = await renderNewsletter(sample, "broadcast");
  const preview = await renderNewsletter(sample, "preview");

  // Merge tags present only in broadcast mode.
  assert.ok(
    broadcast.html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}"),
    "broadcast html must contain the Resend unsubscribe merge tag"
  );
  assert.ok(
    broadcast.html.includes("{{{contact.first_name|there}}}"),
    "broadcast html must contain the first-name merge tag"
  );
  assert.ok(
    !preview.html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}"),
    "preview html must NOT contain the unsubscribe merge tag"
  );
  assert.ok(
    !preview.html.includes("{{{contact.first_name|there}}}"),
    "preview html must NOT contain the first-name merge tag"
  );

  // Size budget.
  assert.ok(
    broadcast.sizeKb < 100,
    `broadcast html should be < 100KB, got ${broadcast.sizeKb.toFixed(1)}KB`
  );
  assert.ok(
    preview.sizeKb < 100,
    `preview html should be < 100KB, got ${preview.sizeKb.toFixed(1)}KB`
  );

  // All images absolute https.
  assertAllImagesHttps(broadcast.html, "broadcast");
  assertAllImagesHttps(preview.html, "preview");

  // Signature gradient hex colors present.
  for (const hex of ["#9b2e83", "#8982ff", "#b1f6e9"]) {
    assert.ok(
      broadcast.html.toLowerCase().includes(hex),
      `broadcast html must contain gradient color ${hex}`
    );
  }

  // NZ Tech Pulse: the headline stat and its source link are rendered.
  assert.ok(
    preview.html.includes("3.3%"),
    "pulse hero stat value must appear in the html"
  );
  assert.ok(
    preview.html.includes(
      "https://www.seek.co.nz/about/news/article/seeknz-employment-report-may26"
    ),
    "pulse hero stat source URL must appear in the html"
  );
  assert.ok(
    preview.html.includes("NZ Tech Pulse"),
    "pulse section kicker must appear in the html"
  );

  // Photo strip: each photo <img> and the album link are present.
  for (const src of [
    "https://www.shesharp.org.nz/img/events/one.jpg",
    "https://www.shesharp.org.nz/img/events/two.jpg",
    "https://www.shesharp.org.nz/img/events/three.jpg",
  ]) {
    assert.ok(
      preview.html.includes(src),
      `photo strip image must appear in the html → ${src}`
    );
  }
  assert.ok(
    preview.html.includes("https://photos.google.com/share/example-album"),
    "photo album link must appear in the html"
  );
  assert.ok(
    preview.html.includes("Snapshots"),
    "photo strip section kicker must appear when photos are present"
  );

  // Snapshot captions are venue-grounded: "<short event title> · <location>",
  // resolved from the photo's matching recap event.
  assert.ok(
    preview.html.includes("June Networking Night · AUT City Campus, Auckland"),
    "venue-grounded caption must appear for a strip photo with a matching recap event"
  );

  // No legacy AI-art asset paths survive anywhere in the output. The needle is
  // assembled from parts so this guard does not itself contain the literal.
  const legacyAssetPath = ["assets", "v1"].join("/");
  for (const html of [broadcast.html, preview.html]) {
    assert.ok(
      !html.includes(legacyAssetPath),
      "no legacy AI-art asset URL may appear in the rendered html"
    );
  }

  // Cover photo: present when heroImageUrl is set.
  assert.ok(
    preview.html.includes(COVER_URL),
    "cover photo must render when heroImageUrl is set"
  );

  // Founder signature avatar: rendered beside the signature when photoUrl is set.
  assert.ok(
    preview.html.includes(FOUNDER_PHOTO_URL),
    "founder signature headshot must render when founderNote.photoUrl is set"
  );

  // Photo no-repeat guard: a strip src equal to the cover is dropped, and an
  // internal duplicate collapses to a single render.
  const dupe = await renderNewsletter(sampleDupePhotos, "preview");
  assert.strictEqual(
    countImgSrc(dupe.html, COVER_URL),
    1,
    "cover url must appear once (the strip copy colliding with the cover is dropped)"
  );
  assert.strictEqual(
    countImgSrc(dupe.html, DUP_STRIP_URL),
    1,
    "a strip src duplicated within the strip must render exactly once"
  );
  assert.strictEqual(
    countImgSrc(dupe.html, UNIQUE_STRIP_URL),
    1,
    "a unique strip src must survive the dedupe"
  );

  // Photo strip and cover are omitted entirely when absent.
  const noStrip = await renderNewsletter(sampleNoStrip, "preview");
  assert.ok(
    !noStrip.html.includes("Snapshots"),
    "photo strip section must NOT render when photoStrip is empty"
  );
  assert.ok(
    !noStrip.html.includes("https://photos.google.com/share/example-album"),
    "photo album link must NOT render when photoStrip is empty"
  );
  assert.ok(
    !noStrip.html.includes(COVER_URL),
    "cover photo must NOT render when heroImageUrl is null"
  );

  console.log("PASS render.test.ts");
  console.log(
    `  broadcast: ${broadcast.sizeKb.toFixed(1)}KB · preview: ${preview.sizeKb.toFixed(1)}KB`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
