// Curated timeline-year archive photography — one small real photo per
// milestone year, optimised to a single 768px webp rendition (q75).
// Sourced from the She Sharp Google Photos event albums; NOT part of the
// main curated set. Keyed by the timeline milestone year.

export type ArchivePhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const archivePhotos = {
  "2014": {
    src: "/img/curated/archive/2014-768.webp",
    width: 768,
    height: 512,
    alt: "She Sharp community members mingling and networking together in a room at an early She Sharp launch gathering.",
  },
  "2015": {
    src: "/img/curated/archive/2015-768.webp",
    width: 768,
    height: 512,
    alt: "Attendees gathered beside a She Sharp 'connecting women in technology' banner at the Wellington launch with Xero.",
  },
  "2016": {
    src: "/img/curated/archive/2016-768.webp",
    width: 768,
    height: 512,
    alt: "She Sharp attendees chatting together in front of a large Google logo wall at an evening event.",
  },
  "2017": {
    src: "/img/curated/archive/2017-768.webp",
    width: 768,
    height: 432,
    alt: "A group of She Sharp attendees standing together outdoors under trees during the Auckland Tech Grand Tour.",
  },
  "2020": {
    src: "/img/curated/archive/2020-768.webp",
    width: 768,
    height: 512,
    alt: "Two She Sharp attendees in conversation, wearing event name badges, at a workshop session.",
  },
  "2022": {
    src: "/img/curated/archive/2022-768.webp",
    width: 768,
    height: 576,
    alt: "Attendees gathered in an event space beside a bright screen reading 'Female Led Hackathon' at the She Sharp hackathon.",
  },
  "2023": {
    src: "/img/curated/archive/2023-768.webp",
    width: 768,
    height: 512,
    alt: "Two She Sharp participants collaborating over a tablet at a table during a 2023 event.",
  },
  "2024": {
    src: "/img/curated/archive/2024-768.webp",
    width: 768,
    height: 512,
    alt: "She Sharp members posing together at a pink floral photo wall during the 10-Year Anniversary celebration.",
  },
  "2025": {
    src: "/img/curated/archive/2025-768.webp",
    width: 768,
    height: 512,
    alt: "She Sharp members networking together in a bright room at the academyEX International Women's Day event.",
  },
} as const satisfies Record<string, ArchivePhoto>;

export type ArchivePhotoYear = keyof typeof archivePhotos;
