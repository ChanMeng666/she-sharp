import dotenv from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Set POSTGRES_URL from DATABASE_URL if not set
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

// Create database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addAdminRoles() {
  console.log('🔐 Adding admin roles to specified users...\n');

  const targetEmails = [
    'alyssapausanos1449@gmail.com',
    'moksha.shah.nz@gmail.com',
    'mahsa.mohaghegh@gmail.com'
  ];

  try {
    for (const email of targetEmails) {
      console.log(`\nProcessing user: ${email}`);

      // Get the user ID
      const result = await db.execute(sql`
        SELECT id, name, email FROM users WHERE email = ${email}
      `);

      if (!result || result.length === 0) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      const user = result[0] as any;
      const userId = user.id;
      console.log(`✓ Found user: ${user.name || 'No name'} (ID: ${userId})`);

      // Check if admin role already exists
      const existingRole = await db.execute(sql`
        SELECT id, is_active FROM user_roles
        WHERE user_id = ${userId} AND role_type = 'admin'
      `);

      if (existingRole && existingRole.length > 0) {
        const role = existingRole[0] as any;
        if (role.is_active) {
          console.log(`⚠️  Admin role already exists and is active for ${email}`);
        } else {
          // Activate existing admin role
          await db.execute(sql`
            UPDATE user_roles
            SET is_active = true, activated_at = NOW()
            WHERE user_id = ${userId} AND role_type = 'admin'
          `);
          console.log(`✓ Activated existing admin role for ${email}`);
        }
      } else {
        // Create new admin role
        await db.execute(sql`
          INSERT INTO user_roles (user_id, role_type, is_active, activation_step)
          VALUES (${userId}, 'admin', true, 0)
        `);
        console.log(`✓ Created new admin role for ${email}`);
      }

      // Check and create admin permissions if not exists
      const existingPermissions = await db.execute(sql`
        SELECT id FROM admin_permissions WHERE user_id = ${userId}
      `);

      if (!existingPermissions || existingPermissions.length === 0) {
        await db.execute(sql`
          INSERT INTO admin_permissions (
            user_id,
            can_view_all_data,
            can_edit_users,
            can_manage_relationships,
            can_access_analytics,
            can_manage_content,
            can_verify_mentors,
            can_manage_events,
            granted_at
          ) VALUES (
            ${userId},
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            NOW()
          )
        `);
        console.log(`✓ Created admin permissions for ${email}`);
      } else {
        console.log(`✓ Admin permissions already exist for ${email}`);
      }

      console.log(`✅ Successfully set up admin access for ${email}`);
    }

    console.log('\n🎉 Admin role setup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addAdminRoles();
