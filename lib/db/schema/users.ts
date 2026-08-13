/**
 * User system and authentication.
 *
 * Every other domain module points here, so this file must not import from any
 * of them. `usersRelations` — which fans out to all of them — therefore lives in
 * ./relations rather than beside the table it describes.
 */
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { genderEnum, userRoleEnum } from './enums';

// Core user table (simplified - no role field)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  // New fields for business logic update
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 50 }),
  age: integer('age'),
  registeredViaInviteCode: integer('registered_via_invite_code'), // FK added after invitationCodes table
  inviteCodeVerifiedAt: timestamp('invite_code_verified_at'), // For OAuth users who verified invitation code post-signup
  isTestUser: boolean('is_test_user').notNull().default(false),
});

// User roles activation table
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleType: userRoleEnum('role_type').notNull(),
  activatedAt: timestamp('activated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  activationStep: integer('activation_step').default(0),
  verifiedAt: timestamp('verified_at'), // For mentor verification
}, (table) => ({
  userRoleUnique: unique().on(table.userId, table.roleType),
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  roleTypeIdx: index('user_roles_role_type_idx').on(table.roleType),
}));

// Admin permissions
export const adminPermissions = pgTable('admin_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  canViewAllData: boolean('can_view_all_data').default(true),
  canEditUsers: boolean('can_edit_users').default(true),
  canManageRelationships: boolean('can_manage_relationships').default(true),
  canAccessAnalytics: boolean('can_access_analytics').default(true),
  canManageContent: boolean('can_manage_content').default(true),
  canVerifyMentors: boolean('can_verify_mentors').default(true),
  canManageEvents: boolean('can_manage_events').default(true),
  grantedBy: integer('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('admin_permissions_user_id_idx').on(table.userId),
}));

// Keep existing auth-related tables
export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  verifiedAt: timestamp('verified_at'),
});

export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  usedAt: timestamp('used_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

export const passwordHistory = pgTable('password_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// OAuth tables (keeping for potential OAuth integration)
export const accounts = pgTable(
  "account",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const adminPermissionsRelations = relations(adminPermissions, ({ one }) => ({
  user: one(users, {
    fields: [adminPermissions.userId],
    references: [users.id],
  }),
  grantedBy: one(users, {
    fields: [adminPermissions.grantedBy],
    references: [users.id],
    relationName: 'granter',
  }),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const passwordHistoryRelations = relations(passwordHistory, ({ one }) => ({
  user: one(users, {
    fields: [passwordHistory.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type AdminPermission = typeof adminPermissions.$inferSelect;
export type NewAdminPermission = typeof adminPermissions.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type NewPasswordHistory = typeof passwordHistory.$inferInsert;
