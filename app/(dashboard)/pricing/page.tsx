import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  // Use fallback values when Stripe is not configured
  const basePlan = products.find((product) => product.name === 'Base') || { id: 'base', name: 'Base' };
  const plusPlan = products.find((product) => product.name === 'Plus') || { id: 'plus', name: 'Plus' };

  const basePrice = prices.find((price) => price.productId === basePlan?.id) || { 
    id: 'base-price', 
    productId: 'base', 
    unitAmount: 800, 
    currency: 'usd', 
    interval: 'month' as const,
    trialPeriodDays: 7 
  };
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id) || { 
    id: 'plus-price', 
    productId: 'plus', 
    unitAmount: 1200, 
    currency: 'usd', 
    interval: 'month' as const,
    trialPeriodDays: 7 
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Unlimited Usage',
            'Unlimited Workspace Members',
            'Email Support',
          ]}
          priceId={basePrice?.id || 'base-price'}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Base, and:',
            'Early Access to New Features',
            '24/7 Support + Slack Access',
          ]}
          priceId={plusPrice?.id || 'plus-price'}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6 p-8 bg-white rounded-2xl border border-purple-light/30 shadow-sm hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-medium text-navy-dark mb-2">{name}</h2>
      <p className="text-sm text-gray mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-navy-dark mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-purple-dark mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-navy-dark">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
