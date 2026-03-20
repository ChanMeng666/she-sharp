# Mentor & Mentee Data Source Guide

> **Purpose**: This document explains the dual-table data architecture for mentor and mentee roles, ensuring correct data reads and writes across the system.

## Core Problem: Dual-Table Architecture

Mentor and mentee data is split across **two parallel table pairs**:

| Role | Profile Table | Form Submission Table | User Table |
|------|--------------|----------------------|------------|
| Mentor | `mentor_profiles` | `mentor_form_submissions` | `users` |
| Mentee | `mentee_profiles` | `mentee_form_submissions` | `users` |

**The form submission table is the primary data source** for most fields. Profile tables contain a subset of fields, often populated from form data during admin approval. The `users` table holds basic identity (name, email, image).

**There is no automatic sync** between form submissions and profiles. When a field exists in both tables, the form version is typically more complete and up-to-date.

---

## Data Flow Lifecycle

```
User submits form → mentor/mentee_form_submissions (status: submitted)
       ↓
Admin reviews → form status: approved/rejected
       ↓ (if approved)
System creates → mentor/mentee_profiles (subset of form fields copied)
              → user_roles (role activated)
       ↓
User edits profile → BOTH tables updated in parallel
```

**Key files**:
- Form submission: `lib/forms/service.ts` → `submitMentorForm()` / `submitMenteeForm()`
- Admin approval: `lib/forms/service.ts` → `reviewMentorForm()` / `reviewMenteeForm()`
- Profile update: `app/api/user/mentor-profile/route.ts` / `app/api/user/mentee-profile/route.ts`

---

## Mandatory Fallback Chain

When reading any mentor/mentee field that exists in multiple tables, **always** apply this priority:

```
form_submissions.field  →  profiles.field  →  users.field  →  null/default
```

### Correct Pattern (used in `lib/matching/service.ts`):

```typescript
// Photo
image: r.mentorForm?.photoUrl || r.mentorProfile?.photoUrl || r.mentorImage || null

// Name
name: r.mentorForm?.fullName || r.mentorName || 'Unknown'

// MBTI
mbtiType: form.mbtiType || profile.mbtiType || null

// Company, JobTitle, YearsExperience, Bio, LinkedinUrl — same pattern
company: form.company || profile.company || null
```

### Incorrect Pattern (will show null for most users):

```typescript
// WRONG: users.image is null for form-imported users
image: users.image  // ❌ Almost always null

// WRONG: profile may not have the field populated
company: mentorProfiles.company  // ❌ May be null even when form has data
```

---

## Table Schema Reference

### `mentor_profiles` — 15 fields

Subset of form data, created during admin approval. **Operational state fields** (capacity, verification) live here exclusively.

| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `userId` | int FK (unique) | → `users.id` |
| `expertiseAreas` | jsonb string[] | Populated from form, **NOT used in matching** |
| `yearsExperience` | int | |
| `company` | varchar(200) | |
| `jobTitle` | varchar(200) | |
| `bio` | text | |
| `linkedinUrl` | varchar(500) | |
| `availabilityHoursPerMonth` | int | |
| `maxMentees` | int (default 3) | **Primary source for capacity** |
| `currentMenteesCount` | int (default 0) | **Only in profile** — updated on match approval |
| `isAcceptingMentees` | bool (default true) | **Only in profile** — auto-set false at capacity |
| `profileCompletedAt` | timestamp | |
| `verifiedAt` / `verifiedBy` | timestamp / int FK | **Only in profile** — admin verification |
| `mbtiType` | enum | |
| `photoUrl` | varchar(500) | |
| `formSubmissionId` | int | Links to form submission record |

### `mentor_form_submissions` — 30+ fields

The **comprehensive data source**. Contains all form fields including many that have **no equivalent in the profile table**.

| Field | Type | Also in Profile? | Used in Matching? |
|-------|------|-------------------|-------------------|
| `id` | serial PK | — | — |
| `userId` | int FK (unique, nullable) | — | — |
| `email` | varchar(255) | No | No |
| `status` | enum | No (form-only) | No |
| `fullName` | varchar(200) | No (users.name) | Yes (display) |
| `gender` | enum | **No** | No |
| `phone` | varchar(50) | **No** | No |
| `jobTitle` | varchar(200) | Yes | No |
| `company` | varchar(200) | Yes | No |
| `photoUrl` | varchar(500) | Yes | Yes (display) |
| `city` | varchar(100) | **No** | **Yes** |
| `preferredMeetingFormat` | enum | **No** | **Yes** |
| `bio` | text | Yes | No |
| `softSkillsBasic` | jsonb string[] | **No** | No |
| `softSkillsExpert` | jsonb string[] | **No** | **Yes** |
| `industrySkillsBasic` | jsonb string[] | **No** | No |
| `industrySkillsExpert` | jsonb string[] | **No** | **Yes** |
| `expectedMenteeGoalsLongTerm` | text | **No** | **Yes** |
| `expectedMenteeGoalsShortTerm` | text | **No** | **Yes** |
| `programExpectations` | text | **No** | No |
| `preferredMenteeTypes` | jsonb string[] | **No** | **Yes** |
| `preferredIndustries` | jsonb string[] | **No** | **Yes** |
| `mbtiType` | enum | Yes | **Yes** |
| `yearsExperience` | int | Yes | Yes |
| `linkedinUrl` | varchar(500) | Yes | No |
| `availabilityHoursPerMonth` | int | Yes | No |
| `maxMentees` | int (default 3) | Yes | Yes (fallback) |
| `reviewedAt` / `reviewedBy` / `reviewNotes` | — | No | No |
| `submittedAt` / `lastSavedAt` | timestamp | No | No |

### `mentee_profiles` — 11 fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `userId` | int FK (unique) | → `users.id` |
| `learningGoals` | jsonb string[] | **Only in profile** |
| `careerStage` | varchar(100) | Form uses enum `currentStage` |
| `preferredExpertiseAreas` | jsonb string[] | **Only in profile** |
| `preferredMeetingFrequency` | varchar(50) | |
| `bio` | text | |
| `currentChallenge` | text | **Only in profile** |
| `profileCompletedAt` | timestamp | |
| `mbtiType` | enum | |
| `photoUrl` | varchar(500) | |
| `formSubmissionId` | int | Links to form submission record |

### `mentee_form_submissions` — 30+ fields

| Field | Type | Also in Profile? | Used in Matching? |
|-------|------|-------------------|-------------------|
| `id` | serial PK | — | — |
| `userId` | int FK (unique, nullable) | — | — |
| `email` | varchar(255) | No | No |
| `status` | enum | No (form-only) | No |
| `fullName` | varchar(200) | No (users.name) | Yes (display) |
| `gender` | enum | **No** | No |
| `age` | int | **No** | No |
| `phone` | varchar(50) | **No** | No |
| `currentStage` | enum | Yes (`careerStage`) | **Yes** |
| `photoUrl` | varchar(500) | Yes | Yes (display) |
| `bio` | text | Yes | No |
| `city` | varchar(100) | **No** | **Yes** |
| `preferredMeetingFormat` | enum | **No** | **Yes** |
| `currentJobTitle` | varchar(200) | **No** | No |
| `currentIndustry` | varchar(200) | **No** | No |
| `preferredIndustries` | jsonb string[] | **No** | **Yes** |
| `softSkillsBasic` | jsonb string[] | **No** | **Yes** |
| `industrySkillsBasic` | jsonb string[] | **No** | **Yes** |
| `softSkillsExpert` | jsonb string[] | **No** | **Yes** |
| `industrySkillsExpert` | jsonb string[] | **No** | **Yes** |
| `longTermGoals` | text | **No** | **Yes** |
| `shortTermGoals` | text | **No** | **Yes** |
| `whyMentor` | text | **No** | **Yes** |
| `programExpectations` | text | **No** | No |
| `mbtiType` | enum | Yes | **Yes** |
| `preferredMeetingFrequency` | varchar(50) | Yes | No |
| `programmeId` | int FK | **No** | No |
| `paymentCompleted` | bool | **No** | No |
| `reviewedAt` / `reviewedBy` / `reviewNotes` | — | No | No |
| `submittedAt` / `lastSavedAt` | timestamp | No | No |

---

## Fields That Only Exist in One Table

### Form-Only Fields (no profile equivalent)

These fields **must** be read from `*_form_submissions`:

**Mentor:**
- `gender`, `phone`, `city`, `preferredMeetingFormat`
- `softSkillsBasic`, `softSkillsExpert`, `industrySkillsBasic`, `industrySkillsExpert`
- `expectedMenteeGoalsLongTerm`, `expectedMenteeGoalsShortTerm`
- `preferredMenteeTypes`, `preferredIndustries`, `programExpectations`

**Mentee:**
- `gender`, `age`, `phone`, `city`, `preferredMeetingFormat`
- `currentJobTitle`, `currentIndustry`, `preferredIndustries`
- `softSkillsBasic`, `softSkillsExpert`, `industrySkillsBasic`, `industrySkillsExpert`
- `longTermGoals`, `shortTermGoals`, `whyMentor`, `programExpectations`
- `paymentCompleted`, `programmeId`

### Profile-Only Fields (no form equivalent)

These fields **must** be read from `*_profiles`:

**Mentor:**
- `currentMenteesCount`, `isAcceptingMentees` (operational state)
- `verifiedAt`, `verifiedBy` (admin verification)
- `expertiseAreas` (populated from form skills during approval, but NOT used in matching)

**Mentee:**
- `learningGoals`, `preferredExpertiseAreas` (set during profile edit)
- `currentChallenge`

---

## Query Patterns by Use Case

### 1. Display user in any list (admin, matching, dashboard)

**Always join all three tables:**

```typescript
const result = await db
  .select({
    userId: profiles.userId,
    name: users.name,
    email: users.email,
    image: users.image,
    profilePhotoUrl: profiles.photoUrl,
    formPhotoUrl: formSubmissions.photoUrl,
    // ... other fields from both tables
  })
  .from(profiles)
  .innerJoin(users, eq(profiles.userId, users.id))
  .leftJoin(formSubmissions, eq(profiles.userId, formSubmissions.userId));

// Then apply fallback:
return {
  image: r.formPhotoUrl || r.profilePhotoUrl || r.image || null,
  company: r.formCompany || r.profileCompany || null,
  // ...
};
```

### 2. AI Matching (reads are form-heavy)

The matching system in `lib/matching/service.ts` reads almost exclusively from form submissions for the AI prompt. Key functions:

- `getAvailableMentors()` — joins profiles + forms, uses form for skills/goals/preferences
- `getMenteeProfile()` — same pattern for mentee side
- `getMentorMatchInput()` / `getMenteeMatchInput()` — builds AI prompt from form data

**Critical**: `mentorProfiles.expertiseAreas` is NOT used in matching. Only `mentorFormSubmissions.softSkillsExpert` and `industrySkillsExpert` are used.

### 3. Capacity checks (profile-only)

```typescript
// Correct: capacity lives in mentor_profiles
const capacity = mentorProfiles.maxMentees - mentorProfiles.currentMenteesCount;
const accepting = mentorProfiles.isAcceptingMentees;
```

### 4. Form review workflow (form-only)

```typescript
// Admin reviews form submissions, not profiles
const pending = await db.select()
  .from(mentorFormSubmissions)
  .where(eq(mentorFormSubmissions.status, 'submitted'));
```

---

## Write Operations Reference

### Creating/Updating Mentor Data

| Action | Tables Written | File |
|--------|---------------|------|
| Submit mentor form | `mentor_form_submissions` | `lib/forms/service.ts` → `submitMentorForm()` |
| Public form submit | `mentor_form_submissions` (no userId) | `lib/forms/service.ts` → `submitPublicMentorForm()` |
| Admin approves form | `mentor_form_submissions` + `mentor_profiles` + `user_roles` | `lib/forms/service.ts` → `reviewMentorForm()` |
| User edits profile | `mentor_profiles` + `mentor_form_submissions` | `app/api/user/mentor-profile/route.ts` POST |
| Match approved | `mentor_profiles.currentMenteesCount += 1` | `lib/matching/service.ts` → `reviewMatchSuggestion()` |

### Creating/Updating Mentee Data

| Action | Tables Written | File |
|--------|---------------|------|
| Submit mentee form | `mentee_form_submissions` | `lib/forms/service.ts` → `submitMenteeForm()` |
| Public form submit | `mentee_form_submissions` (no userId) | `lib/forms/service.ts` → `submitPublicMenteeForm()` |
| Admin approves form | `mentee_form_submissions` + `mentee_profiles` + `user_roles` | `lib/forms/service.ts` → `reviewMenteeForm()` |
| User edits profile | `mentee_profiles` + `mentee_form_submissions` | `app/api/user/mentee-profile/route.ts` POST |
| Added to queue | `mentee_waiting_queue` | `lib/matching/queue-service.ts` → `addToWaitingQueue()` |

### Admin Approval Data Flow (reviewMentorForm / reviewMenteeForm)

When admin approves a form, these fields are **copied** from form to profile:

**Mentor**: `bio`, `company`, `jobTitle`, `yearsExperience`, `linkedinUrl`, `maxMentees`, `availabilityHoursPerMonth`, `mbtiType`, `photoUrl`, `expertiseAreas` (from softSkillsExpert + industrySkillsExpert)

**Mentee**: `bio`, `careerStage` (from currentStage), `learningGoals` (empty array), `preferredExpertiseAreas` (empty array), `preferredMeetingFrequency`, `currentChallenge` (empty string), `mbtiType`, `photoUrl`

---

## Common Pitfalls

### 1. Reading only from `users.image`
Most users are imported via form submissions. Their photos are in `*_form_submissions.photoUrl`, not `users.image`. Always use the 3-level fallback.

### 2. Reading skills from `mentor_profiles.expertiseAreas`
The matching system uses `mentorFormSubmissions.softSkillsExpert` and `industrySkillsExpert` — NOT `mentorProfiles.expertiseAreas`. The profile field is a merged copy created during approval and is not used in AI matching.

### 3. Missing LEFT JOIN on form submissions
Form submissions may not exist (user created via admin without form), or profile may not exist (form submitted but not yet approved). Always use LEFT JOIN for both tables.

### 4. Assuming profile fields are populated
After admin approval, only a subset of form fields are copied to the profile. Many important fields (city, skills arrays, goals, preferences) remain **only** in the form submission table.

### 5. Forgetting to update both tables on profile edit
The user profile edit endpoints (`/api/user/mentor-profile` POST, `/api/user/mentee-profile` POST) write to **both** the profile table and the form submission table simultaneously. Any new profile edit feature must follow this pattern.

---

## Quick Reference: Where to Read Each Field

### Mentor Fields

| Field | Read From |
|-------|-----------|
| Name | `users.name` (fallback: `form.fullName`) |
| Email | `users.email` (fallback: `form.email`) |
| Photo | `form.photoUrl` → `profile.photoUrl` → `users.image` |
| Company | `form.company` → `profile.company` |
| Job Title | `form.jobTitle` → `profile.jobTitle` |
| Years Experience | `form.yearsExperience` → `profile.yearsExperience` |
| Bio | `form.bio` → `profile.bio` |
| MBTI | `form.mbtiType` → `profile.mbtiType` |
| LinkedIn | `form.linkedinUrl` → `profile.linkedinUrl` |
| City | `form.city` (form only) |
| Skills (soft/industry) | `form.softSkillsExpert` / `form.industrySkillsExpert` (form only) |
| Preferred Industries | `form.preferredIndustries` (form only) |
| Meeting Format | `form.preferredMeetingFormat` (form only) |
| Max Mentees | `profile.maxMentees` (primary) → `form.maxMentees` (fallback) |
| Current Mentees Count | `profile.currentMenteesCount` (profile only) |
| Is Accepting | `profile.isAcceptingMentees` (profile only) |
| Verified | `profile.verifiedAt` (profile only) |

### Mentee Fields

| Field | Read From |
|-------|-----------|
| Name | `users.name` (fallback: `form.fullName`) |
| Email | `users.email` (fallback: `form.email`) |
| Photo | `form.photoUrl` → `profile.photoUrl` → `users.image` |
| Career Stage | `form.currentStage` → `profile.careerStage` |
| Current Job Title | `form.currentJobTitle` (form only) |
| Current Industry | `form.currentIndustry` (form only) |
| Bio | `form.bio` → `profile.bio` |
| MBTI | `form.mbtiType` → `profile.mbtiType` |
| City | `form.city` (form only) |
| Skills (soft/industry) | `form.*` arrays (form only) |
| Preferred Industries | `form.preferredIndustries` (form only) |
| Goals (long/short term) | `form.longTermGoals` / `form.shortTermGoals` (form only) |
| Why Mentor | `form.whyMentor` (form only) |
| Learning Goals | `profile.learningGoals` (profile only) |
| Current Challenge | `profile.currentChallenge` (profile only) |
| Meeting Frequency | `form.preferredMeetingFrequency` → `profile.preferredMeetingFrequency` |

---

## API Endpoints Verified Using Correct Fallback

All endpoints listed below have been audited and confirmed to use the `form → profile → user` fallback chain:

| Endpoint | File | Status |
|----------|------|--------|
| `GET /api/mentors` | `app/api/mentors/route.ts` | Fixed (was profile-only) |
| `GET /api/mentors/[id]` | `app/api/mentors/[id]/route.ts` | Fixed (base object was users-only) |
| `GET /api/mentees/[id]` | `app/api/mentees/[id]/route.ts` | Fixed (base object was users-only) |
| `GET /api/user/profile-photo` | `app/api/user/profile-photo/route.ts` | Fixed (was missing form) |
| `GET /api/user/mentor-profile` | `app/api/user/mentor-profile/route.ts` | Fixed (photoUrl priority was reversed) |
| `GET /api/user/mentee-profile` | `app/api/user/mentee-profile/route.ts` | Fixed (photoUrl was missing profile fallback) |
| `GET /api/mentorship/relationships` | `app/api/mentorship/relationships/route.ts` | Fixed (was users-only) |
| `GET /api/meetings` | `app/api/meetings/route.ts` | Fixed (was users-only) |
| `GET /api/dashboard/overview` | `app/api/dashboard/overview/route.ts` | Fixed (was profile-only) |
| `GET /api/admin/users` | `app/api/admin/users/route.ts` | Correct |
| `GET /api/admin/mentors/verified` | `app/api/admin/mentors/verified/route.ts` | Correct |
| `GET /api/admin/mentors/applications` | `app/api/admin/mentors/applications/route.ts` | Correct |
| `GET /api/admin/mentees/applications` | `app/api/admin/mentees/applications/route.ts` | Correct |
| `GET /api/admin/mentors/relationships` | `app/api/admin/mentors/relationships/route.ts` | Correct |
| `GET /api/admin/mentors/meetings` | `app/api/admin/mentors/meetings/route.ts` | Fixed (was users-only, no photos) |
| `GET /api/admin/matching` | `app/api/admin/matching/route.ts` | Correct |
| Matching service functions | `lib/matching/service.ts` | Correct |
| Queue service functions | `lib/matching/queue-service.ts` | Correct |
