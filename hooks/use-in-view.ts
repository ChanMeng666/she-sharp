"use client";

import { useEffect, useRef, useState } from "react";

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === el) {
            setInView(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "150px",
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [options?.root, options?.rootMargin, options?.threshold]);

  return { ref, inView } as const;
}


