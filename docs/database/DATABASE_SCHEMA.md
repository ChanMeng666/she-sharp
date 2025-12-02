# Database Schema Documentation

> **Last Updated**: 2025-12-02
> **Database**: PostgreSQL 16 (Neon)
> **ORM**: Drizzle ORM
> **Total Tables**: 44
> **Total Enums**: 24

## Overview

The She Sharp platform uses a PostgreSQL database hosted on Neon with comprehensive schema design supporting:
- Multi-role user system (mentor/mentee/admin)
- Advanced mentorship relationship management with AI-powered matching
- Event and resource management
- Points/rewards gamification system
- Membership subscription management
- Form submissions for mentor/mentee onboarding
- Activity logging and analytics
- Email verification and OAuth authentication

## Database Connection

```typescript
// Database URL format (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

## Enum Types (24 Total)

| Enum Name | Values |
|-----------|--------|
| `user_role_type` | mentor, mentee, admin |
| `membership_tier` | free, basic, premium |
| `relationship_status` | pending, active, paused, completed, rejected |
| `meeting_status` | scheduled, completed, cancelled, no_show |
| `meeting_type` | intro, regular, milestone, final |
| `event_type` | workshop, networking, training, social, thrive |
| `location_type` | online, in_person, hybrid |
| `resource_type` | document, video, link, template, guide |
| `resource_access_level` | public, member, premium |
| `invitation_code_status` | active, used, expired, revoked |
| `invitation_code_type` | payment, mentor_approved, admin_generated |
| `form_status` | not_started, in_progress, submitted, approved, rejected |
| `bio_method` | self_written, ai_generated, already_sent |
| `career_stage` | undergraduate, postgraduate, early_career, mid_career, senior, career_transition |
| `mentee_type_preference` | undergraduate, postgraduate, professional |
| `points_transaction_type` | event_attendance, meeting_completed, referral_bonus, milestone_reward, redemption, admin_adjustment |
| `match_status` | pending_review, approved, rejected, active, expired |
| `subscription_status` | active, past_due, canceled, incomplete, trialing, unpaid |
| `mbti_type` | INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP |
| `gender` | female, male, non_binary, prefer_not_to_say, other |
| `skill_category` | soft_basic, soft_expert, industry_basic, industry_expert |
| `meeting_format` | online, in_person, hybrid |
| `queue_status` | waiting, matching_in_progress, matched, expired, cancelled |
| `confidence_level` | high, medium, low |

## Table Categories

### 1. Core User System (5 tables)
| Table | Description |
|-------|-------------|
| `users` | Core user accounts with authentication data |
| `user_roles` | Multi-role activation system (mentor/mentee/admin) |
| `admin_permissions` | Granular admin access control |
| `user_memberships` | Membership tier and subscription management |
| `user_mentorship_stats` | Aggregated user statistics cache |

### 2. Authentication & Security (6 tables)
| Table | Description |
|-------|-------------|
| `account` | NextAuth OAuth accounts (Google, GitHub) |
| `session` | NextAuth active sessions |
| `verification_token` | NextAuth email verification tokens |
| `email_verifications` | Custom email verification tokens |
| `password_resets` | Password reset tokens |
| `password_history` | Password change history |

### 3. Mentorship System (5 tables)
| Table | Description |
|-------|-------------|
| `mentor_profiles` | Mentor expertise, availability, verification |
| `mentee_profiles` | Mentee goals, preferences, career stage |
| `mentorship_relationships` | Active mentor-mentee pairings |
| `meetings` | Meeting scheduling, notes, and feedback |
| `mentee_waiting_queue` | Queue for mentees awaiting AI matching |

### 4. Form Submissions (2 tables)
| Table | Description |
|-------|-------------|
| `mentor_form_submissions` | Mentor application form data |
| `mentee_form_submissions` | Mentee application form data |

### 5. AI Matching System (2 tables)
| Table | Description |
|-------|-------------|
| `ai_match_results` | AI-generated mentor-mentee match scores |
| `ai_matching_runs` | Batch matching run records and statistics |

### 6. Events System (3 tables)
| Table | Description |
|-------|-------------|
| `events` | Event listings with details |
| `event_registrations` | User event registrations and attendance |
| `event_role_assignments` | Event staff/volunteer assignments |

### 7. Resources System (2 tables)
| Table | Description |
|-------|-------------|
| `resources` | Learning materials and documents |
| `resource_access_logs` | Resource access tracking |

### 8. Points & Gamification (7 tables)
| Table | Description |
|-------|-------------|
| `user_points` | User point balances and levels |
| `points_transactions` | Point earning/spending history |
| `points_rules` | Point earning rules configuration |
| `milestones` | Achievement milestone definitions |
| `user_milestones` | User achieved milestones |
| `rewards` | Reward catalog |
| `reward_redemptions` | Reward redemption records |
| `experience_levels` | Level progression configuration |

### 9. Membership & Payments (3 tables)
| Table | Description |
|-------|-------------|
| `membership_features` | Feature flags per tier |
| `membership_benefits` | Benefit descriptions per tier |
| `membership_purchases` | Stripe payment records |

### 10. Invitation System (2 tables)
| Table | Description |
|-------|-------------|
| `invitation_codes` | Registration/access codes |
| `invitation_code_usages` | Code usage tracking |

### 11. Configuration (2 tables)
| Table | Description |
|-------|-------------|
| `skill_options` | Predefined skill selections |
| `industry_options` | Industry selection options |

### 12. Activity & Logging (1 table)
| Table | Description |
|-------|-------------|
| `activity_logs` | System activity audit trail |

### 13. Legacy Tables (4 tables - deprecated)
| Table | Description |
|-------|-------------|
| `teams` | Organization teams (legacy) |
| `team_members` | Team membership (legacy) |
| `invitations` | Team invitations (legacy) |

---

## Detailed Table Schemas

### Core User Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  email_verified TIMESTAMP,
  image TEXT,
  gender gender,
  phone VARCHAR(50),
  age INTEGER,
  registered_via_invite_code INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);
```

**Key Features**:
- Soft delete support via `deleted_at`
- Account locking mechanism for security
- OAuth integration via `image` field
- Email verification tracking
- Gender, phone, age for extended profiles
- Invitation code tracking for referrals

### Multi-Role System

```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type user_role_type NOT NULL,
  activated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  activation_step INTEGER DEFAULT 0,
  verified_at TIMESTAMP,
  UNIQUE(user_id, role_type)
);

CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_type_idx ON user_roles(role_type);
```

**Key Features**:
- Users can have multiple roles simultaneously
- Independent activation for each role
- Step-based onboarding tracking
- Verification timestamp for mentors

### Mentor Profiles

```sql
CREATE TABLE mentor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise_areas JSONB,
  years_experience INTEGER,
  company VARCHAR(200),
  job_title VARCHAR(200),
  bio TEXT,
  linkedin_url VARCHAR(500),
  availability_hours_per_month INTEGER,
  max_mentees INTEGER DEFAULT 3,
  current_mentees_count INTEGER DEFAULT 0,
  is_accepting_mentees BOOLEAN DEFAULT TRUE,
  profile_completed_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  mbti_type mbti_type,
  photo_url VARCHAR(500),
  form_submission_id INTEGER
);

CREATE INDEX mentor_profiles_user_id_idx ON mentor_profiles(user_id);
```

### Mentee Profiles

```sql
CREATE TABLE mentee_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_goals JSONB,
  career_stage VARCHAR(100),
  preferred_expertise_areas JSONB,
  preferred_meeting_frequency VARCHAR(50),
  bio TEXT,
  current_challenge TEXT,
  profile_completed_at TIMESTAMP,
  mbti_type mbti_type,
  photo_url VARCHAR(500),
  form_submission_id INTEGER
);

CREATE INDEX mentee_profiles_user_id_idx ON mentee_profiles(user_id);
```

### Mentorship Relationships

```sql
CREATE TABLE mentorship_relationships (
  id SERIAL PRIMARY KEY,
  mentor_user_id INTEGER NOT NULL REFERENCES users(id),
  mentee_user_id INTEGER NOT NULL REFERENCES users(id),
  status relationship_status DEFAULT 'pending' NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  paused_at TIMESTAMP,
  meeting_frequency VARCHAR(50),
  next_meeting_date TIMESTAMP,
  relationship_goals TEXT,
  mentor_notes TEXT,
  mentee_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX relationships_mentor_idx ON mentorship_relationships(mentor_user_id);
CREATE INDEX relationships_mentee_idx ON mentorship_relationships(mentee_user_id);
CREATE INDEX relationships_status_idx ON mentorship_relationships(status);
```

**Status Flow**:
1. `pending` - Initial application by mentee
2. `active` - Approved by mentor, mentorship ongoing
3. `paused` - Temporarily suspended
4. `completed` - Successfully finished
5. `rejected` - Mentor declined the application

### Meetings

```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  relationship_id INTEGER NOT NULL REFERENCES mentorship_relationships(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_type meeting_type DEFAULT 'regular' NOT NULL,
  meeting_link VARCHAR(500),
  status meeting_status DEFAULT 'scheduled' NOT NULL,
  topics_discussed JSONB,
  goals_set JSONB,
  action_items JSONB,
  mentor_notes TEXT,
  mentee_feedback TEXT,
  rating INTEGER,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  recording_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX meetings_relationship_idx ON meetings(relationship_id);
CREATE INDEX meetings_scheduled_at_idx ON meetings(scheduled_at);
CREATE INDEX meetings_status_idx ON meetings(status);
```

### Mentor Form Submissions

```sql
CREATE TABLE mentor_form_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  status form_status DEFAULT 'not_started' NOT NULL,
  last_saved_at TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  -- Personal info
  full_name VARCHAR(200),
  gender gender,
  phone VARCHAR(50),
  job_title VARCHAR(200),
  company VARCHAR(200),
  photo_url VARCHAR(500),
  photo_uploaded_at TIMESTAMP,
  city VARCHAR(100),
  preferred_meeting_format meeting_format,
  -- Bio
  bio_method bio_method,
  bio TEXT,
  -- Skills
  soft_skills_basic JSONB,
  industry_skills_basic JSONB,
  soft_skills_expert JSONB,
  industry_skills_expert JSONB,
  -- Goals
  expected_mentee_goals_long_term TEXT,
  expected_mentee_goals_short_term TEXT,
  program_expectations TEXT,
  preferred_mentee_types JSONB,
  preferred_industries JSONB,
  mbti_type mbti_type,
  years_experience INTEGER,
  linkedin_url VARCHAR(500),
  availability_hours_per_month INTEGER,
  max_mentees INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Mentee Form Submissions

```sql
CREATE TABLE mentee_form_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  status form_status DEFAULT 'not_started' NOT NULL,
  last_saved_at TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  -- Payment tracking
  payment_completed BOOLEAN DEFAULT FALSE,
  payment_completed_at TIMESTAMP,
  purchase_id INTEGER,
  invitation_code_id INTEGER,
  -- Personal info
  full_name VARCHAR(200),
  gender gender,
  age INTEGER,
  phone VARCHAR(50),
  current_stage career_stage,
  photo_url VARCHAR(500),
  photo_uploaded_at TIMESTAMP,
  bio TEXT,
  city VARCHAR(100),
  preferred_meeting_format meeting_format,
  -- Professional
  current_job_title VARCHAR(200),
  current_industry VARCHAR(200),
  preferred_industries JSONB,
  -- Skills
  soft_skills_basic JSONB,
  industry_skills_basic JSONB,
  soft_skills_expert JSONB,
  industry_skills_expert JSONB,
  -- Goals
  long_term_goals TEXT,
  short_term_goals TEXT,
  why_mentor TEXT,
  program_expectations TEXT,
  mbti_type mbti_type,
  preferred_meeting_frequency VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### AI Match Results

```sql
CREATE TABLE ai_match_results (
  id SERIAL PRIMARY KEY,
  mentor_user_id INTEGER NOT NULL REFERENCES users(id),
  mentee_user_id INTEGER NOT NULL REFERENCES users(id),
  overall_score NUMERIC(5, 2) NOT NULL,
  mbti_compatibility_score NUMERIC(5, 2),
  skill_match_score NUMERIC(5, 2),
  goal_alignment_score NUMERIC(5, 2),
  industry_match_score NUMERIC(5, 2),
  logistics_score NUMERIC(5, 2),
  ai_explanation TEXT,
  ai_recommendation TEXT,
  confidence_level confidence_level,
  potential_challenges JSONB,
  suggested_focus_areas JSONB,
  processing_time_ms INTEGER,
  token_usage JSONB,
  matching_factors JSONB,
  ai_model_version VARCHAR(50),
  matching_algorithm VARCHAR(100),
  status match_status DEFAULT 'pending_review' NOT NULL,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  relationship_id INTEGER REFERENCES mentorship_relationships(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(mentor_user_id, mentee_user_id)
);
```

### Events System

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  location_type location_type NOT NULL,
  location_details JSONB,
  capacity INTEGER,
  current_registrations INTEGER DEFAULT 0,
  registration_deadline TIMESTAMP,
  waitlist_enabled BOOLEAN DEFAULT FALSE,
  is_members_only BOOLEAN DEFAULT FALSE,
  required_membership_tier membership_tier,
  agenda JSONB,
  speakers JSONB,
  materials JSONB,
  actual_attendance INTEGER,
  feedback_score NUMERIC(3, 2),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Event Registrations

```sql
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW() NOT NULL,
  role_in_event VARCHAR(50),
  checked_in_at TIMESTAMP,
  checked_out_at TIMESTAMP,
  attendance_duration INTEGER,
  feedback_submitted BOOLEAN DEFAULT FALSE,
  feedback_score INTEGER,
  feedback_comments TEXT,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url VARCHAR(500),
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  attendance_confirmed_by INTEGER REFERENCES users(id),
  attendance_confirmed_at TIMESTAMP,
  points_awarded INTEGER DEFAULT 0,
  UNIQUE(event_id, user_id)
);
```

### User Points

```sql
CREATE TABLE user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_points INTEGER DEFAULT 0 NOT NULL,
  lifetime_points INTEGER DEFAULT 0 NOT NULL,
  experience_level INTEGER DEFAULT 1 NOT NULL,
  experience_level_name VARCHAR(100) DEFAULT 'Newcomer',
  events_attended INTEGER DEFAULT 0 NOT NULL,
  meetings_completed INTEGER DEFAULT 0 NOT NULL,
  last_milestone_achieved VARCHAR(100),
  next_milestone_target INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Points Transactions

```sql
CREATE TABLE points_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type points_transaction_type NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_entity_type VARCHAR(50),
  source_entity_id INTEGER,
  description TEXT,
  confirmed_by INTEGER REFERENCES users(id),
  confirmed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### User Memberships

```sql
CREATE TABLE user_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier membership_tier DEFAULT 'free' NOT NULL,
  expires_at TIMESTAMP,
  features_access JSONB,
  last_payment_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_purchase_id INTEGER,
  event_priority_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Membership Purchases

```sql
CREATE TABLE membership_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  amount_paid NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NZD' NOT NULL,
  membership_tier membership_tier NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  subscription_status subscription_status NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  canceled_at TIMESTAMP,
  cancel_reason TEXT,
  invoice_url VARCHAR(500),
  receipt_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Invitation Codes

```sql
CREATE TABLE invitation_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  code_type invitation_code_type DEFAULT 'payment' NOT NULL,
  status invitation_code_status DEFAULT 'active' NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP,
  purchase_id INTEGER,
  generated_by INTEGER REFERENCES users(id),
  generated_for VARCHAR(255),
  target_role user_role_type,
  linked_form_id INTEGER,
  linked_form_type VARCHAR(20),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Admin Permissions

```sql
CREATE TABLE admin_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view_all_data BOOLEAN DEFAULT TRUE,
  can_edit_users BOOLEAN DEFAULT TRUE,
  can_manage_relationships BOOLEAN DEFAULT TRUE,
  can_access_analytics BOOLEAN DEFAULT TRUE,
  can_manage_content BOOLEAN DEFAULT TRUE,
  can_verify_mentors BOOLEAN DEFAULT TRUE,
  can_manage_events BOOLEAN DEFAULT TRUE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Activity Logs

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  team_id INTEGER,  -- Legacy field
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45)
);

CREATE INDEX activity_logs_user_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity_type, entity_id);
```

---

## Index Summary

All tables include appropriate indexes for:
- Primary keys (auto-indexed)
- Foreign key relationships
- Frequently queried columns
- Composite indexes for complex queries

Key indexes:
- `user_roles(user_id, role_type)` - Fast role lookups
- `mentorship_relationships(mentor_user_id, mentee_user_id, status)` - Relationship queries
- `events(start_time, event_type)` - Event filtering
- `ai_match_results(mentor_user_id, mentee_user_id, status, overall_score)` - Match queries
- `points_transactions(user_id, transaction_type)` - Points history

---

## JSONB Field Structures

### expertise_areas / learning_goals
```json
["Software Engineering", "Machine Learning", "Leadership"]
```

### features_access
```json
{
  "maxMentorApplications": true,
  "accessBasicResources": true,
  "joinFreeEvents": true,
  "viewMentorProfiles": true,
  "accessPremiumResources": false,
  "unlimitedMeetings": false
}
```

### location_details
```json
{
  "address": "123 Main St, Auckland",
  "venue": "Conference Center",
  "room": "Room A",
  "meetingLink": "https://zoom.us/j/xxx",
  "instructions": "Enter through side door"
}
```

### matching_factors
```json
{
  "mbti": {
    "mentorType": "INTJ",
    "menteeType": "ENFP",
    "compatibilityReason": "Complementary thinking styles"
  },
  "skills": {
    "matchedSkills": ["Python", "Data Analysis"],
    "complementarySkills": ["Leadership"]
  },
  "goals": {
    "alignedGoals": ["Career transition to tech"],
    "mentorCanHelp": ["Technical interview prep"]
  },
  "strengths": ["Strong communication match"],
  "challenges": ["Different time zones"]
}
```

### token_usage
```json
{
  "prompt": 1500,
  "completion": 800,
  "total": 2300
}
```

---

## Migration Management

### Current Migration Files

```
lib/db/migrations/
├── 0000_soft_the_anarchist.sql       # Initial schema
├── 0001_flat_starjammers.sql         # NextAuth tables
├── 0002_ordinary_cargill.sql         # Email verification
├── 0003_ambitious_madame_hydra.sql   # Activity logs update
├── 0004_keen_mandarin.sql            # Password security
├── 0005_add_entity_type_column.sql   # Activity logs enhancement
├── 0008_add_notifications_table.sql  # Notifications system
├── 0009_add_statistics_and_features.sql  # Analytics tables
├── 0010_update_meetings_table.sql    # Meeting enhancements
├── 0011_fix_resources_table.sql      # Resource management
├── 0012_fix_admin_permissions.sql    # Admin system
├── 0013_furry_famine.sql             # Business logic update
├── 0014_swift_hydra.sql              # Additional fields
├── 0015_overjoyed_nico_minoru.sql    # Form fields
├── 0016_purple_wendigo.sql           # AI matching enhancements
└── meta/
```

### Migration Commands

```bash
# Check migration status
pnpm db:status

# View migration history
pnpm db:history

# Generate new migration after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Create a snapshot before changes
pnpm db:snapshot "description"
```

---

## Common Query Patterns

### Get User with All Roles and Profiles

```typescript
const userWithRoles = await db
  .select({
    user: users,
    roles: userRoles,
    mentorProfile: mentorProfiles,
    menteeProfile: menteeProfiles,
    membership: userMemberships
  })
  .from(users)
  .leftJoin(userRoles, eq(users.id, userRoles.userId))
  .leftJoin(mentorProfiles, eq(users.id, mentorProfiles.userId))
  .leftJoin(menteeProfiles, eq(users.id, menteeProfiles.userId))
  .leftJoin(userMemberships, eq(users.id, userMemberships.userId))
  .where(eq(users.id, userId));
```

### Get Active Mentorship Relationships

```typescript
const activeRelationships = await db
  .select()
  .from(mentorshipRelationships)
  .where(
    and(
      or(
        eq(mentorshipRelationships.mentorUserId, userId),
        eq(mentorshipRelationships.menteeUserId, userId)
      ),
      eq(mentorshipRelationships.status, 'active')
    )
  );
```

### Get AI Match Results for a Mentee

```typescript
const matches = await db
  .select()
  .from(aiMatchResults)
  .where(
    and(
      eq(aiMatchResults.menteeUserId, menteeUserId),
      eq(aiMatchResults.status, 'pending_review')
    )
  )
  .orderBy(desc(aiMatchResults.overallScore));
```

### Get User Points and Level

```typescript
const userPointsData = await db
  .select()
  .from(userPoints)
  .where(eq(userPoints.userId, userId))
  .limit(1);
```

---

## Security Considerations

### Data Privacy
- **Soft Deletes**: Users marked with `deleted_at` are excluded from queries
- **Email Verification**: Unverified users have limited access
- **Account Locking**: Automatic after failed login attempts
- **Password History**: Prevents password reuse

### Access Control
- **User Data Access**: Users should only access their own data
- **Mentor Profiles**: Only verified mentors are publicly visible
- **Mentorship Relationships**: Both parties have full access
- **Admin Operations**: Require admin role verification
- **Activity Logs**: Read-only for regular users

---

## Legacy Fields (Deprecated)

The following fields are deprecated but kept for backward compatibility:

### In `teams` table (entire table legacy)
- Entire table is legacy from previous architecture

### In `activity_logs`
- `team_id` - Replaced by `entity_type` + `entity_id` pattern

> **Note**: These fields should not be used in new code. They will be removed in a future major version.

---

## Related Documentation

- [Database Version Control Guide](DATABASE_VERSION_CONTROL.md)
- [Migration Quick Start](MIGRATION_QUICK_START.md)
- [Schema Changes Guide](../CLAUDE.md#adding-a-database-table)
