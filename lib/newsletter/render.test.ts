/**
 * Runnable render checks — no test framework.
 *
 *   npx tsx lib/newsletter/render.test.ts
 *
 * Builds a representative issue and asserts merge-tag behaviour per mode,
 * size budget, absolute image URLs, and presence of the signature gradient.
 */

import assert from "node:assert";
import { newsletterIssueSchema, type NewsletterIssueData } from "./schema";
import { renderNewsletter } from "./render";

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
      "A spotlight, last month's wins, and the events you won't want to miss.",
    founderNote: {
      heading: "A note from our founder",
      bodyMd:
        "Winter has been buzzing at She Sharp. We welcomed new mentees, ran two sold-out events, and saw our community grow.\n\nRead more on our [events page](https://www.shesharp.org.nz/events) — there's a lot to be proud of.",
      signature: "— Medhavi, Founder",
    },
    spotlight: {
      name: "Aria Chen",
      role: "Mentee · Software Engineering",
      photoUrl: "https://www.shesharp.org.nz/img/team/placeholder.png",
      qa: [
        {
          q: "What drew you to She Sharp?",
          a: "The community — I finally felt like I belonged in tech.",
        },
        {
          q: "Best advice you've received?",
          a: "Ask the question. Someone else is always wondering the same thing.",
        },
      ],
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

  console.log("PASS render.test.ts");
  console.log(
    `  broadcast: ${broadcast.sizeKb.toFixed(1)}KB · preview: ${preview.sizeKb.toFixed(1)}KB`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
