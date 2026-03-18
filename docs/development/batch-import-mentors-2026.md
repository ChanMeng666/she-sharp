# Batch Import Pre-Approved Mentors (2026 First Program)

## Overview

On 2026-03-19, 25 mentors confirmed offline for the 2026 first mentorship program were batch-imported into the system. This document describes the operation, the script used, and related code changes.

## What Was Done

### 1. Batch Import Script (`scripts/batch-import-mentors.ts`)

A one-time script was created to import mentor data from a CSV file into the production database.

**CSV source**: `Mentors 2026 first program - Mentors.csv` (project root)

**Usage**:
```bash
# Dry run (no DB writes, no emails)
npx tsx scripts/batch-import-mentors.ts <adminUserId> --dry-run

# Execute
npx tsx scripts/batch-import-mentors.ts <adminUserId>
```

**What the script does per CSV row**:
1. Parses CSV fields and maps them to `mentor_form_submissions` columns
2. Checks for duplicate emails in `mentor_form_submissions` (skips if already approved/submitted, updates if rejected)
3. Inserts a form submission record with `status: 'approved'`
4. Logs activity in `activity_logs` (action: `REVIEW_APPLICATION`)
5. Generates an invitation code (`SHP-XXXX-XXXX-XXXX` format, 7-day expiry) in `invitation_codes`
6. Logs code generation activity (action: `GENERATE_INVITATION_CODE`)
7. Sends invitation email via Resend using `sendInvitationCodeEmail()`
8. Waits 500ms between emails to respect Resend rate limits

**Dependencies added**: `csv-parse` (dev dependency) for robust CSV parsing with quoted fields containing commas.

### 2. Relaxed Mentor Profile Editing Validation

**File modified**: `app/(dashboard)/dashboard/mentor-profile/page.tsx`

Removed two frontend validation checks in the `handleSave` function (previously at lines 228-235):
- Removed: `jobTitle` and `yearsExperience` required check
- Removed: At least one expert skill required check

**Reason**: Batch-imported mentors may have incomplete data (e.g., no `yearsExperience` in CSV). They need to save partial profile updates without being blocked. The backend API (`/api/user/mentor-profile`) already handles null/empty values gracefully.

## CSV Field Mapping

| CSV Column | DB Column | Notes |
|---|---|---|
| Full Name | `fullName` | Required |
| Email Address | `email` | Required |
| Phone Number | `phone` | Some empty → null |
| Gender | `gender` | "Female"→"female", "Male"→"male" |
| Job Title | `jobTitle` | Some empty → null |
| Organisation | `company` | Some empty → null |
| LinkedIn URL | `linkedinUrl` | Some empty → null |
| Long Term Goal | `expectedMenteeGoalsLongTerm` | Some empty → null |
| First Short Term Goal | `expectedMenteeGoalsShortTerm` | Some empty → null |
| Outcome | `programExpectations` | Some empty → null |
| Industry Preferences | `preferredIndustries` | Comma-separated → string array |
| Mentee Type | `preferredMenteeTypes` | Comma-separated → string array |
| Personality Type | `mbtiType` | MBTI enum value |
| First Basic Soft Skill | `softSkillsBasic[0]` | Free-text, stored as-is |
| First Basic Industry Skill | `industrySkillsBasic[0]` | Free-text, stored as-is |
| Second Basic Industry Skill | `industrySkillsBasic[1]` | Free-text, stored as-is |
| First Expert Soft Skill | `softSkillsExpert[0]` | Free-text, stored as-is |
| First Expert Industry Skill | `industrySkillsExpert[0]` | Free-text, stored as-is |
| Second Expert Industry Skill | `industrySkillsExpert[1]` | Free-text, stored as-is |

**Fields not in CSV (defaults used)**:
- `yearsExperience`: null
- `availabilityHoursPerMonth`: 4
- `maxMentees`: 3
- `city`, `preferredMeetingFormat`, `bioMethod`, `bio`, `photoUrl`: null

**Note on skills**: CSV skill values are free-text (e.g., "Communication & Stakeholder Engagement") and do not match the predefined checkbox options in the dashboard. They are stored as-is in the DB. Mentors are expected to re-select from predefined options when editing their profile.

## Execution Results

- **Date**: 2026-03-19
- **Admin User ID**: 1
- **Total processed**: 25/25
- **Skipped**: 0
- **Failed**: 0
- **Invitation code expiry**: 2026-03-26 (7 days from execution)
- **Form submission IDs**: 1–25
- **All 25 emails sent successfully** via Resend

## Database Tables Affected

| Table | Records Added |
|---|---|
| `mentor_form_submissions` | 25 (status: approved) |
| `invitation_codes` | 25 (code_type: mentor_approved, target_role: mentor) |
| `activity_logs` | 50 (25 REVIEW_APPLICATION + 25 GENERATE_INVITATION_CODE) |

## Expected Mentor Registration Flow

1. Mentor receives email with invitation code and sign-up link
2. Mentor clicks link → `/sign-up?code=SHP-XXXX-XXXX-XXXX`
3. Registration creates user account, assigns mentor role, creates mentor profile from form submission data
4. Mentor logs in → `/dashboard/mentor-profile` to review and update their data

## Re-running the Script

The script is idempotent for the same CSV:
- If a mentor's email already exists with status `approved` or `submitted`, the row is skipped
- If status is `rejected`, the record is updated and re-approved
- New invitation codes and emails are only generated for newly processed rows

To re-import (e.g., if codes expire and mentors haven't registered), you would need to either:
1. Manually update expired codes in the `invitation_codes` table, or
2. Delete the existing approved records and re-run the script

## Files Changed

| File | Change |
|---|---|
| `scripts/batch-import-mentors.ts` | **New** — batch import script |
| `app/(dashboard)/dashboard/mentor-profile/page.tsx` | **Modified** — removed frontend validation |
| `package.json` | **Modified** — added `csv-parse` dev dependency |
