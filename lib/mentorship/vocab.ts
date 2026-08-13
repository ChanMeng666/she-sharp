/**
 * Single source of truth for the mentorship domain vocabulary.
 *
 * Before this file existed the same option lists were declared verbatim in four
 * pages (the mentee/mentor application forms and the mentee/mentor dashboard
 * profile editors) plus two partial copies (the admin user table's industry map
 * and the mentorship dashboard's value -> label lookups). The same database
 * column could therefore be offered different option lists depending on which
 * page the user happened to be on.
 *
 * Two rules keep it that way:
 *  1. Every set whose column is a Postgres enum is bound to that enum's values
 *     at compile time, so it can never drift from the database. Adding a value
 *     to the enum without adding a label here is a type error, and adding a
 *     label for a value the enum does not have is a type error too.
 *  2. Sets whose column is free text (city, industry, skills, meeting
 *     frequency) are plain literals here and nowhere else.
 *
 * The binding to `@/lib/db/schema` is `import type` on purpose. Every consumer
 * of this file is a `'use client'` page, and a runtime import would pull the
 * whole Drizzle schema — every table and column definition — into the browser
 * bundle of a public marketing form. Type-only imports are fully erased, and a
 * compile-time check is stricter anyway: a new enum value fails the build here
 * instead of silently appearing in a form with no label.
 */

import type {
  careerStageEnum,
  genderEnum,
  mbtiTypeEnum,
  meetingFormatEnum,
  menteeTypePreferenceEnum,
} from '@/lib/db/schema';

/** A selectable option: the value persisted, and the wording shown to the user. */
export interface VocabOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

/**
 * Builds an ordered option list from an exhaustive value -> label record.
 * When `TValue` is a database enum union the record cannot omit a value or
 * invent one, which is what binds the list to the schema.
 */
function optionsFrom<TValue extends string>(
  labels: Record<TValue, string>
): ReadonlyArray<VocabOption<TValue>> {
  return (Object.keys(labels) as TValue[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

/** Inverts an option list into the value -> label lookup that read-only views need. */
export function labelMap(options: ReadonlyArray<VocabOption>): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

// ---------------------------------------------------------------------------
// Enum-backed sets (only these values are legal in the database)
// ---------------------------------------------------------------------------

export type Gender = (typeof genderEnum.enumValues)[number];

export const genderOptions = optionsFrom<Gender>({
  female: 'Female',
  male: 'Male',
  non_binary: 'Non-binary',
  prefer_not_to_say: 'Prefer not to say',
  other: 'Other',
});

export type MeetingFormat = (typeof meetingFormatEnum.enumValues)[number];

export const meetingFormatOptions = optionsFrom<MeetingFormat>({
  online: 'Online (Virtual meetings only)',
  in_person: 'In-Person (Face-to-face meetings)',
  hybrid: 'Hybrid (Both online and in-person)',
});

export type CareerStage = (typeof careerStageEnum.enumValues)[number];

/**
 * Backs the mentee application form's "current stage" question and the mentee
 * profile editor's "career stage" field. They were separate constants under two
 * names; the values and labels were identical.
 */
export const careerStageOptions = optionsFrom<CareerStage>({
  undergraduate: 'Undergraduate/Graduate',
  postgraduate: 'Post Graduate',
  early_career: 'Professional - Early Career (0-3 years)',
  mid_career: 'Professional - Mid Career (3-7 years)',
  senior: 'Professional - Senior (7+ years)',
  career_transition: 'Career Transition',
});

export type MenteeTypePreference = (typeof menteeTypePreferenceEnum.enumValues)[number];

/** Which kinds of mentee a mentor is willing to take on. */
export const menteeTypeOptions = optionsFrom<MenteeTypePreference>({
  undergraduate: 'Undergraduate/Graduate',
  postgraduate: 'Post Graduate',
  professional: 'Professional',
});

export type MbtiType = (typeof mbtiTypeEnum.enumValues)[number];

/**
 * Bound to `mbtiTypeEnum` in both directions: `satisfies` rejects a type the
 * enum does not have, and `assertExhaustive` below fails the build if the enum
 * gains one this list is missing.
 */
export const mbtiTypes = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const satisfies readonly MbtiType[];

/** Compile-time only: fails if `Covered` does not span every member of `All`. */
type AssertCovers<All extends Covered, Covered> = All extends Covered ? true : never;
type _MbtiIsExhaustive = AssertCovers<MbtiType, (typeof mbtiTypes)[number]>;

// ---------------------------------------------------------------------------
// Free-text sets (the column is varchar/jsonb; these lists are the only
// definition of what the site offers)
// ---------------------------------------------------------------------------

/** New Zealand cities used for location matching, plus the two catch-alls. */
export const nzCities: ReadonlyArray<VocabOption> = [
  { value: 'auckland', label: 'Auckland' },
  { value: 'wellington', label: 'Wellington' },
  { value: 'christchurch', label: 'Christchurch' },
  { value: 'hamilton', label: 'Hamilton' },
  { value: 'tauranga', label: 'Tauranga' },
  { value: 'dunedin', label: 'Dunedin' },
  { value: 'palmerston_north', label: 'Palmerston North' },
  { value: 'napier_hastings', label: 'Napier-Hastings' },
  { value: 'nelson', label: 'Nelson' },
  { value: 'rotorua', label: 'Rotorua' },
  { value: 'other_nz', label: 'Other (New Zealand)' },
  { value: 'international', label: 'International' },
];

export const industryOptions: ReadonlyArray<VocabOption> = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'it_cs', label: 'Information Technology (IT) and Computer Science' },
  { value: 'healthcare', label: 'Healthcare and Medicine' },
  { value: 'biotech', label: 'Biotechnology and Life Sciences' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'agriculture', label: 'Agriculture and Food Science' },
  { value: 'environmental', label: 'Environmental Science and Sustainability' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'robotics', label: 'Robotics and Automation' },
  { value: 'manufacturing', label: 'Manufacturing and Materials Science' },
  { value: 'aerospace', label: 'Aerospace and Defense' },
  { value: 'finance', label: 'Finance and Banking' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export const softSkillsOptions: readonly string[] = [
  'Communication',
  'Leadership',
  'Problem Solving',
  'Time Management',
  'Critical Thinking',
  'Teamwork',
  'Adaptability',
  'Creativity',
  'Emotional Intelligence',
  'Conflict Resolution',
  'Negotiation',
  'Presentation',
  'Networking',
  'Active Listening',
  'Decision Making',
];

export const industrySkillsOptions: readonly string[] = [
  'Software Development',
  'Data Science',
  'Product Management',
  'UX/UI Design',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'Machine Learning',
  'Mobile Development',
  'Web Development',
  'Database Management',
  'System Architecture',
  'Project Management',
  'Agile/Scrum',
  'Business Analysis',
  'Quality Assurance',
  'Customer Service',
  'Event Planning',
  'Research',
  'Technical Writing',
];

/**
 * How often a mentee wants to meet. `preferred_meeting_frequency` is a
 * varchar, not an enum, which is how two different lists came to be offered:
 * the application form wrote `biweekly`/`flexible` while the dashboard profile
 * editor wrote `bi_weekly`/`as_needed`.
 *
 * The reconciled list is the union, minus `bi_weekly` — that was a spelling
 * variant of `biweekly` carrying the identical label, so keeping both would put
 * two items reading "Bi-weekly" in the same select. `biweekly` wins because it
 * is what the application form (the source of nearly every record) writes, what
 * `scripts/seed-profiles.ts` writes, and the only spelling the mentorship
 * dashboard's admin view can already render.
 */
export const meetingFrequencyOptions: ReadonlyArray<VocabOption> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'as_needed', label: 'As Needed' },
];
