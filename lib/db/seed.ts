import { db } from './drizzle';
import { users, userMemberships, userRoles, adminPermissions } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
      },
    ])
    .returning();

  console.log('Initial user created.');

  // Create default free membership
  await db.insert(userMemberships).values({
    userId: user.id,
    tier: 'free',
    featuresAccess: {
      accessBasicResources: true,
      joinFreeEvents: true,
      viewMentorProfiles: true
    }
  });

  // Activate admin role for seed user
  await db.insert(userRoles).values({
    userId: user.id,
    roleType: 'admin',
    isActive: true,
    activationStep: 0
  });

  // Grant admin permissions
  await db.insert(adminPermissions).values({
    userId: user.id,
    canViewAllData: true,
    canEditUsers: true,
    canManageRelationships: true,
    canAccessAnalytics: true,
    canManageContent: true,
    canVerifyMentors: true,
    canManageEvents: true
  });
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
