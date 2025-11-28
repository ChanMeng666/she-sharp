import { stripe, MEMBERSHIP_PRICES, STRIPE_WEBHOOK_SECRET } from './config';
import { db } from '@/lib/db/drizzle';
import {
  membershipPurchases,
  userMemberships,
  users,
  activityLogs,
  type NewMembershipPurchase,
  ActivityType,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createPaymentInvitationCode } from '@/lib/invitations/service';
import { sendPaymentConfirmationEmail } from '@/lib/email/service';
import Stripe from 'stripe';

/**
 * Creates a Stripe checkout session for membership purchase.
 */
export async function createCheckoutSession(params: {
  email: string;
  successUrl: string;
  cancelUrl: string;
  userId?: number;
}): Promise<{ sessionId: string; url: string }> {
  const { email, successUrl, cancelUrl, userId } = params;

  // Check for existing customer
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  let customerId: string | undefined;

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price: MEMBERSHIP_PRICES.annual.priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId?.toString() || '',
      email,
      membershipType: 'annual',
    },
    subscription_data: {
      metadata: {
        userId: userId?.toString() || '',
        email,
      },
    },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Retrieves checkout session details.
 */
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  });
}

/**
 * Handles successful payment - creates purchase record and invitation code.
 */
export async function handleSuccessfulPayment(
  session: Stripe.Checkout.Session
): Promise<{ purchaseId: number; invitationCode: string }> {
  const { customer, subscription, metadata, customer_details } = session;
  const email = metadata?.email || customer_details?.email || '';
  const userId = metadata?.userId ? parseInt(metadata.userId) : null;

  // Get subscription details
  let subResponse;
  if (typeof subscription === 'string') {
    subResponse = await stripe.subscriptions.retrieve(subscription);
  } else if (subscription) {
    subResponse = subscription;
  } else {
    throw new Error('Subscription not found in checkout session');
  }

  if (!subResponse) {
    throw new Error('Subscription not found');
  }

  // Access subscription data with proper type handling
  const sub = subResponse as Stripe.Subscription;

  // Safely extract period timestamps with fallbacks
  const currentPeriodStart = sub.current_period_start || Math.floor(Date.now() / 1000);
  const currentPeriodEnd = sub.current_period_end || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);

  const periodStart = new Date(currentPeriodStart * 1000);
  const periodEnd = new Date(currentPeriodEnd * 1000);
  const amountPaid = session.amount_total ? (session.amount_total / 100).toFixed(2) : '100.00';

  // Create purchase record
  const purchaseData: NewMembershipPurchase = {
    userId: userId,
    stripeCustomerId: typeof customer === 'string' ? customer : customer?.id,
    stripeSubscriptionId: sub.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null,
    stripePriceId: MEMBERSHIP_PRICES.annual.priceId,
    amountPaid,
    currency: 'NZD',
    membershipTier: 'premium',
    periodStart,
    periodEnd,
    subscriptionStatus: 'active',
    autoRenew: true,
    metadata: {
      checkoutSessionId: session.id,
      email,
    },
  };

  const [purchase] = await db.insert(membershipPurchases).values(purchaseData).returning();

  // Generate invitation code
  const invitationCode = await createPaymentInvitationCode(purchase.id, email);

  // Update user membership if user exists
  if (userId) {
    await db
      .update(userMemberships)
      .set({
        tier: 'premium',
        stripeSubscriptionId: sub.id,
        stripeCustomerId: typeof customer === 'string' ? customer : customer?.id,
        currentPurchaseId: purchase.id,
        expiresAt: periodEnd,
        lastPaymentAt: new Date(),
        nextBillingDate: periodEnd,
        eventPriorityAccess: true,
        featuresAccess: {
          maxMentorApplications: true,
          accessBasicResources: true,
          joinFreeEvents: true,
          viewMentorProfiles: true,
          priorityEventAccess: true,
          accessPremiumResources: true,
        },
        updatedAt: new Date(),
      })
      .where(eq(userMemberships.userId, userId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      action: ActivityType.PAYMENT_COMPLETED,
      entityType: 'membership_purchase',
      entityId: purchase.id,
      metadata: {
        amount: amountPaid,
        subscriptionId: sub.id,
      },
    });
  }

  // Send confirmation email with invitation code
  try {
    await sendPaymentConfirmationEmail(email, {
      invitationCode: invitationCode.code,
      membershipTier: 'premium',
      expiresAt: periodEnd,
      amount: amountPaid,
    });
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }

  return {
    purchaseId: purchase.id,
    invitationCode: invitationCode.code,
  };
}

/**
 * Handles subscription cancellation.
 */
export async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const { id, metadata } = subscription;
  const userId = metadata?.userId ? parseInt(metadata.userId) : null;

  // Update purchase record
  await db
    .update(membershipPurchases)
    .set({
      subscriptionStatus: 'canceled',
      canceledAt: new Date(),
      autoRenew: false,
      updatedAt: new Date(),
    })
    .where(eq(membershipPurchases.stripeSubscriptionId, id));

  // Update user membership if user exists
  if (userId) {
    await db
      .update(userMemberships)
      .set({
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userMemberships.userId, userId));

    await db.insert(activityLogs).values({
      userId,
      action: ActivityType.SUBSCRIPTION_CANCELLED,
      entityType: 'subscription',
      entityId: null,
      metadata: {
        subscriptionId: id,
      },
    });
  }
}

/**
 * Handles subscription renewal.
 */
export async function handleSubscriptionRenewed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as { subscription: string | null; customer: string };
  const subscriptionId = invoiceData.subscription;

  if (!subscriptionId) return;

  const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const sub = subResponse as unknown as {
    id: string;
    current_period_end: number;
  };
  const periodEnd = new Date(sub.current_period_end * 1000);

  // Update purchase record
  await db
    .update(membershipPurchases)
    .set({
      periodEnd,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(membershipPurchases.stripeSubscriptionId, subscriptionId));

  // Get user from purchase
  const [purchase] = await db
    .select()
    .from(membershipPurchases)
    .where(eq(membershipPurchases.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (purchase?.userId) {
    await db
      .update(userMemberships)
      .set({
        expiresAt: periodEnd,
        lastPaymentAt: new Date(),
        nextBillingDate: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userMemberships.userId, purchase.userId));
  }
}

/**
 * Cancels a subscription.
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}

/**
 * Gets customer portal URL for subscription management.
 */
export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Verifies Stripe webhook signature.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Gets subscription status for a user.
 */
export async function getUserSubscriptionStatus(userId: number) {
  const [membership] = await db
    .select()
    .from(userMemberships)
    .where(eq(userMemberships.userId, userId))
    .limit(1);

  if (!membership || !membership.stripeSubscriptionId) {
    return { hasSubscription: false, status: null, expiresAt: null };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId);
    return {
      hasSubscription: true,
      status: subscription.status,
      expiresAt: membership.expiresAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    return { hasSubscription: false, status: null, expiresAt: null };
  }
}
