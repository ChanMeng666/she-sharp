/**
 * Find the tempo and the best 30-second window in a music track.
 *
 * The edit assumes 120 BPM and puts the title card at 11.0s, so a usable
 * window is one that is quiet for its first ~9 seconds and loud from ~11s. This
 * measures that instead of guessing, and reports the tempo so we know whether
 * the beat grid the edit was cut to actually matches the track.
 *
 * Usage: node tools/analyze-music.mjs "<path to audio>" [videoSeconds]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const input = process.argv[2];
const VIDEO_S = Number(process.argv[3] ?? 30);
if (!input) throw new Error("pass an audio path");

const SR = 8000;
const wav = join(tmpdir(), `analyze-${process.pid}.raw`);

// Mono, 8kHz, headerless signed 16-bit. -vn drops the embedded cover art.
execFileSync("ffmpeg", [
  "-y", "-v", "error", "-i", input,
  "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", wav,
]);

const buf = readFileSync(wav);
unlinkSync(wav);
const n = Math.floor(buf.length / 2);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768;
const duration = n / SR;

// --- envelope: RMS in 10ms hops ---
const HOP = Math.round(SR * 0.01);
const frames = Math.floor(n / HOP);
const env = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = f * HOP; i < (f + 1) * HOP; i++) s += x[i] * x[i];
  env[f] = Math.sqrt(s / HOP);
}

// --- onset strength: half-wave rectified first difference of log envelope ---
const onset = new Float32Array(frames);
for (let f = 1; f < frames; f++) {
  const d = Math.log10(env[f] + 1e-6) - Math.log10(env[f - 1] + 1e-6);
  onset[f] = d > 0 ? d : 0;
}

// --- tempo: autocorrelation of the onset envelope over 60-200 BPM ---
const mean = onset.reduce((a, b) => a + b, 0) / frames;
const centred = Float32Array.from(onset, (v) => v - mean);
let best = { bpm: 0, score: -Infinity };
const results = [];
/*
 * Fractional lag with linear interpolation. Rounding the lag to whole 10ms
 * frames makes several neighbouring BPM values share one lag, which turns the
 * curve into plateaus and hides every local peak.
 */
for (let bpm = 60; bpm <= 200; bpm += 0.05) {
  const lag = (60 / bpm) * 100;
  const l0 = Math.floor(lag);
  const frac = lag - l0;
  let s = 0;
  let count = 0;
  for (let f = 0; f + l0 + 1 < frames; f++) {
    const shifted = centred[f + l0] * (1 - frac) + centred[f + l0 + 1] * frac;
    s += centred[f] * shifted;
    count++;
  }
  s /= count;
  results.push({ bpm, score: s });
  if (s > best.score) best = { bpm, score: s };
}
console.log(`duration      ${duration.toFixed(1)}s`);
console.log(`tempo (raw)   ${best.bpm.toFixed(2)} BPM`);

/*
 * Autocorrelation peaks at the bar as readily as at the beat, so the raw
 * maximum is often a half or quarter of the real tempo. Print the distinct
 * local peaks and let the shape of the list decide.
 */
const peaks = results
  .filter((c, i) => i > 1 && i < results.length - 2 && c.score > results[i - 1].score && c.score > results[i + 1].score)
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);
console.log("\ntempo candidates (autocorrelation peaks)");
for (const p of peaks) {
  console.log(`  ${p.bpm.toFixed(2).padStart(7)} BPM   score ${p.score.toExponential(3)}   x2 = ${(p.bpm * 2).toFixed(2)}`);
}

/*
 * Decide between octave/sidelobe candidates.
 *
 * A correct tempo holds phase across the whole track: the best beat phase found
 * in the first third and the last third agree. A tempo that is off by even a
 * fraction of a percent drifts, so its two phases disagree and its comb score
 * over the full track is much weaker than over a short span.
 */
const combScore = (bpm, t0, t1) => {
  const beatFrames = (60 / bpm) * 100;
  const a = Math.round(t0 * 100);
  const z = Math.min(frames, Math.round(t1 * 100));
  let bestPhase = 0;
  let bestSum = -Infinity;
  for (let p = 0; p < Math.round(beatFrames); p++) {
    let s = 0;
    for (let f = a + p; f < z; f += beatFrames) s += onset[Math.round(f)] ?? 0;
    const norm = s / ((z - a) / beatFrames);
    if (norm > bestSum) {
      bestSum = norm;
      bestPhase = p;
    }
  }
  return { score: bestSum, phase: bestPhase / 100 };
};

console.log("\ntempo disambiguation (beat-grid phase lock)");
console.log("  bpm      full-track   first-third  last-third   phase(1st)  phase(3rd)  drift");
const probe = process.argv[4]
  ? process.argv[4].split(",").map(Number)
  : [123.7, 125.0, 124.0, 123.0, 126.0];
for (const bpm of probe) {
  const full = combScore(bpm, 0, duration);
  const p1 = combScore(bpm, 0, duration / 3);
  const p3 = combScore(bpm, (2 * duration) / 3, duration);
  const beatLen = 60 / bpm;
  let drift = Math.abs(p1.phase - p3.phase);
  drift = Math.min(drift, beatLen - drift);
  console.log(
    `  ${bpm.toFixed(2).padStart(6)}  ${full.score.toFixed(4).padStart(11)}  ${p1.score.toFixed(4).padStart(12)}  ${p3.score.toFixed(4).padStart(10)}  ${p1.phase.toFixed(3).padStart(10)}s ${p3.phase.toFixed(3).padStart(10)}s  ${drift.toFixed(3)}s`,
  );
}

// --- arrangement map: mean RMS per 2 seconds, as a bar chart ---
const BLOCK = 2;
const blocks = Math.floor(duration / BLOCK);
const level = [];
for (let b = 0; b < blocks; b++) {
  let s = 0;
  const a = b * BLOCK * 100;
  const z = Math.min((b + 1) * BLOCK * 100, frames);
  for (let f = a; f < z; f++) s += env[f];
  level.push(s / (z - a));
}
const peak = Math.max(...level);
console.log("\narrangement (2s blocks, bar = RMS relative to loudest block)");
level.forEach((v, b) => {
  const bars = "#".repeat(Math.round((v / peak) * 44));
  console.log(String(b * BLOCK).padStart(4) + "s " + bars);
});

// --- best window: quiet intro, loud from the title beat ---
const rmsBetween = (t0, t1) => {
  const a = Math.max(0, Math.round(t0 * 100));
  const z = Math.min(frames, Math.round(t1 * 100));
  let s = 0;
  for (let f = a; f < z; f++) s += env[f];
  return s / Math.max(1, z - a);
};

const beat = 60 / best.bpm;
const bar = beat * 4;
const candidates = [];
for (let start = 0; start + VIDEO_S <= duration; start += bar) {
  const intro = rmsBetween(start, start + 9);
  const drop = rmsBetween(start + 11, start + 22);
  const body = rmsBetween(start, start + VIDEO_S);
  // Reward the lift into the title, and reward overall energy so we do not
  // pick a window that is merely quiet-then-slightly-less-quiet.
  candidates.push({ start, lift: drop / (intro + 1e-6), body, score: (drop / (intro + 1e-6)) * Math.pow(body / peak, 1.5) });
}
candidates.sort((a, b) => b.score - a.score);

console.log(`\ntop windows for a ${VIDEO_S}s cut (bar = ${bar.toFixed(3)}s)`);
console.log("  start    lift(11-22s vs 0-9s)   body level   score");
for (const c of candidates.slice(0, 8)) {
  console.log(
    `  ${c.start.toFixed(2).padStart(7)}s  ${c.lift.toFixed(2).padStart(10)}x  ${(c.body / peak).toFixed(3).padStart(12)}  ${c.score.toFixed(3).padStart(8)}`,
  );
}
