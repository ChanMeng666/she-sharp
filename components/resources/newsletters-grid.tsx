"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterCover } from "./newsletter-cover";
import { MONTH_FULL_NAMES, type NewsletterIssue } from "@/types/newsletter";

interface NewslettersGridProps {
  issues: NewsletterIssue[];
}

/**
 * Responsive grid of newsletter issues. Each card shows a CSS-generated cover
 * that links out to the issue's Mailchimp campaign in a new tab.
 */
export function NewslettersGrid({ issues }: NewslettersGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
      {issues.map((issue, index) => {
        const monthName = MONTH_FULL_NAMES[issue.month] ?? "";
        return (
          <Link
            key={issue.id}
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read the ${monthName} ${issue.year} newsletter`}
            className="group block"
          >
            <div className="card-responsive-sm shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
              <NewsletterCover
                month={issue.month}
                year={issue.year}
                themeIndex={index}
                theme={issue.theme}
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-base font-semibold">
                {monthName} {issue.year}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                Read more
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
