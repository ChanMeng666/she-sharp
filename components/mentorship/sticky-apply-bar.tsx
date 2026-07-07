"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface StickyApplyBarProps {
  href: string;
  label: string;
  /** Id of a section that, once scrolled into view, hides the bar. */
  hideAtId?: string;
}

export function StickyApplyBar({ href, label, hideAtId }: StickyApplyBarProps) {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [hideSectionInView, setHideSectionInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (roughly 600px)
      setScrolledPastHero(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!hideAtId) return;

    const target = document.getElementById(hideAtId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHideSectionInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hideAtId]);

  const visible = scrolledPastHero && !hideSectionInView;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-border">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-foreground font-medium text-sm md:text-base hidden sm:block">
            Ready to start your journey?
          </p>
          <Button variant="brand" size="lg" asChild className="w-full sm:w-auto group">
            <Link href={href} className="inline-flex items-center justify-center gap-2">
              {label}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
