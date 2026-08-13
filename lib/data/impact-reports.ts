/**
 * Impact report data for She Sharp annual reports
 */

import { IMPACT_REPORT_2024_PDF, IMPACT_REPORT_2025_PDF } from '@/lib/config/assets';
import type { ImpactReport } from '@/types/impact-report';

export const impactReports: ImpactReport[] = [
  {
    year: 2025,
    pdfUrl: IMPACT_REPORT_2025_PDF,
  },
  {
    year: 2024,
    pdfUrl: IMPACT_REPORT_2024_PDF,
  },
];
