/**
 * Sample hex colours from an event poster so the video matches the campaign.
 *
 * Usage (from the she-sharp repo root):
 *   node .claude/skills/make-event-video/scripts/sample-poster-colors.mjs public/img/events/<slug>/poster.webp
 */
import sharp from "sharp";

const file = process.argv[2];
if (!file) {
  console.error("pass a poster path");
  process.exit(1);
}

const img = sharp(file);
const { width, height } = await img.metadata();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

const at = (label, fx, fy) => {
  const x = Math.min(info.width - 1, Math.max(0, Math.round(fx * info.width)));
  const y = Math.min(info.height - 1, Math.max(0, Math.round(fy * info.height)));
  const i = (y * info.width + x) * info.channels;
  const hex =
    "#" +
    [data[i], data[i + 1], data[i + 2]]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
  console.log(label.padEnd(24), hex, `(${x},${y})`);
};

console.log(`poster ${width}x${height} channels=${info.channels}\n`);
at("page background", 0.02, 0.02);
at("page bg lower", 0.5, 0.98);
at("mid field", 0.5, 0.45);
at("title / accent guess", 0.5, 0.55);
at("chip / slab guess", 0.5, 0.72);
at("cta / button guess", 0.5, 0.95);
