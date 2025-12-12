"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { ImpactReport } from "@/types/impact-report";

interface ImpactReportsCardProps {
  reports: ImpactReport[];
}

/**
 * Impact reports card for the journey slot.
 * Shows available annual reports with clickable year buttons linking to Google Drive.
 */
export function ImpactReportsCard({ reports }: ImpactReportsCardProps) {
  return (
    <Card className="h-full w-full overflow-hidden transition-all duration-300 hover:shadow-lg rounded-[50px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30">
      <div className="p-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-dark/10 rounded-xl">
            <FileText className="h-5 w-5 text-purple-dark" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Impact Reports</h3>
            <p className="text-xs text-muted-foreground">Annual achievements</p>
          </div>
        </div>

        {/* Year Buttons */}
        <div className="flex flex-wrap gap-3 mt-auto">
          {reports.map((report, index) => (
            <Button
              key={report.year}
              variant={index === 0 ? "brand" : "ghost"}
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
    </Card>
  );
}
