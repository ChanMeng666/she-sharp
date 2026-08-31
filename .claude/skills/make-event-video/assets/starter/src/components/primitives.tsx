import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, color, neonGlow } from "../theme";
import { font } from "../fonts";

/**
 * Type rises into place from behind a mask. `mask` has to be switched off for
 * anything with a glow or a descender that matters, because the same
 * overflow:hidden that makes the reveal crisp also clips bloom.
 */
export const Reveal: React.FC<{
  delay?: number;
  duration?: number;
  mask?: boolean;
  distance?: number;
  children: React.ReactNode;
}> = ({ delay = 0, duration = 24, mask = true, distance = 110, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.7, stiffness: 105 },
    durationInFrames: duration,
  });
  const opacity = interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  const inner = (
    <div
      style={{
        transform: `translateY(${(1 - p) * (mask ? distance : distance * 0.35)}${mask ? "%" : "px"})`,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );

  if (!mask) return inner;
  // The mask has to clear the deepest descender at display size, or "everyone's
  // job." comes out with the j and y sliced flat. Negative margin keeps the
  // extra room from opening a gap in the stack.
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.26em", marginBottom: "-0.18em" }}>
      {inner}
    </div>
  );
};

/** Scales in with a little overshoot. Used for the title and for face cards. */
export const PopIn: React.FC<{
  delay?: number;
  from?: number;
  children: React.ReactNode;
}> = ({ delay = 0, from = 0.86, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 120 },
  });
  return (
    <div
      style={{
        transform: `scale(${interpolate(p, [0, 1], [from, 1])})`,
        opacity: interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{
  children: React.ReactNode;
  size?: number;
  tone?: string;
}> = ({ children, size = 26, tone = color.neonPink }) => (
  <div
    style={{
      fontFamily: font.sans,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: size * 0.16,
      textTransform: "uppercase",
      color: tone,
      lineHeight: 1.1,
    }}
  >
    {children}
  </div>
);

export const Display: React.FC<{
  children: React.ReactNode;
  size: number;
  tone?: string;
  weight?: 600 | 700 | 800;
  align?: "left" | "center";
}> = ({ children, size, tone = color.white, weight = 800, align = "center" }) => (
  <div
    style={{
      fontFamily: font.display,
      fontWeight: weight,
      fontSize: size,
      lineHeight: 0.98,
      letterSpacing: -size * 0.022,
      color: tone,
      textAlign: align,
      textWrap: "balance",
    }}
  >
    {children}
  </div>
);

/**
 * A headline as explicit lines, each masked and staggered.
 *
 * Lines are passed in rather than left to the browser to wrap: the same string
 * breaks in different places at 1080 and at 1920 wide, and a mask reveal on a
 * block that silently became three lines looks like a bug.
 */
export const RevealLines: React.FC<{
  lines: readonly string[];
  size: number;
  tone?: string;
  delay?: number;
  stagger?: number;
  weight?: 600 | 700 | 800;
  align?: "left" | "center";
}> = ({ lines, size, tone = color.white, delay = 0, stagger = 5, weight = 800, align = "center" }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
    {lines.map((line, i) => (
      <Reveal key={line + i} delay={delay + i * stagger}>
        <div
          style={{
            fontFamily: font.display,
            fontWeight: weight,
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: -size * 0.022,
            color: tone,
            textAlign: align,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      </Reveal>
    ))}
  </div>
);

export const Body: React.FC<{
  children: React.ReactNode;
  size: number;
  tone?: string;
  weight?: 400 | 500 | 600;
}> = ({ children, size, tone = alpha.body, weight = 500 }) => (
  <div
    style={{
      fontFamily: font.sans,
      fontWeight: weight,
      fontSize: size,
      lineHeight: 1.34,
      color: tone,
      textAlign: "center",
      textWrap: "pretty",
    }}
  >
    {children}
  </div>
);

/**
 * The poster's neon lock-up. A blurred copy sits behind the crisp one so the
 * bloom survives H.264, which flattens a plain text-shadow into a grey halo.
 */
export const NeonText: React.FC<{
  children: React.ReactNode;
  size: number;
  tone?: string;
}> = ({ children, size, tone = color.neonPink }) => {
  const base: React.CSSProperties = {
    fontFamily: font.display,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 0.92,
    letterSpacing: -size * 0.028,
    color: tone,
    textTransform: "uppercase",
    textAlign: "center",
    whiteSpace: "nowrap",
  };
  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden
        style={{
          ...base,
          position: "absolute",
          inset: 0,
          filter: `blur(${size * 0.06}px)`,
          opacity: 0.75,
        }}
      >
        {children}
      </div>
      <div style={{ ...base, position: "relative", textShadow: neonGlow }}>{children}</div>
    </div>
  );
};

/** The periwinkle slab under "Getting Fit for AI" on the poster. */
export const Chip: React.FC<{
  children: React.ReactNode;
  size: number;
  bg?: string;
  tone?: string;
}> = ({ children, size, bg = color.periwinkleDeep, tone = color.periwinkle }) => (
  <div
    style={{
      display: "inline-block",
      background: bg,
      color: tone,
      fontFamily: font.display,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: size * 0.01,
      textTransform: "uppercase",
      padding: `${size * 0.3}px ${size * 0.62}px ${size * 0.36}px`,
      borderRadius: size * 0.28,
      whiteSpace: "nowrap",
      boxShadow: `0 ${size * 0.2}px ${size * 0.7}px rgba(0,0,0,0.35)`,
    }}
  >
    {children}
  </div>
);

export const Hairline: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: width * p,
        height: 2,
        background: `linear-gradient(90deg, ${color.hotPink}, ${color.periwinkle})`,
        borderRadius: 2,
      }}
    />
  );
};
