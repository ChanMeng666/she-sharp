'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

const STRIPE_ENABLED = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export const checkoutAction = withTeam(async (formData, team) => {
  if (!STRIPE_ENABLED) {
    throw new Error('Stripe integration is not configured');
  }
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  if (!STRIPE_ENABLED) {
    throw new Error('Stripe integration is not configured');
  }
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
