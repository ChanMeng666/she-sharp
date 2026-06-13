"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/lib/config/navigation";
import { UserNav } from "./user-nav";

export function SiteHeader() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering interactive elements after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const url = new URL(href, window.location.origin);
    const hash = url.hash;
    const pathname = url.pathname;
    
    // 如果是当前页面的锚点
    if (pathname === window.location.pathname && hash) {
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        const yOffset = -88; // Account for fixed header height (64px) + top offset (8px) + spacing (16px)
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
    // 如果是跳转到其他页面，让默认行为处理
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for styling
      setScrolled(currentScrollY > 10);
      
      // Determine if navbar should be visible
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px
        setVisible(false);
      } else {
        // Scrolling up
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleMobileMenu = (title: string) => {
    setOpenMobileMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "mt-2 mx-auto w-[calc(100%-2rem)] max-w-8xl",
      "rounded-full border border-white/40",
      "glass-pill",
      "transition-all duration-300 ease-out",
      scrolled ? "shadow-lg bg-white/60" : "shadow-md",
      visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 group"
          aria-label="She Sharp Home"
        >
          <span
            className="block w-32 h-10 bg-purple-dark transition-colors duration-300 group-hover:bg-foreground"
            style={{
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
        </Link>

        {/* Desktop Navigation — click-to-open dropdowns (Radix DropdownMenu).
            Click-triggered + portaled menus eliminate the hover-timing races
            that made the old hover NavigationMenu swallow navigation clicks. */}
        {isMounted ? (
          <nav className="hidden lg:flex mx-auto">
            <ul className="flex items-center gap-2 xl:gap-4">
              {navigationConfig.items.map((item) => (
                <li key={item.title}>
                  {item.children ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 bg-transparent text-foreground hover:bg-[#f7e5f3]/80 data-[state=open]:bg-[#f7e5f3]/90 transition-all duration-150 rounded-full px-3 py-2 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {item.title}
                          <ChevronDown
                            className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
                            aria-hidden="true"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className="w-[480px] space-y-1 rounded-[28px] border border-white/50 bg-white/95 p-3 shadow-lg backdrop-blur"
                      >
                        {item.children.map((child) => (
                          <DropdownMenuItem
                            key={child.title}
                            asChild
                            className="group flex items-start gap-3 rounded-[24px] p-3 transition-all duration-150 hover:bg-brand-light focus:bg-[#f7e5f3]/80 data-[highlighted]:bg-[#f7e5f3]/80 cursor-pointer"
                          >
                            <Link
                              href={child.href}
                              onClick={(e) => handleSmoothScroll(e, child.href)}
                            >
                              {child.icon && (
                                <div className="mt-0.5 px-2">
                                  <child.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
                                </div>
                              )}
                              <div className="flex-1 px-2">
                                <div className="text-sm font-bold text-foreground group-hover:text-foreground transition-colors duration-150">
                                  {child.title}
                                </div>
                                {child.description && (
                                  <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={(e) => handleSmoothScroll(e, item.href)}
                      className="inline-flex items-center rounded-full bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-[#f7e5f3]/80 transition-all duration-150"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          /* Static placeholder during SSR to prevent hydration mismatch */
          <nav className="hidden lg:flex mx-auto">
            <ul className="flex items-center gap-2 xl:gap-4">
              {navigationConfig.items.map((item) => (
                <li key={item.title} className="relative">
                  <Link
                    href={item.href || "#"}
                    className="group inline-flex h-9 w-max items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm font-medium hover:bg-[#f7e5f3]/80 transition-all duration-150"
                  >
                    {item.title}
                    {item.children && (
                      <ChevronDown className="relative top-[1px] ml-1 size-3" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Desktop CTA Buttons and User Navigation */}
        <div className="hidden lg:flex items-center gap-3 xl:-mr-8">
          {navigationConfig.buttons.map((button) => (
            <Button
              key={button.title}
              variant={button.variant}
              size="lg"
              asChild
              className="transition-all duration-150"
            >
              <Link href={button.href}>{button.title}</Link>
            </Button>
          ))}

          {/* User Navigation */}
          <div className="ml-2">
            <UserNav variant="desktop" />
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        {isMounted ? (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="ml-auto lg:hidden">
              <button
                type="button"
                aria-label="Toggle menu"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#f7e5f3]/80 text-brand transition-all duration-200 hover:bg-[#f7e5f3] hover:scale-105 active:scale-95"
              >
                <span
                  className={cn(
                    "absolute transition-all duration-200",
                    isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                  )}
                >
                  <X className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "absolute transition-all duration-200",
                    isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                  )}
                >
                  <Menu className="h-5 w-5" />
                </span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:w-[420px] p-0 flex flex-col border-none shadow-2xl overflow-hidden"
            >
              {/* Thin rainbow accent strip */}
              <div className="h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-brand via-[#8982ff] to-[#b1f6e9]" />

              {/* Header — dark gradient with decorative elements */}
              <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1f1e44] via-[#2a2462] to-brand px-6 pt-6 pb-8">
                {/* Ambient blobs */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#8982ff]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[#b1f6e9]/15 blur-3xl" />

                {/* Dot-grid watermark */}
                <div className="pointer-events-none absolute right-5 bottom-5 grid grid-cols-5 gap-[5px] opacity-[0.18]">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="h-[3px] w-[3px] rounded-full bg-white" />
                  ))}
                </div>

                {/* Close button */}
                <SheetClose className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-all duration-200 hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close menu</span>
                </SheetClose>

                {/* She Sharp logo (white) */}
                <span
                  className="relative z-10 mb-3 block h-8 w-28 bg-white"
                  style={{
                    maskImage: "url(/logos/she-sharp-logo.svg)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "left center",
                    WebkitMaskImage: "url(/logos/she-sharp-logo.svg)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "left center",
                  }}
                />

                {/* Accessible title (visually styled as tagline) */}
                <SheetTitle className="relative z-10 text-sm font-normal tracking-wide text-white/70">
                  Bridging the gender gap in STEM
                </SheetTitle>
              </div>

              {/* Scrollable navigation */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <nav className="px-3 py-4" aria-label="Mobile navigation">
                  {navigationConfig.items.map((item, index) => (
                    <div
                      key={item.title}
                      className="mobile-nav-item"
                      style={{ animationDelay: `${index * 55}ms` }}
                    >
                      {item.children ? (
                        <Collapsible
                          open={openMobileMenus.includes(item.title)}
                          onOpenChange={() => toggleMobileMenu(item.title)}
                        >
                          <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 hover:bg-[#f7e5f3]/60 data-[state=open]:bg-[#f7e5f3]/70">
                            {item.icon && (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand/20 transition-all duration-200 group-hover:from-brand/20 group-hover:to-brand/30 group-data-[state=open]:from-brand/20 group-data-[state=open]:to-brand/30">
                                <item.icon className="h-4 w-4 text-brand" />
                              </div>
                            )}
                            <span className="flex-1 text-[15px] font-semibold text-[#1f1e44]">
                              {item.title}
                            </span>
                            <div
                              className={cn(
                                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 transition-all duration-200",
                                openMobileMenus.includes(item.title)
                                  ? "rotate-180 bg-brand/20"
                                  : ""
                              )}
                            >
                              <ChevronDown className="h-3 w-3 text-brand" />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <div className="mb-1 ml-4 mt-1 space-y-0.5 border-l-2 border-brand/15 pl-4">
                              {item.children.map((child) => (
                                <Link
                                  key={child.title}
                                  href={child.href}
                                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-[#f7e5f3]/60"
                                  onClick={(e) => {
                                    handleSmoothScroll(e, child.href);
                                    setIsOpen(false);
                                  }}
                                >
                                  {child.icon && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#f7e5f3] bg-white shadow-sm">
                                      <child.icon className="h-3.5 w-3.5 text-brand" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium leading-tight text-[#1f1e44]">
                                      {child.title}
                                    </p>
                                    {child.description && (
                                      <p className="mt-0.5 truncate text-xs text-[#1f1e44]/50">
                                        {child.description}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <Link
                          href={item.href}
                          className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 hover:bg-[#f7e5f3]/60"
                          onClick={(e) => {
                            handleSmoothScroll(e, item.href);
                            setIsOpen(false);
                          }}
                        >
                          {item.icon && (
                            <div
                              className={cn(
                                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                                item.title === "Donate"
                                  ? "bg-gradient-to-br from-[#f7e5f3] to-[#ecc5e2] group-hover:from-[#e8b8d8] group-hover:to-[#dfa0ca]"
                                  : "bg-gradient-to-br from-brand/10 to-brand/20 group-hover:from-brand/20 group-hover:to-brand/30"
                              )}
                            >
                              <item.icon className="h-4 w-4 text-brand" />
                            </div>
                          )}
                          <span className="flex-1 text-[15px] font-semibold text-[#1f1e44]">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Bottom — CTA + User nav */}
              <div className="flex-shrink-0 space-y-3 border-t border-[#f7e5f3] bg-gradient-to-t from-[#fdf9fc] to-white px-4 pb-6 pt-4">
                {navigationConfig.buttons.map((button) => (
                  <Button
                    key={button.title}
                    variant={button.variant}
                    size="lg"
                    asChild
                    className="h-12 w-full rounded-2xl text-base font-semibold shadow-md shadow-brand/20 transition-all duration-150"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href={button.href}>{button.title}</Link>
                  </Button>
                ))}
                <div>
                  <UserNav variant="mobile" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          /* Static placeholder for mobile menu during SSR */
          <button
            type="button"
            aria-label="Toggle menu"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f7e5f3]/80 text-brand lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

)}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @keyframes mobileNavSlideIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .mobile-nav-item {
          animation: mobileNavSlideIn 0.22s ease-out both;
        }
      `}</style>
    </header>
  );
}