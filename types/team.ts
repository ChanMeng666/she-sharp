// Team roles - strictly typed for compile-time validation
export const TEAM_ROLES = [
  'Trustee',
  'Ambassador',
  'Founder and Chair',
  'Assets Manager',
  'Event Manager',
  'Website Lead',
  'Data Insight Manager',
  'Website Maintenance',
  'Industry',
  'Content Creator',
  'Digital Designer',
  'Secretary',
  'Mentoring Program Lead',
  'Marketing Lead',
  'Marketing',
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export interface TeamMember {
  id?: number;
  name: string;
  roles: TeamRole[];
  image: string;
  description: string;
  featured?: boolean;
}
