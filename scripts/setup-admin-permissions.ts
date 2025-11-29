/**
 * Setup Admin Permissions Script
 *
 * This script adds all admin permissions for the admin user.
 * Run with: npx tsx scripts/setup-admin-permissions.ts
 */

import { db } from '../lib/db/drizzle';
import { users, userRoles, adminPermissions } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function setupAdminPermissions() {
  const adminEmail = 'admin@shesharp.co.nz';

  console.log('\n🔐 Setting up admin permissions...\n');

  try {
    // Find admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.error(`❌ Admin user (${adminEmail}) not found!`);
      process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);

    // Check if admin role exists, if not create it
    const [existingRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, adminUser.id),
          eq(userRoles.roleType, 'admin')
        )
      )
      .limit(1);

    if (!existingRole) {
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleType: 'admin',
        isActive: true,
      });
      console.log('✓ Created admin role');
    } else if (!existingRole.isActive) {
      await db
        .update(userRoles)
        .set({ isActive: true })
        .where(eq(userRoles.id, existingRole.id));
      console.log('✓ Activated admin role');
    } else {
      console.log('✓ Admin role already exists and is active');
    }

    // Check if admin permissions exist
    const [existingPerms] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, adminUser.id))
      .limit(1);

    if (existingPerms) {
      // Update existing permissions to grant all
      await db
        .update(adminPermissions)
        .set({
          canViewAllData: true,
          canEditUsers: true,
          canManageRelationships: true,
          canAccessAnalytics: true,
          canManageContent: true,
          canVerifyMentors: true,
          canManageEvents: true,
          updatedAt: new Date(),
        })
        .where(eq(adminPermissions.userId, adminUser.id));
      console.log('✓ Updated admin permissions (granted all)');
    } else {
      // Create new permissions with all granted
      await db.insert(adminPermissions).values({
        userId: adminUser.id,
        canViewAllData: true,
        canEditUsers: true,
        canManageRelationships: true,
        canAccessAnalytics: true,
        canManageContent: true,
        canVerifyMentors: true,
        canManageEvents: true,
      });
      console.log('✓ Created admin permissions (granted all)');
    }

    console.log('\n✅ Admin permissions setup complete!');
    console.log('═══════════════════════════════════════');
    console.log('Permissions granted:');
    console.log('  • canViewAllData');
    console.log('  • canEditUsers');
    console.log('  • canManageRelationships');
    console.log('  • canAccessAnalytics');
    console.log('  • canManageContent');
    console.log('  • canVerifyMentors');
    console.log('  • canManageEvents');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupAdminPermissions();
