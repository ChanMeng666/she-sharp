/**
 * Pick the music window for a cut whose beat grid is already fixed.
 *
 * Given the track's tempo and beat phase, and the frame at which the video's
 * biggest moment lands, this finds bar-aligned start times that put the track's
 * largest energy jump on that moment. Bar-aligned matters twice over: the
 * window has to start on a beat for the video's cuts to land on beats at all,
 * and on a bar for the music to sound like it starts rather than resumes.
 *
 * Usage: node tools/find-window.mjs "<audio>" <bpm> <phaseSeconds> <hitSeconds> <videoSeconds>
 */
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [input, bpmArg, phaseArg, hitArg, videoArg] = process.argv.slice(2);
const BPM = Number(bpmArg);
const PHASE = Number(phaseArg);
const HIT = Number(hitArg);
const VIDEO_S = Number(videoArg);

const SR = 8000;
const raw = join(tmpdir(), `win-${process.pid}.raw`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", raw]);
const buf = readFileSync(raw);
unlinkSync(raw);
const n = Math.floor(buf.length / 2);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768;
const duration = n / SR;

// RMS in 50ms hops.
const HOP = Math.round(SR * 0.05);
const frames = Math.floor(n / HOP);
const env = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = f * HOP; i < (f + 1) * HOP; i++) s += x[i] * x[i];
  env[f] = Math.sqrt(s / HOP);
}
const tOf = (f) => f * 0.05;
const fOf = (t) => Math.round(t / 0.05);
const mean = (t0, t1) => {
  const a = Math.max(0, fOf(t0));
  const z = Math.min(frames, fOf(t1));
  let s = 0;
  for (let f = a; f < z; f++) s += env[f];
  return s / Math.max(1, z - a);
};

// --- the biggest sustained energy jump in the track ---
console.log("energy jumps (2s after vs 2s before, top 10)");
const jumps = [];
for (let f = fOf(4); f < frames - fOf(4); f++) {
  const before = mean(tOf(f) - 2, tOf(f));
  const after = mean(tOf(f), tOf(f) + 2);
  jumps.push({ t: tOf(f), ratio: after / (before + 1e-9) });
}
// Keep only local maxima at least 3s apart so one drop is not listed 40 times.
jumps.sort((a, b) => b.ratio - a.ratio);
const drops = [];
for (const j of jumps) {
  if (drops.every((d) => Math.abs(d.t - j.t) > 3)) drops.push(j);
  if (drops.length === 10) break;
}
for (const d of drops) console.log(`  ${d.t.toFixed(2).padStart(7)}s   x${d.ratio.toFixed(3)}`);

// --- bar-aligned window starts, scored on how well the drop lands on HIT ---
const beat = 60 / BPM;
const bar = beat * 4;
console.log(`\nbeat ${beat.toFixed(4)}s   bar ${bar.toFixed(4)}s   phase ${PHASE}s`);
console.log(`want the drop at video ${HIT.toFixed(2)}s, window length ${VIDEO_S}s\n`);

const rows = [];
for (let m = 0; ; m++) {
  const start = PHASE + m * bar;
  if (start + VIDEO_S + 0.3 > duration) break;
  const hitAt = start + HIT;
  // Nearest real drop to where the title lands.
  const nearest = drops.reduce((p, c) => (Math.abs(c.t - hitAt) < Math.abs(p.t - hitAt) ? c : p));
  const offset = hitAt - nearest.t;
  const intro = mean(start, start + HIT - 1);
  const body = mean(start + HIT, start + VIDEO_S);
  rows.push({ start, offset, lift: body / (intro + 1e-9), dropRatio: nearest.ratio, dropAt: nearest.t });
}
rows.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset) || b.lift - a.lift);
console.log("  start      drop at    title lands   lift after title   drop strength");
for (const r of rows.slice(0, 10)) {
  console.log(
    `  ${r.start.toFixed(3).padStart(8)}s  ${r.dropAt.toFixed(2).padStart(7)}s   ${(r.offset >= 0 ? "+" : "") + r.offset.toFixed(3)}s`.padEnd(48) +
      `${r.lift.toFixed(3).padStart(8)}x        x${r.dropRatio.toFixed(2)}`,
  );
}
