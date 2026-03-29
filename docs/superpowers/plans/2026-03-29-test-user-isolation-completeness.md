# Test User Isolation Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete test user isolation across all admin views — show TEST badges + filters in list views, exclude test users from analytics/stats by default.

**Architecture:** Two-pronged approach: (1) Service layer returns `isTestUser` on all user-related records so the UI can badge them and the API can filter them; (2) Analytics SQL queries add `is_test_user = false` to prevent data pollution. Admin list views show test users with badges but provide filtering, matching the existing pattern in UserManagement.

**Tech Stack:** Next.js API routes, Drizzle ORM, React (client components), shadcn/ui Badge

---

## File Structure

| File | Responsibility | Change Type |
|------|---------------|-------------|
| `lib/matching/types.ts` | Add `isTestUser` to `QueueEntryWithDetails` | Modify |
| `lib/matching/queue-service.ts` | Return `isTestUser` from `getWaitingQueue`; filter-aware `getQueueStats` | Modify |
| `lib/matching/service.ts` | Return `isTestUser` from `getUnmatchedMentors` and `getUnmatchedMentees` | Modify |
| `app/(dashboard)/dashboard/admin/matching/page.tsx` | TEST badges + user type filter on queue/unmatched tabs | Modify |
| `app/api/analytics/dashboard/route.ts` | Add `is_test_user = false` to 5 remaining queries | Modify |
| `app/api/admin/tasks/pending/route.ts` | Exclude test users from waiting mentees and pending matches counts | Modify |
| `app/api/admin/mentors/relationships/route.ts` | Return `isTestUser` flags on mentor/mentee in relationships | Modify |
| `app/api/admin/mentors/meetings/route.ts` | Return `isTestUser` flags on mentor/mentee in meetings | Modify |

---

### Task 1: Add `isTestUser` to QueueEntryWithDetails type

**Files:**
- Modify: `lib/matching/types.ts:150-164`

- [ ] **Step 1: Add `isTestUser` field to the type**

In `lib/matching/types.ts`, add `isTestUser: boolean;` to the `QueueEntryWithDetails` interface after `careerStage`:

```typescript
export interface QueueEntryWithDetails {
  id: number;
  menteeUserId: number;
  menteeName: string;
  menteeEmail: string;
  menteeImage: string | null;
  joinedAt: Date;
  status: QueueStatus;
  priority: number;
  bestMatchScore: number | null;
  matchAttempts: number;
  waitDays: number;
  preferredIndustries: string[];
  careerStage: string | null;
  isTestUser: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/matching/types.ts
git commit -m "feat(matching): add isTestUser to QueueEntryWithDetails type"
```

---

### Task 2: Return `isTestUser` from queue service

**Files:**
- Modify: `lib/matching/queue-service.ts:214-272` (`getWaitingQueue`)
- Modify: `lib/matching/queue-service.ts:295-321` (`getQueueStats`)

- [ ] **Step 1: Update `getWaitingQueue` to select and return `isTestUser`**

In the `select` block (line 233-239), add `isTestUser`:

```typescript
    .select({
      queue: menteeWaitingQueue,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      isTestUser: users.isTestUser,
      profilePhotoUrl: menteeProfiles.photoUrl,
      menteeForm: menteeFormSubmissions,
    })
```

In the mapping (line 255-269), add `isTestUser` to the returned object:

```typescript
  const entriesWithDetails: QueueEntryWithDetails[] = entries.map(e => ({
    id: e.queue.id,
    menteeUserId: e.queue.menteeUserId,
    menteeName: e.userName || 'Unknown',
    menteeEmail: e.userEmail,
    menteeImage: e.menteeForm?.photoUrl || e.profilePhotoUrl || e.userImage || null,
    joinedAt: e.queue.joinedAt,
    status: e.queue.status as QueueStatus,
    priority: e.queue.priority || 0,
    bestMatchScore: e.queue.bestMatchScore ? parseFloat(e.queue.bestMatchScore) : null,
    matchAttempts: e.queue.matchAttempts || 0,
    waitDays: Math.floor((now.getTime() - new Date(e.queue.joinedAt).getTime()) / (1000 * 60 * 60 * 24)),
    preferredIndustries: (e.menteeForm?.preferredIndustries as string[]) || [],
    careerStage: e.menteeForm?.currentStage || null,
    isTestUser: e.isTestUser,
  }));
```

- [ ] **Step 2: Update `getQueueStats` to exclude test users**

Join with `users` table and add `is_test_user = false` filter:

```typescript
export async function getQueueStats(programmeId?: number): Promise<{
  totalWaiting: number;
  averageWaitDays: number;
  highPriorityCount: number;
  expiringSoonCount: number;
}> {
  const [stats] = await db
    .select({
      totalWaiting: sql<number>`count(*)::int`,
      avgWaitDays: sql<number>`coalesce(avg(extract(day from (now() - ${menteeWaitingQueue.joinedAt}))), 0)::int`,
      highPriority: sql<number>`count(*) filter (where ${menteeWaitingQueue.priority} >= 70)::int`,
      expiringSoon: sql<number>`count(*) filter (where ${menteeWaitingQueue.expiresAt} < (now() + interval '7 days'))::int`,
    })
    .from(menteeWaitingQueue)
    .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
    .where(
      programmeId
        ? and(
            eq(menteeWaitingQueue.status, 'waiting'),
            eq(menteeWaitingQueue.programmeId, programmeId),
            eq(users.isTestUser, false)
          )
        : and(
            eq(menteeWaitingQueue.status, 'waiting'),
            eq(users.isTestUser, false)
          )
    );

  return {
    totalWaiting: stats?.totalWaiting || 0,
    averageWaitDays: stats?.avgWaitDays || 0,
    highPriorityCount: stats?.highPriority || 0,
    expiringSoonCount: stats?.expiringSoon || 0,
  };
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add lib/matching/queue-service.ts
git commit -m "feat(matching): return isTestUser from queue, exclude test users from queue stats"
```

---

### Task 3: Return `isTestUser` from unmatched mentors/mentees

**Files:**
- Modify: `lib/matching/service.ts:1065-1133` (`getUnmatchedMentors`)
- Modify: `lib/matching/service.ts:1138-1209` (`getUnmatchedMentees`)

- [ ] **Step 1: Add `isTestUser` to `getUnmatchedMentors` return type and select**

Add `isTestUser: boolean;` to the return type. In the select block, add:

```typescript
      isTestUser: users.isTestUser,
```

In the mapping, add:

```typescript
    isTestUser: m.isTestUser,
```

- [ ] **Step 2: Add `isTestUser` to `getUnmatchedMentees` return type and select**

Add `isTestUser: boolean;` to the return type. In the select block, add:

```typescript
      isTestUser: users.isTestUser,
```

In the mapping, add:

```typescript
    isTestUser: m.isTestUser,
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add lib/matching/service.ts
git commit -m "feat(matching): return isTestUser from unmatched mentors/mentees queries"
```

---

### Task 4: Add TEST badges and filtering to matching page

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/matching/page.tsx`

- [ ] **Step 1: Add `isTestUser` to TypeScript interfaces**

Add `isTestUser: boolean;` to `QueueEntry`, `UnmatchedMentor`, and `UnmatchedMentee` interfaces.

- [ ] **Step 2: Add `FlaskConical` icon import**

Add `FlaskConical` to the lucide-react import block.

- [ ] **Step 3: Add TEST badge to queue entries**

After the name line `<p className="font-medium">{entry.menteeName}</p>` (line 1255), add:

```tsx
<p className="font-medium">
  {entry.menteeName}
  {entry.isTestUser && (
    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-400 text-xs">TEST</Badge>
  )}
</p>
```

- [ ] **Step 4: Add TEST badge to unmatched mentors**

After the mentor name line `<p className="font-medium">{mentor.name}</p>` (line 1026), add:

```tsx
<p className="font-medium">
  {mentor.name}
  {mentor.isTestUser && (
    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-400 text-xs">TEST</Badge>
  )}
</p>
```

- [ ] **Step 5: Add TEST badge to unmatched mentees**

After the mentee name line `<p className="font-medium">{mentee.name}</p>` (line 1093), add:

```tsx
<p className="font-medium">
  {mentee.name}
  {mentee.isTestUser && (
    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-400 text-xs">TEST</Badge>
  )}
</p>
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/dashboard/admin/matching/page.tsx"
git commit -m "feat(matching): add TEST badges to queue and unmatched lists in matching page"
```

---

### Task 5: Fix analytics dashboard — exclude test users from remaining queries

**Files:**
- Modify: `app/api/analytics/dashboard/route.ts`

Currently filtered (no change): userStats (line 42), userGrowth (line 106), topMentors (line 121), daily_active_users (line 148), generateUserReport (line 259), generateMentorshipReport (line 276-277).

- [ ] **Step 1: Fix mentorshipStats query (line 46-54)**

Add JOINs to exclude test users from both mentor and mentee sides:

```sql
SELECT
  COUNT(DISTINCT mr.mentor_user_id) as total_mentors,
  COUNT(DISTINCT mr.mentee_user_id) as total_mentees,
  COUNT(CASE WHEN mr.status = 'active' THEN 1 END) as active_relationships,
  COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending_requests,
  COUNT(CASE WHEN mr.created_at >= ${startDate} THEN 1 END) as new_relationships
FROM mentorship_relationships mr
JOIN users mentor ON mr.mentor_user_id = mentor.id AND mentor.is_test_user = false
JOIN users mentee ON mr.mentee_user_id = mentee.id AND mentee.is_test_user = false
```

- [ ] **Step 2: Fix meetingStats query (line 77-85)**

Join through relationships to exclude test user meetings:

```sql
SELECT
  COUNT(*) as total_meetings,
  COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_meetings,
  COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as cancelled_meetings,
  AVG(CASE WHEN m.rating IS NOT NULL THEN m.rating END)::numeric(3,2) as avg_rating
FROM meetings m
JOIN mentorship_relationships mr ON m.relationship_id = mr.id
JOIN users mentor ON mr.mentor_user_id = mentor.id AND mentor.is_test_user = false
JOIN users mentee ON mr.mentee_user_id = mentee.id AND mentee.is_test_user = false
WHERE m.scheduled_at >= ${startDate} AND m.scheduled_at <= ${endDate}
```

- [ ] **Step 3: Fix activityTrends query (line 88-97)**

Exclude test user activity:

```sql
SELECT
  DATE(al.created_at) as date,
  COUNT(*) as count,
  al.action
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.created_at >= NOW() - INTERVAL '30 days'
  AND (u.is_test_user = false OR al.user_id IS NULL)
GROUP BY DATE(al.created_at), al.action
ORDER BY date DESC
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/analytics/dashboard/route.ts
git commit -m "fix(analytics): exclude test users from mentorship, meeting, and activity stats"
```

---

### Task 6: Fix pending tasks count — exclude test users

**Files:**
- Modify: `app/api/admin/tasks/pending/route.ts`

- [ ] **Step 1: Exclude test users from waiting mentees count (line 32-35)**

Join `menteeWaitingQueue` with `users` to filter out test users:

```typescript
      // Get mentees waiting for matching (exclude test users)
      const [{ waitingMentees }] = await db
        .select({ waitingMentees: sql<number>`count(*)` })
        .from(menteeWaitingQueue)
        .innerJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
        .where(and(
          eq(menteeWaitingQueue.status, 'waiting'),
          eq(users.isTestUser, false)
        ));
```

- [ ] **Step 2: Exclude test users from pending matches count (line 38-41)**

Join `aiMatchResults` with `users` (via mentee) to filter out test users:

```typescript
      // Get pending AI match results that need review (exclude test users)
      const [{ pendingMatches }] = await db
        .select({ pendingMatches: sql<number>`count(*)` })
        .from(aiMatchResults)
        .innerJoin(users, eq(aiMatchResults.menteeUserId, users.id))
        .where(and(
          eq(aiMatchResults.status, 'pending_review'),
          eq(users.isTestUser, false)
        ));
```

- [ ] **Step 3: Add `users` to imports**

Add `users` to the imports from `@/lib/db/schema` and add `and` to the drizzle-orm imports.

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/tasks/pending/route.ts
git commit -m "fix(admin): exclude test users from pending tasks counts"
```

---

### Task 7: Add `isTestUser` to relationships admin API

**Files:**
- Modify: `app/api/admin/mentors/relationships/route.ts`

- [ ] **Step 1: Select `isTestUser` for both mentor and mentee**

Add to the select block (after existing mentor/mentee fields):

```typescript
          mentorIsTestUser: mentorUser.isTestUser,
          menteeIsTestUser: menteeUser.isTestUser,
```

- [ ] **Step 2: Include in response mapping**

In the `relationshipsData` mapping, add `isTestUser` to mentor and mentee objects:

```typescript
          mentor: {
            // ... existing fields ...
            isTestUser: rel.mentorIsTestUser,
          },
          mentee: {
            // ... existing fields ...
            isTestUser: rel.menteeIsTestUser,
          },
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/mentors/relationships/route.ts
git commit -m "feat(admin): include isTestUser in relationships API response"
```

---

### Task 8: Add `isTestUser` to meetings admin API

**Files:**
- Modify: `app/api/admin/mentors/meetings/route.ts`

- [ ] **Step 1: Select `isTestUser` for both mentor and mentee users**

Add to the select block:

```typescript
          mentorIsTestUser: mentorUser.isTestUser,
          menteeIsTestUser: menteeUser.isTestUser,
```

- [ ] **Step 2: Include in response mapping**

Add `isTestUser` to the mentor and mentee objects in the meetings response.

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/mentors/meetings/route.ts
git commit -m "feat(admin): include isTestUser in meetings API response"
```

---

## Verification

1. **Build passes**: `pnpm build` succeeds with no errors
2. **Matching page**: Open `/dashboard/admin/matching` — queue entries and unmatched lists show orange TEST badges for test users
3. **Queue stats**: The "In Queue" badge count excludes test users
4. **Analytics**: Open `/dashboard/admin` — all stats (mentorship, meetings, activity) exclude test users
5. **Pending tasks**: The pending tasks widget on admin dashboard excludes test users from "waiting mentees" and "pending matches" counts
6. **Relationships page**: Open `/dashboard/admin/mentors/relationships` — API returns `isTestUser` for mentor/mentee (frontend can use for badges in future)
