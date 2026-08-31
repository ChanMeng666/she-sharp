/**
 * Brand tokens for this event's video.
 *
 * Sample these from the event's own poster (see the skill's
 * scripts/sample-poster-colors.mjs) rather than eyeballing. The video and the
 * poster then read as one campaign. The keys are stable; the hex values are not.
 */
export const color = {
  navy: "#1E1F45",
  navyDeep: "#14152F",
  navyInk: "#0B0B1C",
  magenta: "#A6318C",
  magentaDeep: "#843277",
  neonPink: "#ED94DB",
  hotPink: "#E85FC0",
  periwinkle: "#8F8EE8",
  periwinkleDeep: "#3E448B",
  teal: "#7EABB3",
  white: "#FFFFFF",
} as const;

export const alpha = {
  /** Body copy on navy. Full white at small sizes vibrates on video. */
  body: "rgba(255,255,255,0.78)",
  faint: "rgba(255,255,255,0.55)",
  hairline: "rgba(255,255,255,0.16)",
} as const;

/**
 * Neon bloom for a title lock-up. Two shadow rings plus a blurred ghost layer
 * behind the text; a single text-shadow reads flat once H.264 has chewed on it.
 */
export const neonGlow = [
  `0 0 18px rgba(237,148,219,0.55)`,
  `0 0 54px rgba(237,148,219,0.32)`,
  `0 0 120px rgba(232,95,192,0.22)`,
].join(", ");

export const FPS = 30;

/**
 * Soundtrack tempo, measured from the file rather than assumed.
 *
 * Ask Suno for 120 BPM. Then run tools/analyze-music.mjs on what comes back
 * and put the measured value here. The edit is cut to the music — scene
 * lengths are declared in beats in Promo.tsx — so a 124 BPM track with a
 * 120 BPM edit drifts by a beat every 7.5 seconds.
 *
 * At 30fps, frames-per-beat is usually not an integer. Cut positions are
 * rounded from each scene's absolute beat index so error does not accumulate.
 */
export const BPM = 120;
export const FRAMES_PER_BEAT = (60 / BPM) * FPS;
export const BEAT = Math.round(FRAMES_PER_BEAT);
