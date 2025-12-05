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
      <div className="min-h-[240px] md:min-h-[280px] lg:min-h-[320px] flex items-center justify-center py-16 lg:py-20">
        <Link href="/" className="group">
          <div className="relative w-64 md:w-80 lg:w-96 xl:w-[480px] h-20 md:h-24 lg:h-28 xl:h-36">
            <Image
              src="/logos/she-sharp-logo.svg"
              alt="She Sharp"
              fill
              sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, (max-width: 1280px) 384px, 480px"
              className="object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </Link>
      </div>

      <Separator className="bg-background/10" />

      {/* Zone 2: Newsletter + Social Media */}
      <div className="px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Newsletter - simplified */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-medium mb-3 text-background/90">
              Stay Connected
            </h3>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-background/30 text-background/80 hover:border-background/50 hover:text-background hover:bg-background/10"
            >
              <a
                href={MAILCHIMP_CONFIG.subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="h-4 w-4" />
                Subscribe to Newsletter
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>

          {/* Social icons - horizontal, reduced opacity */}
          <div className="flex items-center justify-center md:justify-end gap-3">
            {footerConfig.socialLinks.map((social) => {
              const Icon = socialIcons[social.icon as keyof typeof socialIcons];
              return (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="bg-background/10" />

      {/* Zone 3: Simplified Navigation (single row) */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-background/50">
          {footerConfig.simplifiedNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-background/80 transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <Separator className="bg-background/10" />

      {/* Zone 4: Legal Footer */}
      <div className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/40">
          {/* Charity Registration */}
          <a
            href={footerConfig.charityInfo.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-background/60 transition-colors duration-200 flex items-center gap-1"
          >
            NZ Charity #{footerConfig.charityInfo.registrationNumber}
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Legal Links */}
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
                  <span className="ml-4 text-background/20">|</span>
                )}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <span>© {new Date().getFullYear()} She Sharp</span>
        </div>
      </div>
    </footer>
  );
}
