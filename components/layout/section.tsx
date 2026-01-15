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
    white: "bg-background text-foreground",
    light: "text-foreground",
    accent: "bg-muted text-foreground",
    dark: "bg-foreground text-background",
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