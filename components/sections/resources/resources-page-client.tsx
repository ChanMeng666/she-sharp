"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import { ScrollLinePath } from "@/components/ui/scroll-line-path";

interface ResourcesPageClientProps {
  children: React.ReactNode;
}

export function ResourcesPageClient({ children }: ResourcesPageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  return (
    <div ref={containerRef} className="relative bg-white">
      {/* Fixed centered SVG decoration */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 hidden lg:flex">
        <ScrollLinePath
          scrollYProgress={scrollYProgress}
          className="h-[90vh] w-auto opacity-90"
        />
      </div>

      {/* Main content above the SVG */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
