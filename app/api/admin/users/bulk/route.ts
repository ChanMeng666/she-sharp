import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, activityLogs, mentorFormSubmissions } from '@/lib/db/schema';
import { eq, inArray, sql, and, isNull } from 'drizzle-orm';

/**
 * POST /api/admin/users/bulk
 * Handle bulk operations on users
 */
export const POST = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canEditUsers']
  },
  async (req: NextRequest, context: any) => {
    try {
      const adminUserId = context.user?.id;
      const body = await req.json();
      const { action, userIds, recordIds } = body;

      if (!action) {
        return NextResponse.json(
          { error: 'Action is required' },
          { status: 400 }
        );
      }

      // Parse record IDs to separate users and applications
      const parsedRecords = (recordIds || []).map((recordId: string) => {
        if (recordId.startsWith('user_')) {
          return { type: 'user', id: parseInt(recordId.replace('user_', '')) };
        } else if (recordId.startsWith('app_mentor_')) {
          return { type: 'application', id: parseInt(recordId.replace('app_mentor_', '')) };
        }
        return null;
      }).filter(Boolean);

      const targetUserIds = userIds || parsedRecords.filter((r: any) => r.type === 'user').map((r: any) => r.id);
      const targetAppIds = parsedRecords.filter((r: any) => r.type === 'application').map((r: any) => r.id);

      if (targetUserIds.length === 0 && targetAppIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid targets specified' },
          { status: 400 }
        );
      }

      let affectedCount = 0;
      let message = '';

      switch (action) {
        case 'suspend': {
          if (targetUserIds.length > 0) {
            // Prevent self-suspension
            const filteredIds = targetUserIds.filter((id: number) => id !== adminUserId);

            if (filteredIds.length > 0) {
              await db
                .update(users)
                .set({
                  deletedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(inArray(users.id, filteredIds));

              affectedCount = filteredIds.length;

              // Log activity
              await db.insert(activityLogs).values({
                userId: adminUserId,
                action: 'bulk_user_suspend',
                entityType: 'user',
                entityId: 0,
                metadata: { targetUserIds: filteredIds, count: affectedCount },
              });
            }
          }
          message = `Suspended ${affectedCount} user(s)`;
          break;
        }

        case 'unsuspend': {
          if (targetUserIds.length > 0) {
            await db
              .update(users)
              .set({
                deletedAt: null,
                updatedAt: new Date(),
              })
              .where(inArray(users.id, targetUserIds));

            affectedCount = targetUserIds.length;

            // Log activity
            await db.insert(activityLogs).values({
              userId: adminUserId,
              action: 'bulk_user_unsuspend',
              entityType: 'user',
              entityId: 0,
              metadata: { targetUserIds, count: affectedCount },
            });
          }
          message = `Unsuspended ${affectedCount} user(s)`;
          break;
        }

        case 'delete': {
          if (targetUserIds.length > 0) {
            // Prevent self-deletion
            const filteredIds = targetUserIds.filter((id: number) => id !== adminUserId);

            if (filteredIds.length > 0) {
              // Soft delete users
              await db
                .update(users)
                .set({
                  deletedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(inArray(users.id, filteredIds));

              // Deactivate all roles for deleted users
              await db
                .update(userRoles)
                .set({ isActive: false })
                .where(inArray(userRoles.userId, filteredIds));

              affectedCount = filteredIds.length;

              // Log activity
              await db.insert(activityLogs).values({
                userId: adminUserId,
                action: 'bulk_user_delete',
                entityType: 'user',
                entityId: 0,
                metadata: { targetUserIds: filteredIds, count: affectedCount },
              });
            }
          }

          // Delete applications (hard delete for unregistered applications)
          if (targetAppIds.length > 0) {
            await db
              .update(mentorFormSubmissions)
              .set({
                status: 'rejected',
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                reviewNotes: 'Bulk deleted by admin',
              })
              .where(
                and(
                  inArray(mentorFormSubmissions.id, targetAppIds),
                  isNull(mentorFormSubmissions.userId)
                )
              );

            affectedCount += targetAppIds.length;
          }

          message = `Deleted ${affectedCount} record(s)`;
          break;
        }

        case 'export': {
          // Fetch user data for export
          let exportData: any[] = [];

          if (targetUserIds.length > 0) {
            const userData = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                createdAt: users.createdAt,
                lastLoginAt: users.lastLoginAt,
              })
              .from(users)
              .where(inArray(users.id, targetUserIds));

            exportData = userData.map(u => ({
              ...u,
              type: 'registered_user',
            }));
          }

          if (targetAppIds.length > 0) {
            const appData = await db
              .select({
                id: mentorFormSubmissions.id,
                name: mentorFormSubmissions.fullName,
                email: mentorFormSubmissions.email,
                phone: mentorFormSubmissions.phone,
                company: mentorFormSubmissions.company,
                jobTitle: mentorFormSubmissions.jobTitle,
                createdAt: mentorFormSubmissions.createdAt,
              })
              .from(mentorFormSubmissions)
              .where(inArray(mentorFormSubmissions.id, targetAppIds));

            exportData = [
              ...exportData,
              ...appData.map(a => ({
                ...a,
                type: 'public_application',
              })),
            ];
          }

          return NextResponse.json({
            success: true,
            action: 'export',
            data: exportData,
            message: `Exported ${exportData.length} record(s)`,
          });
        }

        case 'add_role': {
          const { roleType } = body;
          if (!roleType || !['admin', 'mentor', 'mentee'].includes(roleType)) {
            return NextResponse.json(
              { error: 'Valid roleType is required' },
              { status: 400 }
            );
          }

          if (targetUserIds.length > 0) {
            // Get existing roles
            const existingRoles = await db
              .select({ userId: userRoles.userId })
              .from(userRoles)
              .where(
                and(
                  inArray(userRoles.userId, targetUserIds),
                  eq(userRoles.roleType, roleType)
                )
              );

            const existingUserIds = new Set(existingRoles.map(r => r.userId));
            const newRoleUsers = targetUserIds.filter((id: number) => !existingUserIds.has(id));

            // Add role to users who don't have it
            if (newRoleUsers.length > 0) {
              await db.insert(userRoles).values(
                newRoleUsers.map((userId: number) => ({
                  userId,
                  roleType,
                  isActive: true,
                }))
              );
            }

            // Activate role for users who already have it but inactive
            await db
              .update(userRoles)
              .set({ isActive: true, activatedAt: new Date() })
              .where(
                and(
                  inArray(userRoles.userId, targetUserIds),
                  eq(userRoles.roleType, roleType)
                )
              );

            affectedCount = targetUserIds.length;

            // Log activity
            await db.insert(activityLogs).values({
              userId: adminUserId,
              action: 'bulk_add_role',
              entityType: 'user',
              entityId: 0,
              metadata: { targetUserIds, roleType, count: affectedCount },
            });
          }
          message = `Added ${roleType} role to ${affectedCount} user(s)`;
          break;
        }

        case 'remove_role': {
          const { roleType } = body;
          if (!roleType || !['admin', 'mentor', 'mentee'].includes(roleType)) {
            return NextResponse.json(
              { error: 'Valid roleType is required' },
              { status: 400 }
            );
          }

          if (targetUserIds.length > 0) {
            await db
              .update(userRoles)
              .set({ isActive: false })
              .where(
                and(
                  inArray(userRoles.userId, targetUserIds),
                  eq(userRoles.roleType, roleType)
                )
              );

            affectedCount = targetUserIds.length;

            // Log activity
            await db.insert(activityLogs).values({
              userId: adminUserId,
              action: 'bulk_remove_role',
              entityType: 'user',
              entityId: 0,
              metadata: { targetUserIds, roleType, count: affectedCount },
            });
          }
          message = `Removed ${roleType} role from ${affectedCount} user(s)`;
          break;
        }

        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        action,
        affectedCount,
        message,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      return NextResponse.json(
        { error: 'Failed to perform bulk action' },
        { status: 500 }
      );
    }
  }
);
