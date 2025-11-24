import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import { layoutSystem, getSectionSpacing } from "@/lib/layout-system";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  bgColor?: "white" | "light" | "accent" | "dark";
  noPadding?: boolean;
  spacing?: keyof typeof layoutSystem.spacing;
}

export function Section({
  children,
  className,
  bgColor = "light",
  noPadding = false,
  spacing = "section",
  ...props
}: SectionProps) {
  const bgClasses = {
    white: "bg-gradient-to-b from-gray-950/90 to-black/90 text-ghost-white",
    light: "bg-gradient-to-b from-gray-900/90 via-navy-dark/90 to-gray-950/90 text-ghost-white",
    accent: "bg-gradient-to-b from-purple-dark/20 via-gray-900/90 to-black/90 text-ghost-white",
    dark: "bg-gradient-to-b from-black to-gray-950 text-ghost-white",
  };

  return (
    <section
      className={cn(
        bgClasses[bgColor],
        !noPadding && getSectionSpacing(spacing),
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}