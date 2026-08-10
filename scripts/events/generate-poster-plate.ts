/**
 * Generates the textless background plate for an event poster, with gpt-image-2.
 *
 * WHY A PLATE AND NOT A POSTER. Asking an image model for "a poster" gets you a
 * poster: invented signage, invented logos, and lettering that is the right
 * shape from three metres and gibberish from one. Everything a reader has to
 * *read* — the title, the date, the venue, the two marks — is set in code by
 * `build-event-poster.ts` against the event's own record. This script's only
 * job is the picture underneath, and its prompt says so in the house rules that
 * every generated asset in this repo carries: no people, no text, no logos.
 *
 * WHY IT WRITES CANDIDATES AND NOT AN ANSWER. Nothing here picks a plate. It
 * writes N of them to `tmp/plates/` with a contact sheet and, for each, the mean
 * luminance of the two rectangles the type will actually land in. A plate that
 * looks best on its own is regularly the one that eats the headline, so the
 * choice is made looking at the numbers and the sheet together — and then passed
 * to stage two by hand.
 *
 *   npx tsx scripts/events/generate-poster-plate.ts <event-slug> --probe
 *   npx tsx scripts/events/generate-poster-plate.ts <event-slug> [--n 4] [--size WxH]
 *
 * `--probe` first, always. See PROBE below.
 */

import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import OpenAI from "openai";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "tmp/plates");

/**
 * The non-streaming params type, named so the right overload is selected.
 *
 * `images.generate()` is overloaded on `stream`, and passing a widened object
 * resolves to the union of both returns — at which point `.data` does not exist
 * on the result, because the streaming half is an event stream. Naming the
 * non-streaming params keeps `data` where it belongs. The `model` field is typed
 * `(string & {}) | ImageModel | null`, which is why "gpt-image-2" needs no cast
 * and the SDK needs no bump.
 */
type GenParams = OpenAI.Images.ImageGenerateParamsNonStreaming;

/**
 * The model, pinned by name.
 *
 * `openai@6.9.1` types `model` as `(string & {}) | ImageModel | null`, so this
 * needs no cast and the SDK needs no bump — the union's string branch is there
 * precisely so a new model name does not require a client release.
 */
const MODEL = "gpt-image-2";

/**
 * Portrait size. 1024×1536 is the portrait twin of the 1536×1024 that produced
 * the six deck plates in `public/img/plates/` — see the provenance comment at
 * the top of that manifest.
 *
 * If `--probe` finds a larger long edge, pass it with `--size`: stage two then
 * downscales instead of upscaling, which is strictly better and costs nothing.
 */
const DEFAULT_SIZE = "1024x1536";

/**
 * Everything here is a guess about gpt-image-2's parameter vocabulary, which is
 * why it is one object rather than inline literals. On a 400 the request is
 * retried once with this whole block stripped, and the parameter set that
 * actually worked is printed — so an unsupported field is a one-line fix here
 * rather than an afternoon.
 */
const TUNABLES = {
  quality: "high",
  output_format: "png",
} as const;

/**
 * The prompt, in the house shape from
 * `.claude/skills/build-event-slides/references/assets.md`: the subject framed
 * as a photographer would frame it, then the clear space named explicitly, then
 * the house rules verbatim.
 *
 * Three things are deliberate.
 *
 * The words "poster", "background" and "design" appear nowhere. They are what
 * makes a generator invent signage and lettering, and lettering is the one thing
 * this image must not have.
 *
 * "Muscle" is a simile for the *form* of the braid, not an instruction to render
 * anatomy. The subject named first and named last is glass. The event is a
 * fitness company talking about AI; the picture has to carry both without
 * putting a body in the frame, and a bundle of lit fibres arranged like a
 * fascicle is the one object that is honestly both.
 *
 * The clear space is named twice and in two places, because the poster and the
 * 4:5 cover put type in different parts of the frame. Ask for one empty region
 * and you get a beautiful image with the subject dead centre and nowhere to set
 * a word.
 */
const PROMPTS: Record<string, string> = {
  fibre: [
    "A macro photograph of a sculptural braid of fibre-optic strands lit from within.",
    "Dozens of fine glass filaments are bundled and twisted around each other like the",
    "fascicles of a muscle, the bundle running diagonally up through the upper third of",
    "the frame; points of light travel along the inside of the strands and bloom softly",
    "where the bundle crosses itself. Shot on a macro lens at a wide aperture — one plane",
    "of the braid is razor sharp and everything in front of and behind it falls away into",
    "deep bokeh. The light inside the fibres is magenta and cyan; the field around them is",
    "near-black.",
    "",
    "The bottom half of the frame is empty near-black, with only a faint magenta haze low",
    "down. A clear strip across the very top of the frame is unlit near-black. Both are",
    "empty space for type.",
    "",
    "Photographic, not illustration. No people, no faces, no text, no logos. Cinematic,",
    "restrained. Fine natural film grain, deep blacks, no oversaturation.",
  ].join(" "),
};

/**
 * Where the type lands, as fractions of the plate.
 *
 * These are the two regions stage two darkens and sets copy into — the poster's
 * lower half and the cover's mid band. Reporting their mean luminance turns
 * "which of these four" from taste into a number: a plate whose headline box
 * reads 0.28 will need a heavier scrim than one that reads 0.06, and one that
 * reads 0.5 is not a candidate at all.
 */
const TYPE_ZONES: Record<string, { top: number; bottom: number }> = {
  "poster lower half": { top: 0.5, bottom: 1.0 },
  "cover mid band": { top: 0.33, bottom: 0.62 },
};

interface Cli {
  slug: string;
  n: number;
  size: string;
  probe: boolean;
  variant: string;
}

function parseCli(): Cli {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith("--"));

  if (!slug) {
    console.error(
      "Usage: npx tsx scripts/events/generate-poster-plate.ts <event-slug> [--probe] [--n 4] [--size 1024x1536]",
    );
    process.exit(1);
  }

  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  return {
    slug,
    n: Number(flag("n") ?? 4),
    size: flag("size") ?? DEFAULT_SIZE,
    probe: argv.includes("--probe"),
    variant: flag("variant") ?? "fibre",
  };
}

/**
 * Fails before the network call, and names the file.
 *
 * No placeholder, no silent fallback: a poster built on a plate that quietly
 * did not generate is worse than no poster, because it looks finished.
 */
function requireApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error(
      "OPENAI_API_KEY is not set.\n" +
        "It belongs in .env (and .env.local), both gitignored. Nothing here writes it for you.",
    );
    process.exit(1);
  }
  return key;
}

/** Pulls the image bytes out of whichever shape the API returned them in. */
async function bytesFrom(datum: {
  b64_json?: string | null;
  url?: string | null;
}): Promise<Buffer> {
  // `gpt-image-*` always returns base64 and ignores `response_format`, which is
  // a DALL·E-era field. The URL branch is three lines and removes a whole
  // failure class if that ever changes.
  if (datum.b64_json) return Buffer.from(datum.b64_json, "base64");
  if (datum.url) {
    const res = await fetch(datum.url);
    if (!res.ok) throw new Error(`Fetching ${datum.url} → ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Response carried neither b64_json nor url.");
}

/**
 * One generation, with the tunables stripped and retried once on a 400.
 *
 * The API names the offending field in its message, so that message is printed
 * verbatim rather than summarised — it is the only documentation of this
 * model's parameter vocabulary that this repo can obtain.
 */
async function generate(
  client: OpenAI,
  prompt: string,
  size: string,
): Promise<{ bytes: Buffer; params: GenParams; raw: unknown }> {
  // `size` is cast because the SDK's union is BEHIND the API: `openai@6.9.1`
  // knows only the DALL·E and gpt-image-1 sizes and stops at `1536x1024`, while
  // `--probe` established that gpt-image-2 renders 1536×2048 and 2048×3072 on
  // this account. Widening it here is the honest record of that gap — the
  // alternative is passing a size the model supports and being told by tsc that
  // it does not exist. Re-run `--probe` after any SDK bump.
  const base = {
    model: MODEL,
    prompt,
    size: size as GenParams["size"],
    n: 1,
  } satisfies GenParams;
  const attempts: GenParams[] = [{ ...base, ...TUNABLES } as GenParams, base];

  for (const params of attempts) {
    try {
      const result = await client.images.generate(params);
      const datum = result.data?.[0];
      if (!datum) throw new Error("Response carried no image.");
      return { bytes: await bytesFrom(datum), params, raw: result };
    } catch (error) {
      if (
        !(error instanceof OpenAI.APIError) ||
        error.status !== 400 ||
        params === base
      ) {
        throw error;
      }
      // Printed verbatim: the API names the offending field, and that message is
      // the only documentation of this model's parameter vocabulary this repo has.
      console.warn(`  ! 400 with tunables applied — ${error.message}`);
      console.warn("    retrying with the tunables stripped…");
    }
  }

  throw new Error("unreachable");
}

/**
 * Mean relative luminance of a horizontal band, 0–1.
 *
 * The `.toBuffer()` in the middle is not tidiness — it is the whole reason this
 * function is correct. **`sharp().stats()` reads the decoded INPUT image and
 * ignores everything queued in the pipeline**, so `sharp(png).extract(band).stats()`
 * silently measures the entire frame. The first run of this script reported the
 * poster's lower half and the cover's mid band as identical to three decimal
 * places on all four candidates, which is what that bug looks like: not an
 * error, just two different questions given the same answer. Extract, render,
 * then measure the render.
 *
 * Same family as the one-`resize()` gotcha in `scripts/deck/build-keynote-plate.ts`.
 */
async function bandLuminance(
  png: Buffer,
  top: number,
  bottom: number,
): Promise<number> {
  const meta = await sharp(png).metadata();
  const h = meta.height ?? 0;
  const y = Math.round(h * top);
  const band = await sharp(png)
    .extract({
      left: 0,
      top: y,
      width: meta.width ?? 0,
      height: Math.max(1, Math.round(h * bottom) - y),
    })
    .toBuffer();

  const stats = await sharp(band).stats();
  const [r, g, b] = stats.channels.map((c) => c.mean / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * PROBE. The one call worth making before spending on candidates.
 *
 * gpt-image-2's size vocabulary is not documented anywhere in this repo — the
 * plates manifest pins only 1536×1024. If the long edge goes past 1536 then
 * stage two's upscale disappears entirely, which is the single largest quality
 * win available here. Everything else in the probe is cheap information that
 * arrives on the same round trip.
 */
async function probe(client: OpenAI): Promise<void> {
  const sizes = ["1024x1536", "1536x2048", "2048x3072", "auto"];
  console.log(`Probing ${MODEL} sizes (one 400 is a normal answer here)…\n`);

  for (const size of sizes) {
    try {
      const result = await client.images.generate({
        model: MODEL,
        prompt: "A flat field of near-black. Nothing else.",
        size: size as GenParams["size"],
        n: 1,
      });
      const datum = result.data?.[0];
      const meta = datum ? await sharp(await bytesFrom(datum)).metadata() : null;
      console.log(`  ✓ ${size.padEnd(10)} → ${meta?.width}×${meta?.height}`);
    } catch (error) {
      const message =
        error instanceof OpenAI.APIError ? error.message : String(error);
      console.log(`  ✗ ${size.padEnd(10)} → ${message}`);
    }
  }

  console.log(
    "\nIf a long edge above 1536 came back, pass it with --size and drop the upscale in stage two.",
  );
}

/** A row of candidates at 384px wide, each with its index burned in. */
async function contactSheet(
  plates: { index: number; bytes: Buffer }[],
  file: string,
): Promise<void> {
  const W = 384;
  const tiles = await Promise.all(
    plates.map(async ({ index, bytes }) => {
      const scaled = await sharp(bytes).resize(W).png().toBuffer();
      const meta = await sharp(scaled).metadata();
      const label = `<svg width="${W}" height="72" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0b0a14"/>
        <text x="24" y="52" font-family="sans-serif" font-size="44" fill="#ffffff">${String(index).padStart(2, "0")}</text>
      </svg>`;
      return sharp({
        create: {
          width: W,
          height: (meta.height ?? 0) + 72,
          channels: 3,
          background: "#0b0a14",
        },
      })
        .composite([
          { input: Buffer.from(label), top: 0, left: 0 },
          { input: scaled, top: 72, left: 0 },
        ])
        .png()
        .toBuffer();
    }),
  );

  const height = (await sharp(tiles[0]).metadata()).height ?? 0;
  await sharp({
    create: {
      width: W * tiles.length,
      height,
      channels: 3,
      background: "#0b0a14",
    },
  })
    .composite(tiles.map((input, i) => ({ input, top: 0, left: i * W })))
    .png()
    .toFile(file);
}

async function main(): Promise<void> {
  const cli = parseCli();
  requireApiKey();
  const client = new OpenAI();

  if (cli.probe) {
    await probe(client);
    return;
  }

  const prompt = PROMPTS[cli.variant];
  if (!prompt) {
    console.error(
      `No prompt variant "${cli.variant}". Known: ${Object.keys(PROMPTS).join(", ")}`,
    );
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`${MODEL} · ${cli.size} · ${cli.n} candidates · "${cli.variant}"`);
  console.log(`→ ${path.relative(ROOT, OUT_DIR)}\n`);

  const written: { index: number; bytes: Buffer }[] = [];

  // Sequential, not `n: <count>`. One rejection then costs one candidate rather
  // than the batch, every candidate is on disk the moment it returns, and `n`
  // is one of the parameters whose support here is unverified.
  for (let i = 1; i <= cli.n; i++) {
    const stem = `${cli.slug}-${cli.variant}-${String(i).padStart(2, "0")}`;
    const png = path.join(OUT_DIR, `${stem}.png`);

    if (existsSync(png)) {
      console.log(`${stem} — already on disk, skipping`);
      continue;
    }

    try {
      const { bytes, params, raw } = await generate(client, prompt, cli.size);
      writeFileSync(png, bytes);
      writeFileSync(
        path.join(OUT_DIR, `${stem}.json`),
        JSON.stringify({ params, prompt, response: raw }, null, 2),
      );
      written.push({ index: i, bytes });

      const meta = await sharp(bytes).metadata();
      const zones = await Promise.all(
        Object.entries(TYPE_ZONES).map(async ([name, z]) => {
          const l = await bandLuminance(bytes, z.top, z.bottom);
          return `${name} ${l.toFixed(3)}`;
        }),
      );
      console.log(
        `${stem} — ${meta.width}×${meta.height}, ${Math.round(bytes.length / 1024)} kB · ${zones.join(" · ")}`,
      );
    } catch (error) {
      console.error(`${stem} — FAILED: ${(error as Error).message}`);
    }
  }

  if (written.length > 1) {
    const sheet = path.join(OUT_DIR, `${cli.slug}-${cli.variant}-sheet.png`);
    await contactSheet(written, sheet);
    console.log(`\ncontact sheet → ${path.relative(ROOT, sheet)}`);
  }

  console.log(
    "\nLower luminance under the type is better. Pick one, then:\n" +
      `  npx tsx scripts/events/build-event-poster.ts ${cli.slug} --plate <chosen>.png`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
