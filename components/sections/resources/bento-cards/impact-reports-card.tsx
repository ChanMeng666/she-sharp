"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ArrowRight } from "lucide-react";

interface ImpactReport {
  id: string;
  year: number;
  pdfUrl: string;
}

interface ImpactReportsCardProps {
  reports: ImpactReport[];
}

/**
 * Impact reports card for the journey slot.
 * Shows available annual reports with download access.
 */
export function ImpactReportsCard({ reports }: ImpactReportsCardProps) {
  const latestReport = reports[0];

  return (
    <a
      href={latestReport.pdfUrl}
      download={`She-Sharp-Impact-Report-${latestReport.year}.pdf`}
      className="block h-full group"
      aria-label={`Download She Sharp Impact Report ${latestReport.year}`}
    >
      <Card className="relative h-full w-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 rounded-[50px]">
        <div className="p-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-dark/10 rounded-xl">
              <FileText className="h-5 w-5 text-purple-dark" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Impact Reports</h3>
              <p className="text-xs text-muted-foreground">Annual achievements</p>
            </div>
          </div>

          {/* Year Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {reports.map((report, index) => (
              <Badge
                key={report.id}
                variant={index === 0 ? "default" : "outline"}
                className={
                  index === 0
                    ? "bg-purple-dark hover:bg-purple-dark/90 text-white"
                    : "border-purple-200 text-purple-dark hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
                }
              >
                {report.year}
              </Badge>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Latest: {latestReport.year}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-dark group-hover:text-purple-mid transition-colors">
              <Download className="h-4 w-4" />
              Download
            </span>
          </div>
        </div>

        {/* Decorative Corner */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-100/50 dark:bg-purple-900/20 rounded-full" />
      </Card>
    </a>
  );
}
