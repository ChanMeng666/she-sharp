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
    <Card className="relative h-full w-full overflow-hidden transition-all duration-300 hover:shadow-lg rounded-[50px] group">
      {/* Background Image */}
      <img
        src="/img/impact.jpg"
        alt="Impact background"
        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      <div className="relative z-10 p-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Impact Reports</h3>
            <p className="text-xs text-white/80">Annual achievements</p>
          </div>
        </div>

        {/* Year Buttons */}
        <div className="flex flex-wrap gap-3 mt-auto">
          {reports.map((report, index) => (
            <Button
              key={report.year}
              variant={index === 0 ? "brand" : "outline"}
              size="lg"
              className={index !== 0 ? "bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white" : ""}
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
