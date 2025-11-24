import dotenv from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Create database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function verifyAdminRoles() {
  console.log('🔍 Verifying admin roles...\n');

  const targetEmails = [
    'alyssapausanos1449@gmail.com',
    'moksha.shah.nz@gmail.com',
    'mahsa.mohaghegh@gmail.com'
  ];

  try {
    for (const email of targetEmails) {
      console.log(`\nChecking user: ${email}`);

      // Get user with their admin role and permissions
      const result = await db.execute(sql`
        SELECT
          u.id,
          u.name,
          u.email,
          ur.role_type,
          ur.is_active as role_active,
          ur.activated_at,
          ap.can_view_all_data,
          ap.can_edit_users,
          ap.can_manage_relationships,
          ap.can_access_analytics,
          ap.can_manage_content,
          ap.can_verify_mentors,
          ap.can_manage_events
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.role_type = 'admin'
        LEFT JOIN admin_permissions ap ON u.id = ap.user_id
        WHERE u.email = ${email}
      `);

      if (!result || result.length === 0) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      const user = result[0] as any;

      console.log(`✓ User found: ${user.name} (ID: ${user.id})`);

      if (user.role_type === 'admin') {
        console.log(`✓ Admin role: ${user.role_active ? 'Active ✅' : 'Inactive ❌'}`);
        console.log(`✓ Activated at: ${user.activated_at}`);

        if (user.can_view_all_data !== null) {
          console.log('✓ Admin permissions:');
          console.log(`  - View all data: ${user.can_view_all_data ? '✅' : '❌'}`);
          console.log(`  - Edit users: ${user.can_edit_users ? '✅' : '❌'}`);
          console.log(`  - Manage relationships: ${user.can_manage_relationships ? '✅' : '❌'}`);
          console.log(`  - Access analytics: ${user.can_access_analytics ? '✅' : '❌'}`);
          console.log(`  - Manage content: ${user.can_manage_content ? '✅' : '❌'}`);
          console.log(`  - Verify mentors: ${user.can_verify_mentors ? '✅' : '❌'}`);
          console.log(`  - Manage events: ${user.can_manage_events ? '✅' : '❌'}`);
        } else {
          console.log('⚠️  No admin permissions found');
        }
      } else {
        console.log('❌ No admin role found');
      }
    }

    console.log('\n✅ Verification completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

verifyAdminRoles();
