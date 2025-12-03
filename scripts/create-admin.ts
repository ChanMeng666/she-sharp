/**
 * Admin Account Creation Script
 *
 * Creates a new admin user or upgrades an existing user to admin.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password> [name]
 *
 * Examples:
 *   npx tsx scripts/create-admin.ts admin@example.com SecurePass123!
 *   npx tsx scripts/create-admin.ts admin@example.com SecurePass123! "John Doe"
 */

import { db } from '../lib/db/drizzle';
import {
  users,
  userRoles,
  userMemberships,
} from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';
import { eq } from 'drizzle-orm';

async function createAdminUser(email: string, password: string, name?: string) {
  console.log('\n🔐 Admin Account Creation Script\n');
  console.log('═══════════════════════════════════════════\n');

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    console.log(`📋 User ${email} already exists`);

    // Check if already admin
    const [existingRole] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, existingUser.id))
      .limit(1);

    const isAdmin = existingRole?.roleType === 'admin';

    if (isAdmin) {
      console.log(`  ✓ User is already an admin`);
      console.log('\n✅ No changes needed.\n');
      return existingUser;
    }

    // Add admin role
    await db.insert(userRoles).values({
      userId: existingUser.id,
      roleType: 'admin',
      isActive: true,
    }).onConflictDoNothing();

    console.log(`  ✓ Added admin role to existing user`);

    // Upgrade membership to premium if not already
    const [existingMembership] = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, existingUser.id))
      .limit(1);

    if (!existingMembership) {
      await db.insert(userMemberships).values({
        userId: existingUser.id,
        tier: 'premium',
        featuresAccess: {
          maxMentorApplications: true,
          accessBasicResources: true,
          joinFreeEvents: true,
          viewMentorProfiles: true,
          priorityEventAccess: true,
          accessPremiumResources: true,
        },
        eventPriorityAccess: true,
      });
      console.log(`  ✓ Created premium membership`);
    } else if (existingMembership.tier !== 'premium') {
      await db
        .update(userMemberships)
        .set({
          tier: 'premium',
          featuresAccess: {
            maxMentorApplications: true,
            accessBasicResources: true,
            joinFreeEvents: true,
            viewMentorProfiles: true,
            priorityEventAccess: true,
            accessPremiumResources: true,
          },
          eventPriorityAccess: true,
          updatedAt: new Date(),
        })
        .where(eq(userMemberships.userId, existingUser.id));
      console.log(`  ✓ Upgraded membership to premium`);
    }

    console.log('\n✅ User upgraded to admin successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email: ${email}`);
    console.log('═══════════════════════════════════════\n');

    return existingUser;
  }

  // Create new admin user
  console.log(`👤 Creating new admin user...`);

  const hashedPassword = await hashPassword(password);

  const [adminUser] = await db.insert(users).values({
    name: name || 'Admin',
    email,
    passwordHash: hashedPassword,
    emailVerified: new Date(),
    emailVerifiedAt: new Date(),
  }).returning();

  console.log(`  ✓ Created user: ${email}`);

  // Create admin role
  await db.insert(userRoles).values({
    userId: adminUser.id,
    roleType: 'admin',
    isActive: true,
  });

  console.log(`  ✓ Assigned admin role`);

  // Create premium membership
  await db.insert(userMemberships).values({
    userId: adminUser.id,
    tier: 'premium',
    featuresAccess: {
      maxMentorApplications: true,
      accessBasicResources: true,
      joinFreeEvents: true,
      viewMentorProfiles: true,
      priorityEventAccess: true,
      accessPremiumResources: true,
    },
    eventPriorityAccess: true,
  });

  console.log(`  ✓ Created premium membership`);

  console.log('\n✅ Admin user created successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('═══════════════════════════════════════');
  console.log('⚠️  Please change the password after first login!\n');

  return adminUser;
}

function printUsage() {
  console.log('\n📖 Usage:');
  console.log('   npx tsx scripts/create-admin.ts <email> <password> [name]\n');
  console.log('📝 Examples:');
  console.log('   npx tsx scripts/create-admin.ts admin@example.com SecurePass123!');
  console.log('   npx tsx scripts/create-admin.ts admin@example.com SecurePass123! "John Doe"\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\n❌ Error: Missing required arguments');
    printUsage();
    process.exit(1);
  }

  const [email, password, name] = args;

  // Basic validation
  if (!email.includes('@')) {
    console.error('\n❌ Error: Invalid email format');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\n❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    await createAdminUser(email, password, name);
    console.log('🎉 Done! You can now log in as admin.\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
