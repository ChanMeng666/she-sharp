/**
 * Shared vocabulary for the volunteer/ambassador recruitment pipeline.
 *
 * Badge colours and labels used to live in three admin components at once
 * (`application-detail`, `applications-table`, `recruitment-pipeline`), which
 * is how the table drifted to an abbreviated "Ex-Amb" label. That abbreviation
 * is deliberate — it is preserved here as `formatRecruitmentType(type, { short: true })`
 * rather than reconciled away, so the narrow table column still fits.
 */

const STAGE_BADGE_CLASSES: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  screening: 'bg-yellow-100 text-yellow-700',
  interview_requested: 'bg-indigo-100 text-indigo-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  onboarding: 'bg-orange-100 text-orange-700',
  nda_sent: 'bg-sky-100 text-sky-700',
  nda_signed: 'bg-teal-100 text-teal-700',
  active: 'bg-emerald-100 text-emerald-700',
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  ambassador: 'bg-purple-100 text-purple-700',
  volunteer: 'bg-blue-100 text-blue-700',
  ex_ambassador: 'bg-amber-100 text-amber-700',
};

const TYPE_LABELS: Record<string, string> = {
  ambassador: 'Ambassador',
  volunteer: 'Volunteer',
  ex_ambassador: 'Ex-Ambassador',
};

/** Short labels for narrow table cells. Only differs where the full label overflows. */
const TYPE_LABELS_SHORT: Record<string, string> = {
  ...TYPE_LABELS,
  ex_ambassador: 'Ex-Amb',
};

const DEFAULT_BADGE_CLASS = 'bg-gray-100 text-gray-700';

/** Tailwind background/foreground pair for a recruitment stage badge. */
export function getStageBadgeClass(stage: string): string {
  return STAGE_BADGE_CLASSES[stage] ?? DEFAULT_BADGE_CLASS;
}

/** Tailwind background/foreground pair for an application type badge. */
export function getTypeBadgeClass(type: string): string {
  return TYPE_BADGE_CLASSES[type] ?? DEFAULT_BADGE_CLASS;
}

/** Human label for an application type; unknown values pass through unchanged. */
export function formatRecruitmentType(
  type: string,
  opts?: { short?: boolean }
): string {
  const labels = opts?.short ? TYPE_LABELS_SHORT : TYPE_LABELS;
  return labels[type] ?? type;
}

/** Title-cases a snake_case stage key, e.g. `nda_sent` → `Nda Sent`. */
export function formatRecruitmentStage(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
