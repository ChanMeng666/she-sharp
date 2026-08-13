/**
 * Memberships, subscription purchases and one-off donations.
 */
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  boolean,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { membershipTierEnum, subscriptionStatusEnum } from './enums';
import { users } from './users';

// User memberships
export const userMemberships = pgTable('user_memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  tier: membershipTierEnum('tier').notNull().default('free'),
  expiresAt: timestamp('expires_at'),
  featuresAccess: jsonb('features_access').$type<Record<string, boolean>>(),

  // Billing
  lastPaymentAt: timestamp('last_payment_at'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),

  // Stripe integration fields
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  currentPurchaseId: integer('current_purchase_id'), // FK added after membershipPurchases table

  // New membership benefits
  eventPriorityAccess: boolean('event_priority_access').default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('memberships_user_id_idx').on(table.userId),
  tierIdx: index('memberships_tier_idx').on(table.tier),
}));

// Membership purchases (Stripe integration)
export const membershipPurchases = pgTable('membership_purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NZD').notNull(),
  membershipTier: membershipTierEnum('membership_tier').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull(),
  autoRenew: boolean('auto_renew').default(true),
  canceledAt: timestamp('canceled_at'),
  cancelReason: text('cancel_reason'),
  invoiceUrl: varchar('invoice_url', { length: 500 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('membership_purchases_user_id_idx').on(table.userId),
  stripeSubIdx: index('membership_purchases_stripe_sub_idx').on(table.stripeSubscriptionId),
  statusIdx: index('membership_purchases_status_idx').on(table.subscriptionStatus),
  periodEndIdx: index('membership_purchases_period_end_idx').on(table.periodEnd),
}));

// One-time donations (independent of membership subscriptions)
export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull().unique(), // Idempotency key for webhook delivery
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  donorEmail: varchar('donor_email', { length: 255 }),
  donorName: varchar('donor_name', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NZD').notNull(),
  status: varchar('status', { length: 50 }).default('completed').notNull(),
  receiptSent: boolean('receipt_sent').default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  donorEmailIdx: index('donations_donor_email_idx').on(table.donorEmail),
  createdAtIdx: index('donations_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const userMembershipsRelations = relations(userMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userMemberships.userId],
    references: [users.id],
  }),
}));

export const membershipPurchasesRelations = relations(membershipPurchases, ({ one }) => ({
  user: one(users, {
    fields: [membershipPurchases.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UserMembership = typeof userMemberships.$inferSelect;
export type NewUserMembership = typeof userMemberships.$inferInsert;
export type MembershipPurchase = typeof membershipPurchases.$inferSelect;
export type NewMembershipPurchase = typeof membershipPurchases.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
