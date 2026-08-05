/**
 * Reads a deck's accent colour off the event poster.
 *
 * Usage:
 *   npx tsx scripts/deck/accent-from-poster.ts <event-slug>
 *
 * Prints the `theme` block to paste into the deck file. It does not edit the
 * deck: which of an event's images is "the poster" is occasionally a judgement
 * call, and the colour is the one thing on a deck an organiser has an opinion
 * about, so it is offered rather than applied.
 *
 * Why this exists: taking the accent from the poster was the last step in the
 * skill that needed a person to look at an image and name a colour, and the
 * failure mode was silent — a colour picked by eye off a dark poster lands
 * under the contrast floor and is unreadable from the back of the room, which
 * nobody notices until the night. `accentFromBrandColour()` already fixes
 * luminance; all that was missing was the hue.
 *
 * The method: downsample hard, drop pixels that are nearly black, nearly white
 * or nearly grey, then take the most common remaining hue weighted by
 * saturation. Posters are mostly type on a flat ground, so the modal saturated
 * hue is the brand colour rather than the background.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { loadEventForDeck, coverImageFrom, posterImageFrom } from "@/lib/deck/event-source";
import { accentFromBrandColour, checkAccentContrast } from "@/lib/deck/theme";

/** Pixels below this saturation are ground, not brand. */
const MIN_SATURATION = 0.25;
/** Pixels outside this lightness band are ink or paper. */
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.94;

function toHsl(r: number, g: number, b: number): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) hue = ((bn - rn) / delta + 2) / 6;
  else hue = ((rn - gn) / delta + 4) / 6;

  return [hue * 360, saturation, lightness];
}

function toHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const channel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** One colour the poster might be "about". */
interface Candidate {
  hex: string;
  /** Share of the poster's coloured pixels sitting in this hue. */
  share: number;
  /** Mean vividness — what makes a colour read as the brand rather than ground. */
  vividness: number;
}

/**
 * The poster's candidate accents, most likely first.
 *
 * Deliberately a ranked list rather than one answer. A poster has a ground, a
 * panel and a title, and which of them is "the brand colour" is a judgement:
 * the Les Mills poster is a navy field holding a teal photo panel and a neon
 * pink headline, and picking by area alone returns the navy — the one colour
 * a designer would never have chosen, because it is the background.
 *
 * So the ranking scores area *and* vividness, and prints the runners-up with
 * it. Offering three is honest about the ambiguity and costs the organiser one
 * glance; asserting one and being wrong costs a deck in the wrong colour.
 */
async function candidateAccents(file: string): Promise<Candidate[]> {
  const { data, info } = await sharp(file)
    .resize(128, 128, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /* 24 buckets of 15 degrees — finer than the eye cares about at this scale. */
  const counts = new Array(24).fill(0);
  const vivid = new Array(24).fill(0);
  const saturations = new Array(24).fill(0);
  const lightnesses = new Array(24).fill(0);
  let coloured = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const [h, s, l] = toHsl(data[i], data[i + 1], data[i + 2]);
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;

    const bucket = Math.floor(h / 15) % 24;
    counts[bucket] += 1;
    /* Vividness peaks at mid lightness — a navy and a neon pink can share a
       saturation reading, and only one of them is an accent. */
    vivid[bucket] += s * (1 - Math.abs(2 * l - 1));
    saturations[bucket] += s;
    lightnesses[bucket] += l;
    coloured += 1;
  }
  if (coloured === 0) return [];

  return counts
    .map((count, index) => ({ index, count }))
    .filter((entry) => entry.count > coloured * 0.02)
    .map(({ index, count }) => {
      const saturation = Math.min(0.95, Math.max(0.4, saturations[index] / count));
      const lightness = Math.min(0.62, Math.max(0.36, lightnesses[index] / count));
      return {
        hex: toHex(index * 15 + 7.5, saturation, lightness),
        share: count / coloured,
        vividness: vivid[index] / count,
        score: (count / coloured) * (vivid[index] / count),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ hex, share, vividness }) => ({ hex, share, vividness }));
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/deck/accent-from-poster.ts <event-slug>");
    process.exit(1);
  }

  const event = loadEventForDeck(slug);
  const image = posterImageFrom(event) ?? coverImageFrom(event);
  if (!image) {
    console.error(
      `"${slug}" has no poster and no cover image in its event data, so there is ` +
        "nothing to read a colour from. Keep the She Sharp purple.",
    );
    process.exit(1);
  }

  const file = join(process.cwd(), "public", image.src.replace(/^\//, ""));
  if (!existsSync(file)) {
    console.error(`${image.src} is in the event data but not on disk.`);
    process.exit(1);
  }

  const candidates = await candidateAccents(file);
  if (candidates.length === 0) {
    console.error(
      "That poster is effectively greyscale — no colour worth taking. Keep the She Sharp purple.",
    );
    process.exit(1);
  }

  console.log(`Poster: ${image.src}`);
  console.log("");
  console.log(
    "Candidates, most likely first. Look at the poster before you choose — the",
  );
  console.log(
    "largest area is usually the background, which is the one colour never to take.",
  );
  console.log("");

  candidates.forEach((candidate, index) => {
    const accent = accentFromBrandColour(candidate.hex, "#5ee7f5");
    const checks = checkAccentContrast({ accent });
    const readable = checks.every((check) => check.passes);

    console.log(
      `  ${index + 1}. ${candidate.hex}  ${Math.round(candidate.share * 100)}% of the poster's colour` +
        `${index === 0 ? "   <- best guess" : ""}`,
    );
    console.log(`       onLight: "${accent.onLight}",  onDark: "${accent.onDark}"`);
    console.log(
      `       ${checks
        .map((check) => `${check.tone} ${check.ratio.toFixed(2)}:1`)
        .join(", ")}${readable ? "" : "  — TOO LOW, do not use"}`,
    );
    console.log("");
  });

  const best = accentFromBrandColour(candidates[0].hex, "#5ee7f5");
  console.log("  theme: {");
  console.log("    accent: {");
  console.log(`      onLight: "${best.onLight}",`);
  console.log(`      onDark: "${best.onDark}",`);
  console.log(`      spark: "${best.spark}",`);
  console.log("    },");
  console.log("  },");
  console.log("");
  console.log(
    "Tell the organiser in plain words, never in numbers: \"I've taken the pink",
  );
  console.log(
    "from your poster and lightened it for the dark slides so it reads from the back.\"",
  );
}

void main();
