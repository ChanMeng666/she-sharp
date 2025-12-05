"use client";

import { InflectedCard } from "@/components/ui/inflected-card";
import { Download } from "lucide-react";

const impactReports = [
  {
    id: "2024",
    year: 2024,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop",
    pdfUrl: "/reports/impact-report-2024.pdf",
  },
  {
    id: "2023",
    year: 2023,
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&auto=format&fit=crop",
    pdfUrl: "/reports/impact-report-2023.pdf",
  },
  {
    id: "2022",
    year: 2022,
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop",
    pdfUrl: "/reports/impact-report-2022.pdf",
  },
  {
    id: "2021",
    year: 2021,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    pdfUrl: "/reports/impact-report-2021.pdf",
  },
];

export function ImpactReportCards() {
  const handleCardClick = (target: string, id: string) => {
    const report = impactReports.find((r) => r.id === id);
    if (report) {
      const link = document.createElement("a");
      link.href = report.pdfUrl;
      link.download = `She-Sharp-Impact-Report-${report.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {impactReports.map((report) => (
        <InflectedCard
          key={report.id}
          id={report.id}
          image={report.image}
          title={`${report.year}`}
          description=""
          tags={[]}
          parentBackgroundColor="#f3e8ff"
          onClick={handleCardClick}
          cardRounding={16}
          fontSizes={{
            title: "1.5rem",
          }}
          margins={{
            title: "0",
            description: "0",
            tags: "0",
          }}
          buttonIcon={<Download />}
          buttonIconSize={28}
          buttonIconColor="#ffffff"
          buttonIconHoverColor="#ffffff"
          buttonBackgroundColor="#9b2e83"
          buttonBackgroundHoverColor="#7a2468"
          imageHoverScale={1.05}
          titleColor="#1a1a1a"
          descriptionColor="#666666"
          titleAlignment="center"
          maxWidth="100%"
        />
      ))}
    </div>
  );
}
