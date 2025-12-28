import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { HTMLAttributes, useCallback, useMemo } from "react";

// Brand colors for beams
const BRAND_COLORS = [
  "#8982ff", // Periwinkle Dark
  "hsl(var(--brand))", // Brand Purple
  "#c846ab", // Purple Mid
  "#b1f6e9", // Mint Dark
  "#f7e5f3", // Purple Light
];

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  beamColors?: string[];
  showGrid?: boolean;
  gridColor?: string;
}

const Beam = ({
  width,
  x,
  delay,
  duration,
  colors,
}: {
  width: string | number;
  x: string | number;
  delay: number;
  duration: number;
  colors: string[];
}) => {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const ar = Math.floor(Math.random() * 10) + 1;

  return (
    <motion.div
      style={
        {
          "--x": `${x}`,
          "--width": `${width}`,
          "--aspect-ratio": `${ar}`,
          "--background": `linear-gradient(${color}, transparent)`,
        } as React.CSSProperties
      }
      className={`absolute left-[var(--x)] top-0 [aspect-ratio:1/var(--aspect-ratio)] [background:var(--background)] [width:var(--width)]`}
      initial={{ y: "100cqmax", x: "-50%" }}
      animate={{ y: "-100%", x: "-50%" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  beamColors = BRAND_COLORS,
  showGrid = false,
  gridColor = "transparent",
  ...props
}) => {
  const generateBeams = useCallback(() => {
    const beams = [];
    const cellsPerSide = Math.floor(100 / beamSize);
    const step = cellsPerSide / beamsPerSide;

    for (let i = 0; i < beamsPerSide; i++) {
      const x = Math.floor(i * step);
      const delay =
        Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin;
      beams.push({ x, delay });
    }
    return beams;
  }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin]);

  const topBeams = useMemo(() => generateBeams(), [generateBeams]);
  const rightBeams = useMemo(() => generateBeams(), [generateBeams]);
  const bottomBeams = useMemo(() => generateBeams(), [generateBeams]);
  const leftBeams = useMemo(() => generateBeams(), [generateBeams]);

  const gridBackground = showGrid
    ? `linear-gradient(${gridColor} 0 1px, transparent 1px var(--beam-size)) 50% -0.5px / var(--beam-size) var(--beam-size), linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px var(--beam-size)) 50% 50% / var(--beam-size) var(--beam-size)`
    : "none";

  return (
    <div className={cn("relative", className)} {...props}>
      <div
        style={
          {
            "--perspective": `${perspective}px`,
            "--grid-color": gridColor,
            "--beam-size": `${beamSize}%`,
          } as React.CSSProperties
        }
        className={
          "pointer-events-none absolute left-0 top-0 size-full overflow-hidden [clip-path:inset(0)] [container-type:size] [perspective:var(--perspective)] [transform-style:preserve-3d]"
        }
      >
        {/* top side */}
        <div
          className="absolute [transform-style:preserve-3d] [container-type:inline-size] [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]"
          style={{ background: gridBackground }}
        >
          {topBeams.map((beam, index) => (
            <Beam
              key={`top-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              colors={beamColors}
            />
          ))}
        </div>
        {/* bottom side */}
        <div
          className="absolute top-full [transform-style:preserve-3d] [container-type:inline-size] [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]"
          style={{ background: gridBackground }}
        >
          {bottomBeams.map((beam, index) => (
            <Beam
              key={`bottom-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              colors={beamColors}
            />
          ))}
        </div>
        {/* left side */}
        <div
          className="absolute left-0 top-0 [transform-style:preserve-3d] [container-type:inline-size] [height:100cqmax] [transform-origin:0%_0%] [transform:rotate(90deg)_rotateX(-90deg)] [width:100cqh]"
          style={{ background: gridBackground }}
        >
          {leftBeams.map((beam, index) => (
            <Beam
              key={`left-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              colors={beamColors}
            />
          ))}
        </div>
        {/* right side */}
        <div
          className="absolute right-0 top-0 [transform-style:preserve-3d] [container-type:inline-size] [height:100cqmax] [width:100cqh] [transform-origin:100%_0%] [transform:rotate(-90deg)_rotateX(-90deg)]"
          style={{ background: gridBackground }}
        >
          {rightBeams.map((beam, index) => (
            <Beam
              key={`right-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              colors={beamColors}
            />
          ))}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};
