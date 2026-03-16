"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface StickyApplyBarProps {
  href: string;
  label: string;
  accentColor?: string;
}

export function StickyApplyBar({
  href,
  label,
  accentColor = "bg-brand",
}: StickyApplyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (roughly 600px)
      setVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${visible
        ? "translate-y-0 opacity-100"
        : "translate-y-full opacity-0"
        }`}
    >
      <div className={`${accentColor} border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md`}>
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4">
          <p className="text-white font-medium text-sm md:text-base hidden sm:block">
            Ready to start your journey?
          </p>
          <Button
            asChild
            size="default"
            className="bg-white border-none text-foreground hover:bg-white/80 hover:text-foreground font-bold px-6 md:px-8 h-11 shadow-md group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full sm:w-auto"
          >
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
