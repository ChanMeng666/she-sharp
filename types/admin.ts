// Response contract for the admin user-management endpoints
// (`GET /api/admin/users`). These shapes describe what the route serialises,
// so both the route and the client that renders it can share one definition
// instead of each keeping a private copy that drifts.

/** Mentor-side fields, present only once a mentor profile exists. */
export interface MentorInfo {
  isVerified: boolean;
  verifiedAt: string | null;
  isAccepting: boolean;
  maxMentees: number;
  currentMentees: number;
  yearsExperience: number | null;
  expertise: string[];
  bio: string | null;
  linkedinUrl: string | null;
  activeMentees: number;
  totalMentees: number;
  totalSessions: number;
  avgRating: number | null;
  /** Whether the mentor is taking new mentees — not their account status. */
  status: 'active' | 'busy' | 'paused';
}

/** Mentee-side fields, present only once a mentee profile exists. */
export interface MenteeInfo {
  careerStage: string | null;
  currentIndustry: string | null;
  learningGoals: string[];
  bio: string | null;
}

/** The open application attached to a record, if any. */
export interface ApplicationInfo {
  id: number;
  type: 'mentor' | 'mentee';
  status: 'pending' | 'under_review';
  submittedAt: string | null;
  yearsExperience?: number;
  expertise?: string[];
  availabilityHoursPerMonth?: number;
  bio?: string;
  linkedinUrl?: string;
  reviewNotes?: string;
  maxMentees?: number;
}

/**
 * One row of the admin user list. A row is either a registered account or a
 * public application that has no account yet, which is why `userId` and
 * `applicationId` are both nullable and `recordId` (not `id`) is the key.
 */
export interface UnifiedUser {
  id: number;
  recordType: 'registered_user' | 'public_application';
  recordId: string;
  userId: number | null;
  applicationId: number | null;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  isTestUser: boolean;
  emailVerifiedAt: string | null;
  roles: string[];
  membershipTier: 'free' | 'basic' | 'premium';
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_registration';
  createdAt: string;
  lastLoginAt: string | null;
  company: string | null;
  jobTitle: string | null;
  city: string | null;
  mbtiType: string | null;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  applicationInfo: ApplicationInfo | null;
  mentorInfo: MentorInfo | null;
  menteeInfo: MenteeInfo | null;
}

/** Aggregate counters rendered above the table. */
export interface AdminUserStats {
  totalUsers: number;
  testUsers: number;
  totalPublicApplications: number;
  pendingApplications: number;
  byRole: { admin: number; mentor: number; mentee: number };
  byStatus: { active: number; inactive: number; suspended: number; pending_registration: number };
}

/**
 * Body of `GET /api/admin/users`. Every field is optional because the client
 * falls back to empty defaults rather than trusting the shape.
 */
export interface AdminUsersResponse {
  users?: UnifiedUser[];
  totalPages?: number;
  total?: number;
  stats?: AdminUserStats;
}
