"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
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

/** Path (no hash) prefix-match: "/events" owns "/events" and "/events/x". */
function pathMatches(pathname: string, href: string): boolean {
  const target = href.split("#")[0];
  if (!target || target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  // Which desktop dropdown is open (controlled) — enables hover-to-open on top
  // of the click-reliable Radix DropdownMenu without touching the click/nav path.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent hydration mismatch by only rendering interactive elements after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hover-intent helpers: open immediately, close after a short grace period so
  // the pointer can cross the trigger→panel gap without the menu snapping shut.
  const openMenuNow = (title: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(title);
  };
  const closeMenuSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };
  // Clear any pending close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
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

  // The current section: prefer the item whose own href owns the pathname;
  // otherwise fall back to a child match (e.g. /sponsors/* → Get Involved).
  const ownerItem = navigationConfig.items.find(
    (item) => item.href && pathMatches(pathname, item.href)
  );
  const isItemActive = (item: (typeof navigationConfig.items)[number]) =>
    ownerItem
      ? item === ownerItem
      : !!item.children?.some((child) => pathMatches(pathname, child.href));

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "border-b border-border backdrop-blur-sm",
      "transition-transform duration-300 ease-out",
      scrolled ? "bg-white/95" : "bg-white/80",
      visible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="mx-auto flex h-16 max-w-8xl items-center px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
                    <DropdownMenu
                      open={openMenu === item.title}
                      onOpenChange={(o) =>
                        setOpenMenu(o ? item.title : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") openMenuNow(item.title);
                          }}
                          onPointerLeave={(e) => {
                            if (e.pointerType === "mouse") closeMenuSoon();
                          }}
                          className={cn(
                            "group inline-flex items-center gap-1 bg-transparent transition-colors duration-150 rounded-full px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            isItemActive(item)
                              ? "text-brand bg-surface-purple/70 hover:bg-surface-purple data-[state=open]:bg-surface-purple"
                              : "text-foreground hover:bg-muted data-[state=open]:bg-muted"
                          )}
                          aria-current={isItemActive(item) ? "true" : undefined}
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
                        onPointerEnter={() => openMenuNow(item.title)}
                        onPointerLeave={closeMenuSoon}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                        className="w-[480px] space-y-1 rounded-[24px] border border-border bg-white p-3 shadow-[var(--shadow-md)]"
                      >
                        {item.children.map((child) => (
                          <DropdownMenuItem
                            key={child.title}
                            asChild
                            className="group flex items-start gap-3 rounded-[16px] p-3 transition-colors duration-150 hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted cursor-pointer"
                          >
                            <Link
                              href={child.href}
                              {...(child.href.startsWith("http")
                                ? { target: "_blank", rel: "noopener noreferrer" }
                                : {})}
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
                      className={cn(
                        "inline-flex items-center rounded-full bg-transparent px-3 py-2 text-sm font-medium transition-colors duration-150",
                        isItemActive(item)
                          ? "text-brand bg-surface-purple/70 hover:bg-surface-purple"
                          : "text-foreground hover:bg-muted"
                      )}
                      aria-current={isItemActive(item) ? "page" : undefined}
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
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm font-medium transition-colors duration-150",
                      isItemActive(item)
                        ? "text-brand bg-surface-purple/70 hover:bg-surface-purple"
                        : "hover:bg-muted"
                    )}
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
              className="rounded-full transition-colors duration-150"
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
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-200 hover:bg-ink-200"
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
              /* This sheet draws its own round close button below. Without
                 this, SheetContent's built-in one lands on the same
                 `top-4 right-4` and the two crosses overlap. */
              showClose={false}
              /* No dim behind this one. The panel is `w-full` on a phone, so
                 the backdrop is only ever visible during the slide — where all
                 it did was flash a grey wash across the screen a beat before
                 the menu arrived. The element is still there and still closes
                 the sheet on an outside tap; it is just invisible. */
              overlayClassName="bg-transparent"
              /*
               * Below `sm` this panel is `w-full`, so when it lands it covers
               * the entire screen. Sliding a full-screen surface in from the
               * right tells the viewer nothing they cannot already see, and it
               * gives them a moving edge between two white surfaces to
               * misread — reported variously as stutter, as arriving in two
               * halves, and as a second panel covering the first. With no dim
               * behind it there is no depth cue to resolve the ambiguity
               * either.
               *
               * So on phones it simply fades in: no direction, no edge, nothing
               * to parse. From `sm` up it is a 420px drawer over a visible
               * page, where the slide does carry meaning, and it is kept.
               */
              /*
               * The translate override has to carry the `data-[state]` variant
               * too. `slide-in-from-right` is applied as
               * `data-[state=open]:slide-in-from-right`, so its selector has an
               * attribute in it; a bare `max-sm:[--tw-enter-translate-x:0%]`
               * loses on specificity no matter where it sits in the sheet.
               */
              className="w-full sm:w-[420px] p-0 flex flex-col border-l border-border bg-white overflow-hidden max-sm:data-[state=open]:[--tw-enter-translate-x:0%] max-sm:data-[state=closed]:[--tw-exit-translate-x:0%] max-sm:data-[state=open]:fade-in-0 max-sm:data-[state=closed]:fade-out-0"
            >
              {/* Header — clean white with hairline divider */}
              <div className="relative flex-shrink-0 border-b border-border bg-white px-6 pt-6 pb-6">
                {/* Close button */}
                <SheetClose className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-200 hover:bg-ink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close menu</span>
                </SheetClose>

                {/* She Sharp logo (brand purple) */}
                <span
                  className="relative z-10 mb-3 block h-8 w-28 bg-purple-dark"
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
                <SheetTitle className="relative z-10 text-sm font-normal tracking-wide text-muted-foreground">
                  Bridging the gender gap in STEM
                </SheetTitle>
              </div>

              {/* Scrollable navigation */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <nav className="px-3 py-4" aria-label="Mobile navigation">
                  {navigationConfig.items.map((item, index) => (
                    <div
                      key={item.title}
                      /* No entrance animation on the items.
                         The panel already slides in right-to-left; animating
                         each row right-to-left again, on a stagger, is a second
                         motion along the same axis at a different speed. Frame
                         timings during the open are a clean 60fps with nothing
                         dropped, so what read as "stutter" was never dropped
                         frames — it was the panel appearing to arrive, then its
                         contents arriving again after it. The slide is the
                         entrance; the contents should simply be in it. */
                    >
                      {item.children ? (
                        <Collapsible
                          open={openMobileMenus.includes(item.title)}
                          onOpenChange={() => toggleMobileMenu(item.title)}
                        >
                          <CollapsibleTrigger
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left transition-colors duration-200 hover:bg-muted data-[state=open]:bg-muted",
                              isItemActive(item) && "bg-surface-purple/60"
                            )}
                          >
                            {item.icon && (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-muted transition-colors duration-200 group-hover:bg-ink-200">
                                <item.icon className="h-4 w-4 text-brand" />
                              </div>
                            )}
                            <span className="flex-1 text-[15px] font-semibold text-foreground">
                              {item.title}
                            </span>
                            <div
                              className={cn(
                                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted transition-transform duration-200",
                                openMobileMenus.includes(item.title)
                                  ? "rotate-180"
                                  : ""
                              )}
                            >
                              <ChevronDown className="h-3 w-3 text-foreground" />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <div className="mb-1 ml-4 mt-1 space-y-0.5 border-l border-border pl-4">
                              {item.children.map((child) => (
                                <Link
                                  key={child.title}
                                  href={child.href}
                                  {...(child.href.startsWith("http")
                                    ? { target: "_blank", rel: "noopener noreferrer" }
                                    : {})}
                                  className="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors duration-150 hover:bg-muted"
                                  onClick={(e) => {
                                    handleSmoothScroll(e, child.href);
                                    setIsOpen(false);
                                  }}
                                >
                                  {child.icon && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white">
                                      <child.icon className="h-3.5 w-3.5 text-brand" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium leading-tight text-foreground">
                                      {child.title}
                                    </p>
                                    {child.description && (
                                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
                          className={cn(
                            "group flex items-center gap-3 rounded-[16px] px-3 py-3 transition-colors duration-200 hover:bg-muted",
                            isItemActive(item) && "bg-surface-purple/60"
                          )}
                          aria-current={isItemActive(item) ? "page" : undefined}
                          onClick={(e) => {
                            handleSmoothScroll(e, item.href);
                            setIsOpen(false);
                          }}
                        >
                          {item.icon && (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-muted transition-colors duration-200 group-hover:bg-ink-200">
                              <item.icon className="h-4 w-4 text-brand" />
                            </div>
                          )}
                          <span className="flex-1 text-[15px] font-semibold text-foreground">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Bottom — CTA + User nav */}
              <div className="flex-shrink-0 space-y-3 border-t border-border bg-white px-4 pb-6 pt-4">
                {navigationConfig.buttons.map((button) => (
                  <Button
                    key={button.title}
                    variant={button.variant}
                    size="lg"
                    asChild
                    className="h-12 w-full rounded-[16px] text-base font-semibold transition-colors duration-150"
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
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground lg:hidden"
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

      `}</style>
    </header>
  );
}