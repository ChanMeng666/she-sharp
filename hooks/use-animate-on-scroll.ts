"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface UseAnimateOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useAnimateOnScroll(options?: UseAnimateOnScrollOptions) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const {
    threshold = 0.1,
    rootMargin = "0px 0px -100px 0px",
    once = true,
  } = options || {};

  useEffect(() => {
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === el && entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(el);
            }
          } else if (!once && entry.target === el) {
            setIsVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [threshold, rootMargin, once, reduceMotion]);

  return { ref, isVisible } as const;
}

