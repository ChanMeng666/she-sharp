"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsletterCover } from "./newsletter-cover";
import { MONTH_FULL_NAMES, type NewsletterIssue } from "@/types/newsletter";

interface NewslettersGridProps {
  issues: NewsletterIssue[];
}

/**
 * Responsive grid of newsletter issues with a year filter. Each card shows a
 * CSS-generated cover that links out to the issue's Mailchimp campaign.
 *
 * The cover theme is fixed by each issue's position in the full list, so a
 * given newsletter keeps its color even while the grid is filtered.
 */
export function NewslettersGrid({ issues }: NewslettersGridProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Pin a stable theme index to each issue based on its full-list position.
  const themed = useMemo(
    () => issues.map((issue, index) => ({ issue, themeIndex: index })),
    [issues]
  );

  // Distinct years, newest first, for the filter chips.
  const years = useMemo(
    () => Array.from(new Set(issues.map((i) => i.year))).sort((a, b) => b - a),
    [issues]
  );

  const visible =
    selectedYear === null
      ? themed
      : themed.filter(({ issue }) => issue.year === selectedYear);

  return (
    <div>
      {/* Year filter */}
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter newsletters by year"
      >
        <FilterChip
          active={selectedYear === null}
          onClick={() => setSelectedYear(null)}
        >
          All
        </FilterChip>
        {years.map((year) => (
          <FilterChip
            key={year}
            active={selectedYear === year}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </FilterChip>
        ))}
      </div>

      {/* Issue grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {visible.map(({ issue, themeIndex }) => {
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
              <div className="overflow-hidden rounded-[32px] border border-border transition-colors duration-300 group-hover:border-foreground/30">
                <NewsletterCover
                  month={issue.month}
                  year={issue.year}
                  themeIndex={themeIndex}
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
    </div>
  );
}

/** A single pill-shaped year filter toggle. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-border text-muted-foreground hover:border-brand/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
