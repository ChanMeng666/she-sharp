"use client";

import { ReactNode } from "react";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
  children: ReactNode;
  variant?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "fade";
  className?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
}

const variantClasses = {
  "fade-up": "animate-on-scroll-fade-up",
  "fade-down": "animate-on-scroll-fade-down",
  "fade-left": "animate-on-scroll-fade-left",
  "fade-right": "animate-on-scroll-fade-right",
  scale: "animate-on-scroll-scale",
  fade: "animate-on-scroll-fade",
};

export function AnimateOnScroll({
  children,
  variant = "fade-up",
  className,
  threshold = 0.1,
  rootMargin = "0px 0px -100px 0px",
  once = true,
  delay = 0,
}: AnimateOnScrollProps) {
  const { ref, isVisible } = useAnimateOnScroll({
    threshold,
    rootMargin,
    once,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        variantClasses[variant],
        isVisible && "is-visible",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

