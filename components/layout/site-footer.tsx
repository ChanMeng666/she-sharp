"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Mail, ChevronDown, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { footerConfig } from "@/lib/config/footer";
import { socialIcons } from "@/components/ui/social-icons";
import "./footer-styles.css";

export function SiteFooter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [openSections, setOpenSections] = useState<string[]>([]);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const url = new URL(href, window.location.origin);
    const hash = url.hash;
    const pathname = url.pathname;

    // 如果是当前页面的锚点
    if (pathname === window.location.pathname && hash) {
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        const yOffset = -80; // 导航栏高度偏移
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
    // 如果是跳转到其他页面，让默认行为处理
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus("loading");

    // Simulate API call
    setTimeout(() => {
      setNewsletterStatus("success");
      setEmail("");
      setTimeout(() => setNewsletterStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <footer className="relative bg-navy-dark text-white -mt-12 pt-16 overflow-hidden rounded-t-[50px]">
      {/* 向上过渡渐变 */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-t from-navy-dark to-transparent" />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-12 xl:gap-16">
          {/* Left side - Newsletter & Social */}
          <div className="flex-1 max-w-md lg:max-w-lg">
            <div className="relative px-4 md:px-6 lg:px-0 py-12 md:py-16 lg:py-20">
              {/* Newsletter */}
              <div className="mb-8 lg:mb-12">
                <div className="text-left">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-white">
                    Subscribe to stay updated
                  </h3>
                  <p className="text-sm md:text-base text-white/80 mb-6 lg:mb-8">
                    Get the latest updates on events, mentorship opportunities,
                    and inspiring stories.
                  </p>
                  <form
                    onSubmit={handleNewsletterSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-lg"
                  >
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-12 h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-mid newsletter-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={newsletterStatus === "loading"}
                      className="bg-purple-dark text-white hover:bg-purple-mid transition-colors duration-150 h-12 px-8"
                    >
                      {newsletterStatus === "loading"
                        ? "Subscribing..."
                        : "Subscribe"}
                    </Button>
                  </form>
                  {newsletterStatus === "success" && (
                    <p className="mt-3 text-mint-dark">
                      Thank you for subscribing!
                    </p>
                  )}
                </div>

                {/* Social Media */}
                <div className="mt-10 text-left">
                  <div className="flex flex-wrap gap-3 lg:gap-4">
                    {footerConfig.socialLinks.map((social) => {
                      const Icon =
                        socialIcons[social.icon as keyof typeof socialIcons];
                      return (
                        <Link
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-icon p-2.5 lg:p-3 border-white/60 border rounded-full bg-white/10 hover:bg-purple-dark transition-all"
                          aria-label={`Follow us on ${social.name}`}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Navigation Links */}
          <div className="flex-1 lg:flex-none lg:max-w-2xl">
            <div>
              {/* Desktop Links */}
              <div className="hidden lg:flex lg:justify-between lg:max-w-full lg:pt-20">
                {footerConfig.sections.map((section) => (
                  <div
                    key={section.title}
                    className="min-w-[140px] lg:min-w-[160px] xl:min-w-[180px]"
                  >
                    <h4 className="font-semibold mb-4 text-mint-dark text-sm lg:text-lg">
                      {section.title}
                    </h4>
                    <ul className="space-y-2 lg:space-y-4">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.href}
                            onClick={(e) => handleSmoothScroll(e, link.href)}
                            className="text-xs lg:text-base text-white/80 hover:text-purple-mid transition-colors footer-link inline-block"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Mobile Accordion */}
              <div className="lg:hidden space-y-2 md:space-y-3">
                {footerConfig.sections.map((section) => (
                  <Collapsible
                    key={section.title}
                    open={openSections.includes(section.title)}
                    onOpenChange={() => toggleSection(section.title)}
                    className="border-b border-white/10 last:border-0"
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-3 md:py-4 text-left">
                      <h4 className="font-semibold text-mint-dark text-sm md:text-base">
                        {section.title}
                      </h4>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-150 text-white/60",
                          openSections.includes(section.title) && "rotate-180"
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="footer-accordion-content">
                      <div className="pb-3 md:pb-4">
                        <ul className="space-y-2 md:space-y-3 ml-4">
                          {section.links.map((link) => (
                            <li key={link.name}>
                              <Link
                                href={link.href}
                                onClick={(e) =>
                                  handleSmoothScroll(e, link.href)
                                }
                                className="text-xs md:text-sm text-white/80 hover:text-purple-mid transition-colors block py-1"
                              >
                                {link.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-white/20" />

      {/* Bottom Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 lg:gap-8">
          {/* Left side - Logo & Charity Info */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <Link href="/" className="group">
              <div className="relative w-20 sm:w-24 h-6 sm:h-8">
                <Image
                  src="/logos/she-sharp-logo.svg"
                  alt="She Sharp"
                  fill
                  sizes="96px"
                  className="object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                />
              </div>
            </Link>
            <span className="hidden sm:inline text-white/40">|</span>
            <Link
              href={footerConfig.charityInfo.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-mid transition-colors duration-150 flex items-center gap-1 text-center text-xs md:text-sm text-white/80"
            >
              Registered NZ Charity #
              {footerConfig.charityInfo.registrationNumber}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Center - Legal Links */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm">
            {footerConfig.legalLinks.map((link, index) => (
              <div key={link.name} className="flex items-center">
                <Link
                  href={link.href}
                  className="text-white/80 hover:text-purple-mid transition-colors duration-150 legal-link"
                >
                  {link.name}
                </Link>
                {index < footerConfig.legalLinks.length - 1 && (
                  <span className="mx-1 md:mx-8 text-white/60">•</span>
                )}
              </div>
            ))}
          </div>

          {/* Right side - Copyright */}
          <div className="text-center lg:text-right text-xs md:text-sm text-white/80">
            © {new Date().getFullYear()} She Sharp. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
