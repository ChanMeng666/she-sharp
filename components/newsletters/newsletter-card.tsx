"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ExternalLink, Mail, Megaphone } from "lucide-react";
import type { MailchimpNewsletter } from "@/types/newsletter";
import { NEWSLETTER_CATEGORY_LABELS } from "@/types/newsletter";

interface NewsletterCardProps {
  newsletter: MailchimpNewsletter;
}

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const CategoryIcon = newsletter.category === "monthly" ? Mail : Megaphone;

  return (
    <a
      href={newsletter.mailchimpUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
        {/* Category Icon Header */}
        <div className="relative bg-gradient-to-br from-purple-dark to-purple-mid p-6 text-white">
          <CategoryIcon className="h-8 w-8 mb-3 opacity-80" />

          {/* Featured badge */}
          {newsletter.isFeatured && (
            <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0">
              Latest
            </Badge>
          )}

          {/* External link indicator */}
          <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Category Badge */}
          <Badge variant="secondary" className="text-xs">
            {NEWSLETTER_CATEGORY_LABELS[newsletter.category]}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-3 group-hover:text-purple-dark transition-colors">
            {newsletter.title}
          </h3>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{newsletter.date}</span>
          </div>

          {/* View prompt */}
          <div className="flex items-center gap-2 text-purple-dark font-medium text-sm pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Read on Mailchimp</span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </a>
  );
}
