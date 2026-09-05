import type Stripe from 'stripe';

/**
 * Where Stripe keeps two values that used to live somewhere else.
 *
 * These are pure readers, deliberately in their own module with no database,
 * email or Slack imports, so `api-shape.test.ts` can exercise them offline.
 *
 * Both were previously read through `as unknown as` casts in
 * `lib/stripe/service.ts`. The casts silenced `tsc`, the properties had moved,
 * and the reads returned `undefined` — so a renewal handler became dead code and
 * every membership period was fabricated, both while the webhook answered 200.
 * Reading through the SDK's own types is the whole point: when Stripe moves
 * these again the build fails instead of the data going quietly wrong.
 */

/**
 * Reads a subscription's current billing period.
 *
 * `current_period_start` / `current_period_end` moved off `Subscription` and
 * onto each `SubscriptionItem` (SDK 20, apiVersion 2025-11-17.clover).
 *
 * Returns null rather than inventing dates — a fabricated period is worse than a
 * missing one, because it looks like a real billing record.
 */
export function readSubscriptionPeriod(
  subscription: Stripe.Subscription
): { start: Date; end: Date } | null {
  const item = subscription.items?.data?.[0];
  if (!item?.current_period_start || !item?.current_period_end) return null;
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}

/**
 * Reads the subscription id an invoice was generated for.
 *
 * `invoice.subscription` no longer exists; it is now
 * `invoice.parent.subscription_details.subscription`, which may be a bare id or
 * an expanded object.
 */
export function readInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}
