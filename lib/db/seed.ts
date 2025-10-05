import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, userMemberships, userRoles, adminPermissions } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  if (!stripe) {
    console.log('Stripe integration is disabled, skipping Stripe product creation.');
    return;
  }

  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

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
        // Removed role field - using new role activation system
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

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await createStripeProducts();
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
