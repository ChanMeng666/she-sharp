import Stripe from 'stripe';

// Determine Stripe mode: "test" or "live" (defaults to "live")
export const STRIPE_MODE = (process.env.STRIPE_MODE || 'live') as 'test' | 'live';
const isTestMode = STRIPE_MODE === 'test';

// Resolve env var by mode: try mode-specific key first, fall back to generic key
function getStripeEnv(name: string): string {
  const prefix = isTestMode ? 'STRIPE_TEST_' : 'STRIPE_LIVE_';
  const specificKey = name.replace('STRIPE_', prefix);
  return process.env[specificKey] || process.env[name] || '';
}

// Stripe client - initialized lazily to avoid build errors
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = getStripeEnv('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error(
        `STRIPE_SECRET_KEY is not set (mode: ${STRIPE_MODE}). ` +
        `Set STRIPE_${isTestMode ? 'TEST' : 'LIVE'}_SECRET_KEY or STRIPE_SECRET_KEY.`
      );
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeClient;
}

// For backward compatibility
export const stripe = {
  get checkout() { return getStripeClient().checkout; },
  get customers() { return getStripeClient().customers; },
  get subscriptions() { return getStripeClient().subscriptions; },
  get billingPortal() { return getStripeClient().billingPortal; },
  get webhooks() { return getStripeClient().webhooks; },
};

// Membership pricing configuration
export const MEMBERSHIP_PRICES = {
  annual: {
    priceId: getStripeEnv('STRIPE_ANNUAL_PRICE_ID'),
    amount: 10000, // $100 NZD in cents
    currency: 'nzd',
    interval: 'year' as const,
    name: 'Annual Membership',
    description: 'She Sharp Annual Mentorship Programme Membership',
  },
} as const;

export const STRIPE_WEBHOOK_SECRET = getStripeEnv('STRIPE_WEBHOOK_SECRET');

export type MembershipPriceKey = keyof typeof MEMBERSHIP_PRICES;
