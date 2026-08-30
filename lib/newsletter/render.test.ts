/**
 * Runnable render checks — no test framework.
 *
 *   npx tsx lib/newsletter/render.test.ts
 *
 * Builds a representative issue and asserts the unsubscribe placeholder per
 * mode (in the HTML *and* the plain-text part), that no Resend merge tag
 * survives, size budget, absolute image URLs, presence of the signature
 * gradient, the real-photo cover, that NO photo carries a caption, and that
 * the NZ Tech Pulse never names a source.
 */

import assert from "node:assert";
import { UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/unsubscribe-headers";
import { newsletterIssueSchema, type NewsletterIssueData } from "./schema";
import { renderNewsletter } from "./render";

/** A real (non-AI) cover photo URL, unique so it can be asserted present/absent. */
const COVER_URL = "https://www.shesharp.org.nz/img/newsletter/cover-june.jpg";

/** The founder's signature headshot, unique so the avatar row can be asserted. */
const FOUNDER_PHOTO_URL =
  "https://www.shesharp.org.nz/img/newsletter/founder-signature.jpg";

/**
 * The two recap event titles, reused verbatim as the photos' `alt` text —
 * which is the whole of the no-caption rule: no photo carries visible text,
 * and its `alt` identifies the event and describes nothing.
 *
 * They double as the caption detectors. Each title is printed once as VISIBLE
 * text by its own recap card, so with the `alt` attributes stripped out of the
 * html each must still appear exactly once; a second occurrence is a caption
 * rendered under a photo.
 */
const NETWORKING_TITLE = "June Networking Night";
const WORKSHOP_TITLE = "Intro to Data Science Workshop";

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
      alt: NETWORKING_TITLE,
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
        title: NETWORKING_TITLE,
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
        title: WORKSHOP_TITLE,
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
        alt: NETWORKING_TITLE,
        eventSlug: "june-networking",
      },
      {
        src: "https://www.shesharp.org.nz/img/events/two.jpg",
        alt: NETWORKING_TITLE,
        eventSlug: "june-networking",
      },
      {
        src: "https://www.shesharp.org.nz/img/events/three.jpg",
        alt: WORKSHOP_TITLE,
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

/** Eyebrow copy unique to the headline block, so it can be asserted absent. */
const HEADLINE_EYEBROW = "Next up this month";

/** Bite URLs unique per item, so all three can be asserted present. */
const BITE_URLS = [
  "https://itbrief.co.nz/story/bite-one",
  "https://itbrief.co.nz/story/bite-two",
  "https://itbrief.co.nz/story/bite-three",
];

/**
 * A copy of `sample` promoting one upcoming event to the headline block and
 * carrying a three-item news list, to prove the marquee plate renders, the
 * promoted event leaves the "What's next" list, and the bites stack.
 */
const sampleHeadline: NewsletterIssueData = newsletterIssueSchema.parse({
  ...sample,
  editorial: {
    ...sample.editorial,
    headline: {
      eventSlug: "july-panel",
      eyebrow: HEADLINE_EYEBROW,
      dateBadge: { day: "7-8", month: "AUG" },
      blurb: "Four AI leaders, one evening, and the questions you actually want answered.",
      ctaLabel: "Save my seat",
      ctaHref: null,
    },
    pulse: {
      ...sample.editorial.pulse,
      newsBites: BITE_URLS.map((url, i) => ({
        title: `Bite ${i + 1} headline`,
        summary: `Bite ${i + 1} summary sentence.`,
        sourceLabel: "IT Brief NZ",
        url,
        dateLabel: `${i + 1} Jul`,
      })),
    },
  },
});

/** The two halves of a two-paragraph recap blurb, asserted to stay apart. */
const BLURB_P1 = "First paragraph of the recap blurb.";
const BLURB_P2 = "Second paragraph of the recap blurb.";

/** Unique to the recap video block, so it can be asserted present and absent. */
const RECAP_VIDEO_URL = "https://youtu.be/render-test-recap";
const RECAP_VIDEO_TITLE = "Festival Recap — the test venue";

/**
 * A copy of `sample` carrying a recap video and a two-paragraph event blurb,
 * to prove the video panel renders as a link (email cannot play video) and
 * that a blank line in a blurb becomes real markup rather than collapsing to a
 * space, which is what an HTML renderer does to it by default.
 */
const sampleRecapVideo: NewsletterIssueData = newsletterIssueSchema.parse({
  ...sample,
  editorial: {
    ...sample.editorial,
    recapVideo: { url: RECAP_VIDEO_URL, title: RECAP_VIDEO_TITLE },
    eventBlurbs: {
      "june-networking": `${BLURB_P1}\n\n${BLURB_P2}`,
    },
  },
});

/** Counts non-overlapping occurrences of a literal string. */
function countOccurrences(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

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

/**
 * The html with every `alt="…"` attribute removed — i.e. what a sighted reader
 * actually sees. Alt text is allowed to name the event; visible text under a
 * photo is not, and stripping the attributes is what tells the two apart.
 */
function visibleOnly(html: string): string {
  return html.replace(/\salt="[^"]*"/gi, "");
}

/**
 * Matches a Pulse source link's label followed by its arrow. React Email emits
 * a `<!-- -->` separator between two adjacent text nodes, so the arrow is never
 * literally adjacent to the label in the rendered html.
 */
function arrowAfter(label: string): RegExp {
  return new RegExp(`${label}(?:<!-- -->)?\\s*(?:→|&#x2192;)`);
}

/** Counts <img> tags whose alt attribute is exactly the given text. */
function countImgAlt(html: string, text: string): number {
  return [...html.matchAll(/<img[^>]*\salt="([^"]*)"/gi)].filter(
    (m) => m[1] === text
  ).length;
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

  // The unsubscribe placeholder is emitted only in broadcast mode; the send
  // path swaps it for a signed per-recipient URL.
  assert.ok(
    broadcast.html.includes(UNSUBSCRIBE_URL_PLACEHOLDER),
    "broadcast html must contain the unsubscribe placeholder"
  );
  assert.ok(
    !preview.html.includes(UNSUBSCRIBE_URL_PLACEHOLDER),
    "preview html must NOT contain the unsubscribe placeholder"
  );

  // No Resend merge tag may survive anywhere in the broadcast output. This is
  // the assertion that actually protects real inboxes: merge tags are only
  // substituted for broadcasts sent to Resend-held contacts, so on the batch
  // path any surviving tag ships as literal text.
  assert.ok(
    !broadcast.html.includes("{{{"),
    "broadcast html must contain no Resend merge tag"
  );

  // Personalisation is gone in both modes — the batch path renders once for
  // everyone, so everyone gets the same greeting.
  for (const [label, rendered] of [
    ["broadcast", broadcast],
    ["preview", preview],
  ] as const) {
    assert.ok(
      rendered.html.includes("Hi there,"),
      `${label} html must greet with "Hi there,"`
    );
    assert.ok(
      !rendered.html.includes("contact.first_name"),
      `${label} html must NOT contain the first-name merge tag`
    );
  }

  // The plain-text part, which `@react-email/render` builds from the same
  // element: it writes the raw href into the text, so a template whose HTML
  // was fixed but whose text was not would ship the literal placeholder to
  // plain-text readers.
  assert.ok(
    broadcast.text.includes(UNSUBSCRIBE_URL_PLACEHOLDER),
    "broadcast text must contain the unsubscribe placeholder"
  );
  assert.ok(
    !broadcast.text.includes("{{{"),
    "broadcast text must contain no Resend merge tag"
  );
  assert.ok(
    !preview.text.includes(UNSUBSCRIBE_URL_PLACEHOLDER),
    "preview text must NOT contain the unsubscribe placeholder"
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

  // The Pulse links to its sources but never names them. `sourceLabel` stays in
  // the data — it is the provenance record `check-facts.ts` and `lint-pulse.ts`
  // read — and the link carries the attribution, so the copy does not repeat it.
  for (const label of [
    sample.editorial.pulse!.heroStat.sourceLabel,
    sample.editorial.pulse!.newsBite!.sourceLabel,
    sample.editorial.pulse!.didYouKnow!.sourceLabel,
  ]) {
    assert.ok(
      !preview.html.includes(label),
      `pulse must not name its source in the copy → ${label}`
    );
    assert.ok(
      !preview.text.includes(label),
      `pulse must not name its source in the plain-text part → ${label}`
    );
  }
  assert.ok(
    preview.html.includes(">Source<") || preview.html.includes(">Source "),
    "the hero stat's source link must read \"Source\""
  );
  assert.ok(
    preview.html.includes("(Source)"),
    'the "Did you know?" source link must read "(Source)"'
  );
  // A news bite with no dateLabel falls back to "Source" rather than rendering
  // a bare arrow — `sample`'s single bite is exactly that case.
  assert.ok(
    arrowAfter("Source").test(preview.html),
    'a news bite with no dateLabel must read "Source →"'
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

  // NO photograph carries a caption. Every caption the template used to print
  // was written about a frame rather than read off it, so the photograph now
  // runs on its own and the `alt` attribute is the only text about it.
  //
  // Three shapes, one per path that used to produce a caption:
  const previewVisible = visibleOnly(preview.html);
  //   1. the venue-grounded strip caption, built from a resolved eventSlug.
  assert.ok(
    !preview.html.includes("June Networking Night · AUT City Campus, Auckland"),
    "no venue-grounded caption may be rendered under a strip photo"
  );
  //   2. the strip's fallback caption — the photo's own alt, printed as text,
  //      for a photo whose eventSlug does not resolve.
  assert.strictEqual(
    countOccurrences(previewVisible, WORKSHOP_TITLE),
    1,
    "a strip photo's alt must not also be printed as visible text under it " +
      "(expected only the recap card's own mention of the event title)"
  );
  //   3. the italic caption under the photo of the month.
  assert.strictEqual(
    countOccurrences(previewVisible, NETWORKING_TITLE),
    1,
    "the photo of the month's alt must not also be printed as a caption " +
      "(expected only the recap card's own mention of the event title)"
  );
  // And the alt attributes are still there — a photo stripped of both its
  // caption and its alt is worse for a screen reader, not better.
  assert.ok(
    countImgAlt(preview.html, NETWORKING_TITLE) >= 1 &&
      countImgAlt(preview.html, WORKSHOP_TITLE) >= 1,
    "every photo must keep a non-empty alt naming its event"
  );
  assert.ok(
    ![...preview.html.matchAll(/<img[^>]*>/gi)].some(
      (m) => !/\salt="[^"]+"/i.test(m[0])
    ),
    "no <img> may render with a missing or empty alt"
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

  // Headline block: eyebrow, date badge and the editorial CTA label render on
  // the navy plate, and all three news bites stack under the list label.
  const headline = await renderNewsletter(sampleHeadline, "preview");
  assert.ok(
    headline.html.includes(HEADLINE_EYEBROW),
    "headline eyebrow must appear when editorial.headline is set"
  );
  assert.ok(
    headline.html.includes("7-8"),
    "headline date badge day must appear in the html"
  );
  assert.ok(
    headline.html.includes("Save my seat"),
    "headline CTA label must appear in the html"
  );
  for (const url of BITE_URLS) {
    assert.ok(
      headline.html.includes(url),
      `news bite url must appear in the html → ${url}`
    );
  }
  assert.ok(
    headline.html.includes("What we&#x27;re reading") ||
      headline.html.includes("What we're reading"),
    "multi-item news list label must appear when newsBites has more than one item"
  );
  // A bite WITH a dateLabel shows the dateline and the arrow — and still not
  // the publication's name.
  for (let i = 1; i <= BITE_URLS.length; i++) {
    assert.ok(
      arrowAfter(`${i} Jul`).test(headline.html),
      `news bite ${i} must read "${i} Jul →"`
    );
  }
  assert.ok(
    !headline.html.includes("IT Brief NZ"),
    "a news bite must not name its publication"
  );

  // The promoted event is dropped from the "What's next" list, so its title is
  // rendered exactly once (by the headline plate).
  assert.strictEqual(
    countOccurrences(headline.html, "Women in AI Panel"),
    1,
    "the promoted event's title must appear exactly once (dropped from upcoming)"
  );

  // Navy plate and mint accent colors are present.
  for (const hex of ["#1f1e44", "#b1f6e9"]) {
    assert.ok(
      headline.html.toLowerCase().includes(hex),
      `headline html must contain ${hex}`
    );
  }

  // No SVG anywhere — Outlook does not render it.
  assert.ok(
    !headline.html.includes(".svg"),
    "no SVG asset may appear in the rendered html"
  );

  // Without a headline the block auto-hides and the "What's next" card keeps
  // its own primary CTA button.
  assert.ok(
    !preview.html.includes(HEADLINE_EYEBROW),
    "headline eyebrow must NOT appear when editorial.headline is null"
  );
  assert.ok(
    preview.html.includes("See all upcoming events"),
    "primary CTA label must render when there is no headline block"
  );

  // Recap video: rendered as a plain anchor to the watch page — never an
  // embed, which every major client strips — and absent when unset.
  const video = await renderNewsletter(sampleRecapVideo, "preview");
  assert.ok(
    video.html.includes(`href="${RECAP_VIDEO_URL}"`),
    "recap video must render as a link to the watch page"
  );
  assert.ok(
    video.html.includes(RECAP_VIDEO_TITLE),
    "recap video title must appear in the html"
  );
  for (const tag of ["<video", "<iframe"]) {
    assert.ok(
      !video.html.includes(tag),
      `recap video must not render a ${tag}> — no email client plays it`
    );
  }
  assert.ok(
    !preview.html.includes("Watch the recap"),
    "recap video block must NOT render when editorial.recapVideo is null"
  );

  // A blank line inside an event blurb must become a paragraph break. HTML
  // collapses "\n\n" to a space, so a single <Text> would silently run the two
  // paragraphs together — the failure this asserts against.
  const [, afterFirst = ""] = video.html.split(BLURB_P1);
  const [betweenParagraphs = ""] = afterFirst.split(BLURB_P2);
  assert.ok(
    video.html.includes(BLURB_P1) && video.html.includes(BLURB_P2),
    "both blurb paragraphs must appear in the html"
  );
  assert.ok(
    betweenParagraphs.includes("</p>"),
    "a blank line in an event blurb must close the paragraph, not collapse to a space"
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
