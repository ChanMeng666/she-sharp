// Team roles - strictly typed for compile-time validation
//
// She Sharp is volunteer-run and has never formally defined these titles, so
// the rule applied here is: the label should describe the scope the person
// actually covers, taken from their own bio or from what the record shows them
// doing. Several were understating it — "Website Maintenance" for the designer
// who designed and built the site, "Industry" for someone who describes
// herself as industry lead ambassador. Widening a label to match real scope is
// right; inventing a position nobody holds is not.
//
// The older, narrower labels are kept so nothing that still references them
// breaks.
export const TEAM_ROLES = [
  'Trustee',
  'Ambassador',
  'Founder and Chair',
  'Assets Manager',
  'Finance and Assets Manager',
  'Event Manager',
  'Events Coordinator',
  'Website Lead',
  'Website Team Lead',
  'Website Engineer',
  'AI Lead',
  'Data Insight Manager',
  'Website Maintenance',
  'Industry',
  'Industry Lead',
  'Mentor',
  'Content Creator',
  'Digital Designer',
  'Product Designer',
  'Secretary',
  'Mentoring Programme Lead',
  'Marketing Lead',
  'Marketing',
  'UX/UI Designer',
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export interface TeamMember {
  id?: number;
  name: string;
  roles: TeamRole[];
  image: string;
  description: string;
  featured?: boolean;
  linkedin?: string;
}
