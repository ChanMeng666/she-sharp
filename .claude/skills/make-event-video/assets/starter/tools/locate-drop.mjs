/**
 * Locate a transient precisely, then report the beat-aligned window start that
 * lands it on a given video frame time.
 *
 * The coarse jump detector in find-window.mjs smooths over two seconds either
 * side, so it reports the middle of a rise rather than its edge. This measures
 * the steepest short-term rise inside a narrow search band instead.
 *
 * Usage: node tools/locate-drop.mjs "<audio>" <searchFrom> <searchTo> <bpm> <phase> <hitSeconds>
 */
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [input, fromArg, toArg, bpmArg, phaseArg, hitArg] = process.argv.slice(2);
const FROM = Number(fromArg);
const TO = Number(toArg);
const BPM = Number(bpmArg);
const PHASE = Number(phaseArg);
const HIT = Number(hitArg);

const SR = 16000;
const raw = join(tmpdir(), `drop-${process.pid}.raw`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", raw]);
const buf = readFileSync(raw);
unlinkSync(raw);
const n = Math.floor(buf.length / 2);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768;

// 10ms RMS.
const HOP = SR / 100;
const frames = Math.floor(n / HOP);
const env = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = f * HOP; i < (f + 1) * HOP; i++) s += x[i] * x[i];
  env[f] = Math.sqrt(s / HOP);
}

const win = (a, b) => {
  let s = 0;
  for (let f = Math.max(0, a); f < Math.min(frames, b); f++) s += env[f];
  return s / Math.max(1, Math.min(frames, b) - Math.max(0, a));
};

// Steepest rise: 300ms after vs 300ms before, stepped every 10ms.
let best = { t: 0, ratio: -Infinity };
const trace = [];
for (let f = Math.round(FROM * 100); f < Math.round(TO * 100); f++) {
  const ratio = win(f, f + 30) / (win(f - 30, f) + 1e-9);
  trace.push({ t: f / 100, ratio });
  if (ratio > best.ratio) best = { t: f / 100, ratio };
}

console.log(`steepest rise in ${FROM}-${TO}s:  ${best.t.toFixed(3)}s  (x${best.ratio.toFixed(2)} over 300ms)\n`);
console.log("rise profile (10ms steps, only where ratio > 1.15)");
for (const p of trace) {
  if (p.ratio > 1.15) console.log(`  ${p.t.toFixed(2)}s  x${p.ratio.toFixed(3)}`);
}

const beat = 60 / BPM;
const bar = beat * 4;
const nearestBeat = PHASE + Math.round((best.t - PHASE) / beat) * beat;
const nearestBar = PHASE + Math.round((best.t - PHASE) / bar) * bar;
console.log(`\nnearest beat line ${nearestBeat.toFixed(4)}s  (transient is ${((best.t - nearestBeat) * 1000).toFixed(0)}ms off)`);
console.log(`nearest bar line  ${nearestBar.toFixed(4)}s  (transient is ${((best.t - nearestBar) * 1000).toFixed(0)}ms off)`);

console.log(`\nto land this on video ${HIT.toFixed(4)}s:`);
for (const [label, target] of [["measured transient", best.t], ["nearest beat line", nearestBeat], ["nearest bar line", nearestBar]]) {
  const ideal = target - HIT;
  const k = Math.round((ideal - PHASE) / beat);
  const snapped = PHASE + k * beat;
  const err = (snapped + HIT - target) * 1000;
  console.log(
    `  ${label.padEnd(20)} ideal start ${ideal.toFixed(4)}s -> beat-aligned ${snapped.toFixed(4)}s  (beat ${k}, lands ${err >= 0 ? "+" : ""}${err.toFixed(0)}ms, bar-aligned: ${k % 4 === 0 ? "yes" : "no"})`,
  );
}
