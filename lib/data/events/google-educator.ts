export type GoogleEducatorEvent = {
  year: string;
  date: string;
  location: string;
  theme: string;
  status: 'upcoming' | 'completed';
  highlights: string[];
  images: string[];
};

// Centralised data source for Google Educator Conference
export const googleEducatorEvents: Record<string, GoogleEducatorEvent> = {
  '2024': {
    year: '2024',
    date: 'November 2024',
    location: 'Auckland, New Zealand',
    theme: 'AI in Education',
    status: 'upcoming',
    highlights: [
      'Hands-on AI workshops',
      'Google Cloud certification',
      'EdTech innovation showcase',
    ],
    images: [
      // Distinct 2024 poster (from docs)
      'https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66fa6abc3f7f8c3999f55fe3_Google%20educator%20poster.png',
    ],
  },
  '2023': {
    year: '2023',
    date: 'October 2023',
    location: 'Auckland, New Zealand',
    theme: 'Digital Transformation',
    status: 'completed',
    highlights: [
      'Chromebook deployment strategies',
      'Google Workspace for Education',
      'Coding in the classroom',
    ],
    images: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20(1).jpg',
    ],
  },
};

export function getGoogleEducatorYears(): string[] {
  return Object.keys(googleEducatorEvents).sort((a, b) => Number(b) - Number(a));
}

export function getGoogleEducatorEvent(year: string): GoogleEducatorEvent | undefined {
  return googleEducatorEvents[year];
}

export function getLatestYear(preferUpcoming = true): string | undefined {
  const years = getGoogleEducatorYears();
  if (preferUpcoming) {
    const upcoming = years.find((y) => googleEducatorEvents[y].status === 'upcoming');
    if (upcoming) return upcoming;
  }
  return years[0];
}


