# Database Schema Documentation

> **Last Updated**: 2025-01-09
> **Database**: PostgreSQL 16 (Neon)
> **ORM**: Drizzle ORM
> **Total Tables**: 28

## Overview

The She Sharp platform uses a PostgreSQL database hosted on Neon with comprehensive schema design supporting:
- Multi-role user system (mentor/mentee/admin)
- Advanced mentorship relationship management
- Event and resource management
- Activity logging and analytics
- Email verification and OAuth authentication

## Database Connection

```typescript
// Database URL format (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

## Table Categories

### 1. User Authentication & Management (7 tables)
- `users` - Core user accounts
- `user_roles` - Multi-role activation system
- `account` - NextAuth OAuth accounts
- `session` - NextAuth sessions
- `verification_token` - NextAuth verification
- `email_verifications` - Custom email verification
- `password_resets` - Password reset tokens
- `password_history` - Password change tracking

### 2. Team & Organization (3 tables)
- `teams` - Organization teams (legacy)
- `team_members` - Team membership
- `invitations` - Team invitations

### 3. Mentorship System (5 tables)
- `mentor_profiles` - Mentor information and expertise
- `mentee_profiles` - Mentee goals and preferences
- `mentorship_relationships` - Mentor-mentee pairings
- `meetings` - Meeting scheduling and notes
- `user_mentorship_stats` - Aggregated mentorship statistics

### 4. Events & Resources (4 tables)
- `events` - Event listings
- `event_registrations` - User event registrations
- `event_role_assignments` - Event staff assignments
- `resources` - Learning materials
- `resource_access_logs` - Resource download tracking

### 5. Membership & Permissions (3 tables)
- `user_memberships` - Membership tiers and features
- `membership_features` - Feature definitions per tier
- `admin_permissions` - Admin access control

### 6. Communication & Logging (6 tables)
- `activity_logs` - System activity tracking
- `notifications` - User notifications
- `notification_preferences` - Notification settings
- `email_queue` - Outbound email queue
- Plus email verification and password reset tables

## Detailed Table Schemas

### Core User Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  image TEXT  -- For OAuth profile pictures
);
```

**Key Features**:
- Soft delete support via `deleted_at`
- Account locking mechanism for security
- OAuth integration via `image` field
- Email verification tracking

### Multi-Role System

```sql
CREATE TYPE user_role_type AS ENUM('mentor', 'mentee', 'admin');

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
  expertise_areas JSONB,  -- Array of expertise strings
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
  verified_by INTEGER REFERENCES users(id)
);

CREATE INDEX mentor_profiles_user_id_idx ON mentor_profiles(user_id);
```

**JSON Structure Examples**:
```json
{
  "expertise_areas": ["Software Engineering", "Machine Learning", "Leadership"]
}
```

### Mentee Profiles

```sql
CREATE TABLE mentee_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_goals JSONB,  -- Array of goal strings
  career_stage VARCHAR(100),
  preferred_expertise_areas JSONB,  -- Array of expertise strings
  preferred_meeting_frequency VARCHAR(50),
  bio TEXT,
  current_challenge TEXT,
  profile_completed_at TIMESTAMP
);

CREATE INDEX mentee_profiles_user_id_idx ON mentee_profiles(user_id);
```

### Mentorship Relationships

```sql
CREATE TYPE relationship_status AS ENUM(
  'pending', 'active', 'paused', 'completed', 'rejected'
);

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
CREATE TYPE meeting_type AS ENUM('intro', 'regular', 'milestone', 'final');
CREATE TYPE meeting_status AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');

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
  rating INTEGER,  -- 1-5 scale
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

### Events System

```sql
CREATE TYPE event_type AS ENUM('workshop', 'networking', 'training', 'social', 'thrive');
CREATE TYPE location_type AS ENUM('online', 'in_person', 'hybrid');

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  location_type location_type NOT NULL,
  location_details JSONB,  -- Address or virtual meeting info
  capacity INTEGER,
  current_registrations INTEGER DEFAULT 0,
  registration_deadline TIMESTAMP,
  waitlist_enabled BOOLEAN DEFAULT FALSE,
  is_members_only BOOLEAN DEFAULT FALSE,
  required_membership_tier membership_tier,
  agenda JSONB,  -- Array of agenda items
  speakers JSONB,  -- Array of speaker info
  materials JSONB,  -- Array of material links
  actual_attendance INTEGER,
  feedback_score NUMERIC(3, 2),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX events_type_idx ON events(event_type);
CREATE INDEX events_start_time_idx ON events(start_time);
CREATE INDEX events_created_by_idx ON events(created_by);
```

### Event Registrations

```sql
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW() NOT NULL,
  role_in_event VARCHAR(50),  -- 'attendee', 'speaker', 'volunteer'
  checked_in_at TIMESTAMP,
  checked_out_at TIMESTAMP,
  attendance_duration INTEGER,  -- Minutes
  feedback_submitted BOOLEAN DEFAULT FALSE,
  feedback_score INTEGER,
  feedback_comments TEXT,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url VARCHAR(500),
  UNIQUE(event_id, user_id)
);

CREATE INDEX registrations_event_idx ON event_registrations(event_id);
CREATE INDEX registrations_user_idx ON event_registrations(user_id);
```

### User Memberships

```sql
CREATE TYPE membership_tier AS ENUM('free', 'basic', 'premium');

CREATE TABLE user_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier membership_tier DEFAULT 'free' NOT NULL,
  expires_at TIMESTAMP,
  features_access JSONB,  -- Dynamic feature flags

  -- Billing tracking (no payment processing)
  last_payment_at TIMESTAMP,
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Legacy Stripe fields (deprecated, kept for compatibility)
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX memberships_user_id_idx ON user_memberships(user_id);
CREATE INDEX memberships_tier_idx ON user_memberships(tier);
```

**Features Access Example**:
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

CREATE INDEX admin_permissions_user_id_idx ON admin_permissions(user_id);
```

### Activity Logs

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  team_id INTEGER,  -- Legacy field, kept for compatibility
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type VARCHAR(50),  -- 'user', 'relationship', 'event', 'resource'
  entity_id INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45)
);

CREATE INDEX activity_logs_user_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity_type, entity_id);
```

## Migration Management

### Current Migration Status

The database uses Drizzle ORM for migrations with the following applied:

```bash
# Check migration status
pnpm db:status

# View migration history
pnpm db:history

# Generate new migration after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

### Migration Files Location
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
└── 0012_fix_admin_permissions.sql    # Admin system
```

## Common Query Patterns

### Get User with All Roles and Profiles

```typescript
const userWithRoles = await db
  .select({
    user: users,
    roles: user_roles,
    mentorProfile: mentor_profiles,
    menteeProfile: mentee_profiles,
    membership: user_memberships
  })
  .from(users)
  .leftJoin(user_roles, eq(users.id, user_roles.userId))
  .leftJoin(mentor_profiles, eq(users.id, mentor_profiles.userId))
  .leftJoin(mentee_profiles, eq(users.id, mentee_profiles.userId))
  .leftJoin(user_memberships, eq(users.id, user_memberships.userId))
  .where(eq(users.id, userId));
```

### Get Active Mentorship Relationships

```typescript
const activeRelationships = await db
  .select()
  .from(mentorship_relationships)
  .where(
    and(
      or(
        eq(mentorship_relationships.mentorUserId, userId),
        eq(mentorship_relationships.menteeUserId, userId)
      ),
      eq(mentorship_relationships.status, 'active')
    )
  );
```

### Get Upcoming Events

```typescript
const upcomingEvents = await db
  .select()
  .from(events)
  .where(
    and(
      gte(events.startTime, new Date()),
      or(
        eq(events.isMembersOnly, false),
        isNull(events.requiredMembershipTier)
      )
    )
  )
  .orderBy(asc(events.startTime));
```

## Security Considerations

### Row-Level Security (RLS)

While not currently implemented in Drizzle, consider these security patterns:

1. **User Data Access**: Users should only access their own data
2. **Mentor Profiles**: Only verified mentors are publicly visible
3. **Mentorship Relationships**: Both parties have full access
4. **Admin Operations**: Require admin role verification
5. **Activity Logs**: Read-only for regular users

### Data Privacy

- **Soft Deletes**: Users marked with `deleted_at` are excluded from queries
- **Email Verification**: Unverified users have limited access
- **Account Locking**: Automatic after failed login attempts
- **Password History**: Prevents password reuse

## Performance Optimization

### Indexes

All foreign keys have corresponding indexes:
- User lookups: `users.email`, `users.id`
- Role queries: `user_roles(user_id, role_type)`
- Mentorship: `mentorship_relationships(mentor_user_id, mentee_user_id, status)`
- Events: `events(start_time, event_type)`
- Activity: `activity_logs(user_id, entity_type, entity_id)`

### JSONB Usage

JSONB columns for flexible data:
- `expertise_areas` - Array of strings
- `features_access` - Dynamic feature flags
- `location_details` - Variable event location data
- `agenda`, `speakers`, `materials` - Event metadata

## Database Maintenance

### Regular Tasks

```bash
# Create snapshot before major changes
pnpm db:snapshot "before-feature-xyz"

# Safe migration with automatic backup
pnpm db:migrate:safe

# Check database version
pnpm db:version
```

### Backup Strategy

1. Automatic snapshots before migrations
2. Manual snapshots before major deployments
3. Neon automatic backups (platform feature)
4. Migration history tracked in `lib/db/migrations/meta/_journal.json`

## Legacy Fields

The following fields are deprecated but kept for backward compatibility:

### In `user_memberships`
- `stripe_subscription_id` - Legacy Stripe integration
- `stripe_customer_id` - Legacy Stripe integration

### In `teams`
- `stripe_customer_id` - Legacy Stripe integration
- `stripe_subscription_id` - Legacy Stripe integration
- `stripe_product_id` - Legacy Stripe integration
- `plan_name` - Legacy subscription plan
- `subscription_status` - Legacy subscription status

### In `activity_logs`
- `team_id` - Replaced by `entity_type` + `entity_id` pattern

> **Note**: These fields should not be used in new code. They will be removed in a future major version.

## Related Documentation

- [Database Version Control Guide](DATABASE_VERSION_CONTROL.md)
- [Migration Quick Start](MIGRATION_QUICK_START.md)
- [Schema Changes Guide](../CLAUDE.md#adding-a-database-table)
