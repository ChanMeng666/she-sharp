import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bauhaus Decoration Components
 * Bold geometric decorations extracted from Bauhaus SVG patterns.
 * Creates strong visual identity with layered geometric elements.
 */

interface BauhausProps {
  size?: number;
  color?: string;
  rotation?: number;
  className?: string;
}

/**
 * Quarter Circle - 90-degree arc segment
 */
export function BauhausQuarterCircle({
  size = 60,
  color = "hsl(var(--brand))",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M0 60C33.1371 60 60 33.1371 60 0L0 0L0 60Z" fill={color} />
    </svg>
  );
}

/**
 * Radial Star - 8-point star pattern with radiating lines
 */
export function BauhausRadialStar({
  size = 60,
  color = "#8982ff",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M30.867 4h-1.734v22.765L17.75 7.05l-1.5.867 11.382 19.715L7.917 16.25l-.867 1.502 19.715 11.382H4v1.734h22.766L7.05 42.249l.867 1.502 19.715-11.383L16.25 52.083l1.502.867 11.382-19.715V56h1.734V33.234L42.249 52.95l1.502-.867-11.383-19.715L52.083 43.75l.867-1.502-19.716-11.382H56v-1.734H33.234L52.95 17.751l-.867-1.502-19.715 11.383L43.75 7.917l-1.502-.867-11.382 19.716V4z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Teardrop - Drop/flame shape
 */
export function BauhausTeardrop({
  size = 60,
  color = "#8982ff",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M40 36c0 5.523-4.477 10-10 10s-10-4.477-10-10 9-22 10-22 10 16.477 10 22z"
        fill={color}
      />
    </svg>
  );
}

interface BauhausEyeProps extends BauhausProps {
  pupilColor?: string;
}

/**
 * Eye Shape - Almond eye with circular pupil
 */
export function BauhausEye({
  size = 60,
  color = "hsl(var(--brand))",
  pupilColor = "#8982ff",
  rotation = 0,
  className,
}: BauhausEyeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M49 29.5C49 32.74 43.439 42 30 42s-19-9.26-19-12.5S16.561 17 30 17s19 9.26 19 12.5z"
        fill={color}
      />
      <circle cx="30" cy="30" r="7" fill={pupilColor} />
    </svg>
  );
}

interface BauhausSemicircleProps extends BauhausProps {
  secondColor?: string;
}

/**
 * Semicircle - Yin-yang style split circle
 */
export function BauhausSemicircle({
  size = 60,
  color = "hsl(var(--brand))",
  secondColor = "#8982ff",
  rotation = 0,
  className,
}: BauhausSemicircleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M30 45c8.284 0 15-6.716 15-15H15c0 8.284 6.716 15 15 15z" fill={color} />
      <path d="M30 15c-8.284 0-15 6.716-15 15h30c0-8.284-6.716-15-15-15z" fill={secondColor} />
    </svg>
  );
}

interface BauhausStripedCircleProps extends BauhausProps {
  stripeColor?: string;
}

/**
 * Striped Circle - Circle with 3 vertical stripes
 */
export function BauhausStripedCircle({
  size = 60,
  color = "hsl(var(--brand))",
  stripeColor = "#c846ab",
  rotation = 0,
  className,
}: BauhausStripedCircleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="13" fill={color} />
      <path fill={stripeColor} d="M20 10h2v40h-2zM29 10h2v40h-2zM38 10h2v40h-2z" />
    </svg>
  );
}

interface BauhausTriangleProps extends BauhausProps {
  secondColor?: string;
}

/**
 * Triangle Split - Two triangles forming a square
 */
export function BauhausTriangleSplit({
  size = 60,
  color = "#b1f6e9",
  secondColor = "hsl(var(--brand))",
  rotation = 0,
  className,
}: BauhausTriangleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M4 56h52L30 30 4 56z" fill={color} />
      <path d="M56 4H4l26 26L56 4z" fill={secondColor} />
    </svg>
  );
}

interface BauhausQuadTrianglesProps extends BauhausProps {
  color1?: string;
  color2?: string;
  color3?: string;
}

/**
 * Quad Triangles - 4 triangles in a diamond pattern
 */
export function BauhausQuadTriangles({
  size = 60,
  color = "hsl(var(--brand))",
  color1 = "#8982ff",
  color2 = "#c846ab",
  color3 = "#1f1e44",
  rotation = 0,
  className,
}: BauhausQuadTrianglesProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M4 30h26L4 4v26z" fill={color1} />
      <path d="M4 56h26L4 30v26z" fill={color} />
      <path d="M30 30h26L30 4v26z" fill={color2} />
      <path d="M30 56h26L30 30v26z" fill={color3} />
    </svg>
  );
}

/**
 * Diamond Pattern - Multiple triangles in a grid
 */
export function BauhausDiamondPattern({
  size = 60,
  color = "#b1f6e9",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M15 0L0 15h30L15 0z" fill={color} />
      <path d="M45 0L30 15h30L45 0z" fill={color} />
      <path d="M15 30L0 45h30L15 30z" fill={color} />
      <path d="M45 30L30 45h30L45 30z" fill={color} />
      <path d="M30 15L15 30h30L30 15z" fill="#c846ab" />
      <path d="M30 45L15 60h30L30 45z" fill="#8982ff" />
    </svg>
  );
}

/**
 * Mushroom/Keyhole - Semicircle with circle on top
 */
export function BauhausMushroom({
  size = 60,
  color = "#c846ab",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M30 49c8.284 0 15-6.716 15-15H15c0 8.284 6.716 15 15 15z" fill={color} />
      <circle cx="30" cy="21" r="9" fill="#8982ff" />
    </svg>
  );
}

/**
 * 16-point Radial Star - More complex star pattern
 */
export function BauhausRadialStar16({
  size = 60,
  color = "#1f1e44",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M30.867 4h-1.734v19.415L24.108 4.662l-1.674.448 5.026 18.757L17.75 7.05l-1.5.867 9.708 16.815-13.73-13.73-1.226 1.226 13.73 13.73L7.917 16.25l-.867 1.5 16.816 9.709L5.11 22.433l-.448 1.675 18.755 5.025H4v1.734h19.417L4.662 35.892l.449 1.674 18.755-5.025L7.05 42.25l.867 1.5 16.815-9.708-13.73 13.73 1.226 1.226 13.73-13.73-9.708 16.815 1.5.867 9.71-16.815-5.026 18.755 1.674.448 5.025-18.755V56h1.734V36.581l5.026 18.757 1.674-.448-5.025-18.754 9.707 16.814 1.502-.867-9.709-16.815 13.73 13.73 1.226-1.226-13.73-13.73 16.816 9.709.866-1.502-16.816-9.708 18.756 5.025.448-1.674-18.755-5.025H56v-1.734H36.583l18.756-5.025-.449-1.674-18.756 5.025 16.816-9.708-.867-1.502-16.815 9.709 13.73-13.73-1.226-1.226-13.73 13.73 9.709-16.815-1.501-.867-9.71 16.816L37.567 5.11l-1.674-.448-5.025 18.755V4z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Eyelash - Eye with radiating lines below (jellyfish shape)
 */
export function BauhausEyelash({
  size = 60,
  color = "#c846ab",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M30 41c-6.473 0-10.988-2.224-13.877-4.783-1.45-1.285-2.493-2.657-3.169-3.88-.69-1.248-.954-2.263-.954-2.837h-2c0 1.046.43 2.404 1.204 3.804.073.133.15.268.231.403L5.5 37.134l1 1.732 6.073-3.506c.622.793 1.362 1.59 2.224 2.354a19.622 19.622 0 003.634 2.54l-3.297 5.71 1.732 1 3.37-5.837c2.444 1.04 5.354 1.741 8.764 1.856V50h2v-7.017c3.41-.115 6.32-.816 8.764-1.856l3.37 5.837 1.732-1-3.297-5.71a19.621 19.621 0 003.634-2.54 17.98 17.98 0 002.201-2.326l6.024 3.478 1-1.732-5.882-3.396c.088-.146.171-.29.25-.434C49.57 31.904 50 30.546 50 29.5h-2c0 .574-.265 1.589-.954 2.837-.676 1.223-1.719 2.595-3.17 3.88C40.989 38.777 36.474 41 30 41z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Simple Circle - Solid filled circle
 */
export function BauhausCircle({
  size = 60,
  color = "hsl(var(--brand))",
  className,
}: Omit<BauhausProps, "rotation">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="26" fill={color} />
    </svg>
  );
}

/**
 * Simple Square - Solid filled square
 */
export function BauhausSquare({
  size = 60,
  color = "#8982ff",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="52" height="52" fill={color} />
    </svg>
  );
}

/**
 * Simple Triangle - Solid equilateral triangle
 */
export function BauhausTriangle({
  size = 60,
  color = "#b1f6e9",
  rotation = 0,
  className,
}: BauhausProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M30 4L4 56h52L30 4z" fill={color} />
    </svg>
  );
}
