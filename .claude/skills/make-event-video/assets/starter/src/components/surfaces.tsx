import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { color } from "../theme";

/** Static, low-opacity grain. Animating it per frame doubles the bitrate. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{ backgroundImage: GRAIN, backgroundSize: "260px 260px", opacity, mixBlendMode: "overlay" }}
  />
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 90% at 50% 42%, transparent 38%, rgba(5,5,18,${strength}) 100%)`,
    }}
  />
);

/**
 * The navy stage every graphic scene sits on. Two slow-drifting colour blooms
 * keep a flat background from looking like a dead PowerPoint slide.
 */
export const Backdrop: React.FC<{ dur: number; tint?: "magenta" | "periwinkle" }> = ({
  dur,
  tint = "magenta",
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1]);
  const glow = tint === "magenta" ? color.magenta : color.periwinkleDeep;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(168deg, ${color.navy}, ${color.navyInk})` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 46% at ${22 + t * 12}% ${18 + t * 8}%, ${glow}66, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 42% at ${82 - t * 10}% ${84 - t * 9}%, ${color.periwinkleDeep}59, transparent 72%)`,
        }}
      />
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * Full-bleed photograph with a slow push and drift.
 *
 * Only ever used for the adults-only frames. `dur` is passed in because inside
 * a Sequence useVideoConfig() reports the composition's length, not the
 * scene's.
 */
export const KenBurns: React.FC<{
  src: string;
  dur: number;
  from?: number;
  to?: number;
  focus?: [number, number];
  drift?: [number, number];
  scrim?: "bottom" | "full" | "none";
}> = ({ src, dur, from = 1.05, to = 1.2, focus = [0.5, 0.42], drift = [0, 0], scrim = "bottom" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(t, [0, 1], [from, to]);

  return (
    <AbsoluteFill style={{ backgroundColor: color.navyInk, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${drift[0] * t}px, ${drift[1] * t}px)`,
          willChange: "transform",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
          }}
        />
      </AbsoluteFill>

      {scrim !== "none" && (
        <AbsoluteFill
          style={{
            background:
              scrim === "full"
                ? `linear-gradient(180deg, rgba(11,11,28,0.62) 0%, rgba(11,11,28,0.32) 45%, rgba(11,11,28,0.86) 100%)`
                : `linear-gradient(180deg, rgba(11,11,28,0.30) 0%, transparent 34%, rgba(11,11,28,0.55) 66%, rgba(11,11,28,0.92) 100%)`,
          }}
        />
      )}
      <Vignette strength={0.42} />
      <Grain opacity={0.045} />
    </AbsoluteFill>
  );
};

/**
 * A wide photograph shown whole inside a rounded frame.
 *
 * This is the required treatment for the two 2024 group shots that include
 * children in the front row: the published frame is a wide group shot, and
 * cropping into it for a full-bleed Ken Burns could make a child the subject.
 * Presenting it uncropped keeps it exactly as published. The very slight scale
 * is on the card, not a crop of the photograph.
 */
export const PhotoCard: React.FC<{
  src: string;
  dur: number;
  radius?: number;
  maxWidth: number;
}> = ({ src, dur, radius = 28, maxWidth }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: maxWidth,
        transform: `scale(${interpolate(t, [0, 1], [1, 1.035])})`,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: `0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.10)`,
        willChange: "transform",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

/** Circular portrait with a brand ring. Used for both speaker line-ups. */
export const Portrait: React.FC<{ src: string; size: number; ring?: string }> = ({
  src,
  size,
  ring = color.hotPink,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: `0 0 0 3px ${ring}, 0 18px 40px rgba(0,0,0,0.45)`,
      background: color.navyDeep,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 28%" }}
    />
  </div>
);
