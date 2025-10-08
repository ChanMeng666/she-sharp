'use server';

import { redirect } from 'next/navigation';
// import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  // Temporarily disabled - Stripe not configured
  throw new Error('Stripe checkout is temporarily disabled. Please configure STRIPE_SECRET_KEY environment variable.');
  
  // const priceId = formData.get('priceId') as string;
  // await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  // Temporarily disabled - Stripe not configured
  throw new Error('Stripe customer portal is temporarily disabled. Please configure STRIPE_SECRET_KEY environment variable.');
  
  // const portalSession = await createCustomerPortalSession(team);
  // redirect(portalSession.url);
});
