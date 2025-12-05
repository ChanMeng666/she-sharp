"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { footerConfig } from "@/lib/config/footer";
import { socialIcons } from "@/components/ui/social-icons";
import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";
import "@/styles/components/footer.css";

export function SiteFooter() {
  return (
    <footer className="relative bg-brand text-background -mt-12 overflow-hidden rounded-t-[50px]">
      {/* Zone 1: Hero Logo Area */}
      <div className="min-h-[200px] md:min-h-[240px] lg:min-h-[280px] flex items-center justify-center py-12 lg:py-16">
        <Link href="/" className="group">
          <div className="relative w-72 md:w-96 lg:w-[480px] xl:w-[560px] h-24 md:h-32 lg:h-40 xl:h-44">
            <Image
              src="/logos/she-sharp-logo.svg"
              alt="She Sharp"
              fill
              sizes="(max-width: 768px) 288px, (max-width: 1024px) 384px, (max-width: 1280px) 480px, 560px"
              className="object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </Link>
      </div>

      <Separator className="bg-background/10" />

      {/* Zone 2: Newsletter + Social Media */}
      <div className="px-6 sm:px-8 lg:px-12 py-6 lg:py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Newsletter */}
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-semibold mb-3 text-background/90">
              Stay Connected
            </h3>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-background/30 text-background/90 hover:border-background/50 hover:text-background hover:bg-background/10 text-base px-6"
            >
              <a
                href={MAILCHIMP_CONFIG.subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="h-5 w-5" />
                Subscribe to Newsletter
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Social icons */}
          <div className="flex items-center justify-center md:justify-end gap-3">
            {footerConfig.socialLinks.map((social) => {
              const Icon = socialIcons[social.icon as keyof typeof socialIcons];
              return (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 opacity-60 hover:opacity-100 transition-opacity duration-200"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="bg-background/10" />

      {/* Zone 3: Navigation + Legal (combined) */}
      <div className="px-6 sm:px-8 lg:px-12 py-5 lg:py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-background/60">
            {footerConfig.simplifiedNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-background/90 transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Legal Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-background/40 pt-2">
            <a
              href={footerConfig.charityInfo.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-background/60 transition-colors duration-200 flex items-center gap-1"
            >
              NZ Charity #{footerConfig.charityInfo.registrationNumber}
              <ExternalLink className="h-3 w-3" />
            </a>

            <span className="hidden sm:inline text-background/20">•</span>

            <div className="flex items-center gap-4">
              {footerConfig.legalLinks.map((link, index) => (
                <span key={link.name} className="flex items-center">
                  <Link
                    href={link.href}
                    className="hover:text-background/60 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                  {index < footerConfig.legalLinks.length - 1 && (
                    <span className="ml-4 text-background/20">•</span>
                  )}
                </span>
              ))}
            </div>

            <span className="hidden sm:inline text-background/20">•</span>

            <span>© {new Date().getFullYear()} She Sharp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
