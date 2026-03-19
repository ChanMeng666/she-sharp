/**
 * Predefined QR code targets for She Sharp pages.
 * Add new entries here to support QR generation for additional pages.
 */

export interface QRCodeTarget {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** URL path (appended to base URL) */
  path: string;
  /** Optional query parameters */
  queryParams?: Record<string, string>;
  /** Default download filename (without extension) */
  defaultFilename: string;
}

export const qrCodeTargets: QRCodeTarget[] = [
  {
    id: 'her-waka-mentee-apply',
    label: 'HER WAKA Mentee Application',
    path: '/mentorship/mentee/apply',
    queryParams: { programme: 'her-waka' },
    defaultFilename: 'she-sharp-her-waka-apply',
  },
  {
    id: 'mentorship-mentor',
    label: 'Become a Mentor',
    path: '/mentorship/mentor',
    defaultFilename: 'she-sharp-become-mentor',
  },
  {
    id: 'mentorship-mentee',
    label: 'Become a Mentee',
    path: '/mentorship/mentee',
    defaultFilename: 'she-sharp-become-mentee',
  },
  {
    id: 'events',
    label: 'Events',
    path: '/events',
    defaultFilename: 'she-sharp-events',
  },
  {
    id: 'donate',
    label: 'Donate',
    path: '/donate',
    defaultFilename: 'she-sharp-donate',
  },
  {
    id: 'join-our-team',
    label: 'Join Our Team',
    path: '/join-our-team',
    defaultFilename: 'she-sharp-join-team',
  },
];

/**
 * Build a full URL for a QR code target
 */
export function buildTargetUrl(
  baseUrl: string,
  target: QRCodeTarget
): string {
  const url = new URL(target.path, baseUrl);
  if (target.queryParams) {
    for (const [key, value] of Object.entries(target.queryParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
