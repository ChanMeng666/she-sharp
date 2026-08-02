// Generated background plates for presentation decks.
//
// Source: gpt-image-2, 1536×1024, converted to WebP at 1920 and 1280.
//
// These exist because the photographic archive does not contain them. A survey
// of 835 images found exactly one contemplative natural frame in the whole
// collection, and no landscape, coastline, sky or dawn of any kind — every
// photograph is indoors under artificial light. A karakia needs somewhere quiet
// to sit, and there was nowhere.
//
// Scope is deliberately narrow. These are whenua — land, water, plants, light —
// which is what the karakia itself speaks about. Nothing here depicts people,
// and nothing here imitates taonga: no carving, no woven pattern, no moko, no
// motif belonging to any iwi. Generating those would be appropriation dressed
// up as art direction. Generating an image that could be mistaken for a
// photograph of a real She Sharp event would be worse; the archive is real and
// must stay that way.

export type DeckPlate = {
  src: string;
  srcSet: Record<string, string>;
  width: number;
  height: number;
  /** `whenua` sits behind ceremony; `light` sits behind chapter breaks. */
  role: "whenua" | "light";
  /** Where the frame is empty, and therefore where type can go. */
  clearSpace: "left" | "right" | "top" | "bottom" | "most";
  alt: string;
};

export const deckPlates = {
  "whenua-pounamu-sea": {
    src: "/img/plates/whenua-pounamu-sea-1920.webp",
    srcSet: {
      "1920": "/img/plates/whenua-pounamu-sea-1920.webp",
      "1280": "/img/plates/whenua-pounamu-sea-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "whenua",
    clearSpace: "left",
    // Chosen for the opening karakia because the karakia's own second line is
    // "Kia whakapapa pounamu te moana" — may the sea be like greenstone.
    alt: "A calm dark sea at first light, the water deep greenstone green, one slow swell rising on the right beneath low cloud.",
  },
  "whenua-koru-unfurl": {
    src: "/img/plates/whenua-koru-unfurl-1920.webp",
    srcSet: {
      "1920": "/img/plates/whenua-koru-unfurl-1920.webp",
      "1280": "/img/plates/whenua-koru-unfurl-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "whenua",
    clearSpace: "left",
    alt: "A single silver fern frond unfurling, the tight spiral backlit against soft dark green and gold.",
  },
  "whenua-harakeke-dusk": {
    src: "/img/plates/whenua-harakeke-dusk-1920.webp",
    srcSet: {
      "1920": "/img/plates/whenua-harakeke-dusk-1920.webp",
      "1280": "/img/plates/whenua-harakeke-dusk-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "whenua",
    clearSpace: "left",
    alt: "Harakeke blades silhouetted against a deep dusk sky, their edges catching the last light.",
  },
  "light-aurora-sweep": {
    src: "/img/plates/light-aurora-sweep-1920.webp",
    srcSet: {
      "1920": "/img/plates/light-aurora-sweep-1920.webp",
      "1280": "/img/plates/light-aurora-sweep-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "light",
    clearSpace: "most",
    alt: "A sweep of magenta and pale green light across a near-black field, like an aurora seen through frosted glass.",
  },
  "light-prism-edge": {
    src: "/img/plates/light-prism-edge-1920.webp",
    srcSet: {
      "1920": "/img/plates/light-prism-edge-1920.webp",
      "1280": "/img/plates/light-prism-edge-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "light",
    clearSpace: "most",
    alt: "A single thin blade of refracted light crossing a black field on a steep diagonal.",
  },
  "light-deep-field": {
    src: "/img/plates/light-deep-field-1920.webp",
    srcSet: {
      "1920": "/img/plates/light-deep-field-1920.webp",
      "1280": "/img/plates/light-deep-field-1280.webp",
    },
    width: 1920,
    height: 1280,
    role: "light",
    clearSpace: "most",
    alt: "A faint bloom of purple light low in a violet-black field, falling away into darkness.",
  },
} satisfies Record<string, DeckPlate>;

export type DeckPlateKey = keyof typeof deckPlates;

/** Responsive `srcSet` attribute for a plate. */
export function plateSrcSet(plate: DeckPlate): string {
  return Object.entries(plate.srcSet)
    .map(([width, src]) => `${src} ${width}w`)
    .join(", ");
}
