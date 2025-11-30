"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
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
      "mt-2 mx-auto w-[calc(100%-2rem)] max-w-7xl",
      "rounded-full nav-glass",
      "transition-all duration-300 ease-out",
      scrolled ? "shadow-lg" : "shadow-sm",
      visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
        >
          <div className="relative w-32 h-10">
            <Image
              src="/logos/she-sharp-logo.svg"
              alt="She Sharp"
              fill
              sizes="128px"
              className="object-contain transition-all duration-200 group-hover:opacity-70 group-active:scale-95"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex mx-auto">
          <NavigationMenuList>
            {navigationConfig.items.map((item) => (
              <NavigationMenuItem key={item.title}>
                {item.children ? (
                  <>
                    <NavigationMenuTrigger className="bg-transparent text-foreground hover:bg-muted data-[state=open]:bg-muted transition-all duration-150 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1">
                        {item.title}
                      </span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="nav-dropdown-enter nav-dropdown-enter-active dropdown-glass rounded-xl">
                      <div className="flex w-[800px]">
                        {/* Left side - Navigation links */}
                        <div className="flex-1 p-6">
                          <ul className="space-y-1">
                            {item.children.map((child) => (
                              <li key={child.title}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={child.href}
                                    onClick={(e) => handleSmoothScroll(e, child.href)}
                                    className="flex items-start gap-3 rounded-lg p-3 transition-all duration-150 hover:bg-muted focus:bg-muted group"
                                  >
                                    {child.icon && (
                                      <div className="mt-0.5">
                                        <child.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors duration-150">
                                        {child.title}
                                      </div>
                                      {child.description && (
                                        <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                                          {child.description}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Right side - Featured section */}
                        {item.image && (
                          <Link
                            href={item.image.href}
                            className="relative w-80 overflow-hidden group"
                          >
                            {/* Content */}
                            <div className="relative h-full flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-all duration-300">
                              <div className="text-center p-6">
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                  Featured
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                  {item.image.alt}
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground group-hover:text-foreground transition-opacity duration-300">
                                  Explore →
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => handleSmoothScroll(e, item.href)}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent text-foreground hover:bg-muted transition-all duration-150 rounded-lg px-3 py-2"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

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
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="ml-auto lg:hidden">
            <Button
              variant="outline"
              size="lg"
              className="text-foreground hover:bg-muted rounded-lg"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[400px] p-0 overflow-y-auto bg-background border-l border-border shadow-lg"
          >
            {/* Mobile Header */}
            <div className="bg-muted p-6 relative overflow-hidden border-b border-border">
              <SheetTitle className="text-foreground text-xl font-bold relative z-10">
                Menu
              </SheetTitle>
              {/* Background Logo */}
              <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 opacity-10">
                <div className="relative w-32 h-32">
                  <Image
                    src="/logos/she-sharp-logo.svg"
                    alt=""
                    fill
                    sizes="128px"
                    className="object-contain"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex flex-col p-6">
              {navigationConfig.items.map((item, index) => (
                <div
                  key={item.title}
                  className="border-b border-border last:border-0 mobile-menu-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {item.children ? (
                    <Collapsible
                      open={openMobileMenus.includes(item.title)}
                      onOpenChange={() => toggleMobileMenu(item.title)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-foreground hover:bg-muted transition-all duration-150 rounded-lg px-2 -mx-2">
                        <span className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-150",
                            openMobileMenus.includes(item.title) && "rotate-180"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pb-4">
                        <div className="ml-6 space-y-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.title}
                              href={child.href}
                              className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:bg-muted rounded-lg px-2 -mx-2"
                              onClick={(e) => {
                                handleSmoothScroll(e, child.href);
                                setIsOpen(false);
                              }}
                            >
                              {child.icon && <child.icon className="h-3 w-3" />}
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 py-4 text-base font-medium text-foreground hover:bg-muted transition-all duration-150 rounded-lg px-2 -mx-2"
                      onClick={(e) => {
                        handleSmoothScroll(e, item.href);
                        setIsOpen(false);
                      }}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile CTA Buttons */}
              <div className="mt-6 space-y-3">
                {navigationConfig.buttons.map((button) => (
                  <Button
                    key={button.title}
                    variant={button.variant}
                    size="lg"
                    asChild
                    className="w-full transition-all duration-150"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href={button.href}>{button.title}</Link>
                  </Button>
                ))}
              </div>
              
              {/* Mobile User Navigation */}
              <div className="mt-6">
                <UserNav variant="mobile" />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation Underline Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </header>
  );
}