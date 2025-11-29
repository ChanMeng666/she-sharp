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
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import "./navigation-styles.css";

// 获取导航项目对应的配色方案和动画参数
const getNavigationColor = (title: string): [number, number, number] => {
  switch (title) {
    case "About":
      return brandColors.navAbout;
    case "Programs":
      return brandColors.navPrograms;
    case "Get Involved":
      return brandColors.navGetInvolved;
    case "Resources":
      return brandColors.navResources;
    default:
      return brandColors.ctaSoftMint;
  }
};

const getNavigationAnimationParams = (title: string) => {
  switch (title) {
    case "About":
      return { amplitude: 0.10, speed: 0.25 }; // 温和稳重的团队感
    case "Programs":
      return { amplitude: 0.15, speed: 0.35 }; // 活跃的教育活动感
    case "Get Involved":
      return { amplitude: 0.18, speed: 0.4 }; // 最活跃的参与行动感
    case "Resources":
      return { amplitude: 0.12, speed: 0.3 }; // 知识流动的智慧感
    default:
      return { amplitude: 0.12, speed: 0.3 };
  }
};

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
        const yOffset = -20; // Small offset for spacing
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
      "relative z-50 border border-gray-700/50 backdrop-blur-md bg-gradient-to-b from-gray-900/90 via-gray-800/80 to-gray-900/90 transition-all duration-150 py- mt-2 mb-4 rounded-full mx-auto w-[calc(100%-2rem)] max-w-7xl",
      "shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_2px_8px_rgba(155,46,131,0.15)]",
      scrolled ? "shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_4px_16px_rgba(155,46,131,0.25)] bg-gradient-to-b from-gray-900/95 via-gray-800/90 to-gray-900/95" : ""
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
              className="object-contain transition-all duration-200 group-hover:opacity-80 group-active:scale-95"
              style={{
                filter: 'brightness(0) invert(1)',
              }}
              priority
            />
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: '#9B2E83',
                maskImage: 'url(/logos/she-sharp-logo.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/logos/she-sharp-logo.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
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
                    <NavigationMenuTrigger className="bg-transparent text-ghost-white hover:bg-white hover:text-navy-dark data-[state=open]:bg-white data-[state=open]:text-navy-dark transition-all duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1">
                        {item.title}
                      </span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="nav-dropdown-enter nav-dropdown-enter-active backdrop-blur-xl bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-gray-900/98 border-2 border-gray-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_8px_24px_rgba(155,46,131,0.2)] rounded-2xl">
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
                                    className="flex items-start gap-3 rounded-lg p-3 transition-all duration-150 hover:bg-gray-800/60 hover:backdrop-blur-sm focus:bg-gray-800/60 group hover:shadow-[0_4px_12px_rgba(155,46,131,0.2)] hover:-translate-y-0.5"
                                  >
                                    {child.icon && (
                                      <div className="mt-0.5">
                                        <child.icon className="h-5 w-5 text-purple-dark/60 group-hover:text-purple-light transition-colors duration-150" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-ghost-white group-hover:text-purple-light transition-colors duration-150">
                                        {child.title}
                                      </div>
                                      {child.description && (
                                        <p className="mt-1 text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-150">
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
                        
                        {/* Right side - Iridescence Background */}
                        {item.image && (
                          <Link 
                            href={item.image.href}
                            className="relative w-80 overflow-hidden group"
                          >
                            {/* Iridescence 动态背景 */}
                            <div className="absolute inset-0">
                              {/* <Iridescence
                                color={getNavigationColor(item.title)}
                                mouseReact={false}
                                amplitude={getNavigationAnimationParams(item.title).amplitude}
                                speed={getNavigationAnimationParams(item.title).speed}
                                className="w-full h-full"
                              /> */}
                            </div>
                            
                            {/* 内容覆盖层 */}
                            <div className="relative h-full flex items-center justify-center bg-gray-800/60 backdrop-blur-lg group-hover:bg-gray-800/80 transition-all duration-300">
                              <div className="text-center p-6">
                                <div className="text-sm font-medium text-ghost-white/80 mb-1">
                                  Featured
                                </div>
                                <div className="text-lg font-bold text-ghost-white">
                                  {item.image.alt}
                                </div>
                                <div className="mt-2 text-sm text-purple-light opacity-75 group-hover:opacity-100 transition-opacity duration-300">
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
                        "bg-transparent text-ghost-white hover:bg-white hover:text-navy-dark transition-all duration-150 nav-item-underline hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 rounded-lg px-3 py-2"
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
              className={cn(
                "transition-all duration-150",
                // 仅为特定样式添加自定义样式覆盖
                button.variant === "default" 
                  ? "bg-gradient-to-b from-purple-dark to-purple-dark/90 text-ghost-white hover:from-purple-mid hover:to-purple-dark shadow-[0_4px_12px_rgba(155,46,131,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_6px_16px_rgba(155,46,131,0.5),0_0_0_1px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 transition-all duration-150" 
                  : button.variant === "white" || button.variant === "glass" || button.variant === "glassmorphism" || button.variant === "ghost"
                  ? "" // 特殊效果样式使用预设效果，不添加额外覆盖
                  : "border-2 border-purple-dark text-purple-light hover:bg-purple-dark/20 shadow-[0_2px_8px_rgba(155,46,131,0.2)] hover:shadow-[0_4px_12px_rgba(155,46,131,0.3)] hover:-translate-y-0.5 transition-all duration-150"
              )}
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
              variant="ghost" 
              size="lg"
              className="text-ghost-white hover:bg-purple-dark/20 hover:text-purple-light transition-all duration-150 hover:shadow-[0_4px_12px_rgba(155,46,131,0.3)] hover:-translate-y-0.5 rounded-lg"
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
            className="w-[300px] sm:w-[400px] p-0 overflow-y-auto backdrop-blur-lg bg-gradient-to-b from-gray-900/98 via-gray-800/95 to-gray-900/98 border-l border-gray-700/50 shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)_inset]"
          >
            {/* Mobile Header */}
            <div className="backdrop-blur-md bg-gradient-to-br from-purple-dark/90 via-purple-dark/85 to-purple-mid/90 p-6 relative overflow-hidden border-b border-gray-700/50 shadow-[0_4px_16px_rgba(155,46,131,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
              <SheetTitle className="text-ghost-white text-xl font-bold relative z-10">
                Menu
              </SheetTitle>
              {/* Background Logo */}
              <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 opacity-20">
                <div className="relative w-32 h-32">
                  <Image
                    src="/logos/she-sharp-logo-purple-dark-130x130.svg"
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
                  className="border-b border-gray-700/30 last:border-0 mobile-menu-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {item.children ? (
                    <Collapsible
                      open={openMobileMenus.includes(item.title)}
                      onOpenChange={() => toggleMobileMenu(item.title)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-ghost-white hover:bg-white hover:text-navy-dark transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-lg px-2 -mx-2">
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
                              className="flex items-center gap-2 py-2 text-sm text-gray-300 hover:text-purple-light transition-all duration-150 hover:bg-gray-800/40 hover:shadow-[0_2px_8px_rgba(155,46,131,0.15)] rounded-lg px-2 -mx-2"
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
                      className="flex items-center gap-2 py-4 text-base font-medium text-ghost-white hover:bg-white hover:text-navy-dark transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-lg px-2 -mx-2"
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
                    className={cn(
                      "w-full transition-all duration-150",
                      // 仅为特定样式添加自定义样式覆盖
                      button.variant === "default" 
                        ? "bg-gradient-to-b from-purple-dark to-purple-dark/90 text-ghost-white hover:from-purple-mid hover:to-purple-dark shadow-[0_4px_12px_rgba(155,46,131,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_6px_16px_rgba(155,46,131,0.5),0_0_0_1px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 transition-all duration-150" 
                        : button.variant === "white" || button.variant === "glass" || button.variant === "glassmorphism" || button.variant === "ghost"
                        ? "" // 特殊效果样式使用预设效果，不添加额外覆盖
                        : "border-2 border-purple-dark text-purple-light hover:bg-purple-dark/20 shadow-[0_2px_8px_rgba(155,46,131,0.2)] hover:shadow-[0_4px_12px_rgba(155,46,131,0.3)] hover:-translate-y-0.5 transition-all duration-150"
                    )}
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