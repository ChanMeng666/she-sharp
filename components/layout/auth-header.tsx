"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const authNavItems: { title: string; href: string }[] = [];

export function AuthHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-lg transition-all duration-300",
        scrolled ? "bg-white/20 shadow-xl" : ""
      )}
    >
      <div className="mx-auto px-4 md:px-6 max-w-7xl flex h-16 items-center">
        {/* Logo */}
        <Link
          href="/"
          className="mr-8 flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
        >
          <div className="relative w-32 h-10">
            <Image
              src="/logos/she-sharp-logo.svg"
              alt="She Sharp"
              fill
              sizes="128px"
              className="object-contain transition-all duration-200 group-hover:brightness-0 group-hover:saturate-100 group-active:scale-95"
              style={{
                filter: "brightness(1) saturate(1)",
              }}
              priority
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: "#9B2E83",
                maskImage: "url(/logos/she-sharp-logo.svg)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: "url(/logos/she-sharp-logo.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-auto">
        </nav>

        {/* Mobile Menu Toggle */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="ml-auto md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted hover:text-foreground transition-colors"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-0">
            {/* Mobile Header */}
            <div className="bg-foreground p-6">
              <SheetTitle className="text-background text-xl font-bold">
                Menu
              </SheetTitle>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col p-6">
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}