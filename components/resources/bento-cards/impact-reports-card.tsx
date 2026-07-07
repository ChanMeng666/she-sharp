"use client";

import { Button } from "@/components/ui/button";
import type { ImpactReport } from "@/types/impact-report";

interface ImpactReportsCardProps {
  reports: ImpactReport[];
}

/**
 * Impact reports card for the resources hub — image-top hairline card.
 * Year buttons link out to the report PDFs on Google Drive.
 */
export function ImpactReportsCard({ reports }: ImpactReportsCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-background">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src="/img/impact.jpg"
          alt="She Sharp community celebrating their impact"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <span className="text-label text-brand">Impact Reports</span>
        <h3 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">
          Annual achievements
        </h3>
        <p className="mt-2 text-ink-600">
          Read the numbers behind our year — events, reach, and community growth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {reports.map((report, index) => (
            <Button
              key={report.year}
              variant={index === 0 ? "brand" : "outline"}
              size="lg"
              asChild
            >
              <a
                href={report.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${report.year} Impact Report`}
              >
                {report.year}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </article>
  );
}
