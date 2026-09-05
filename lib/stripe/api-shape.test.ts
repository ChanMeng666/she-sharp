/**
 * Offline checks for the two Stripe payload readers.
 *
 * Run: npx tsx lib/stripe/api-shape.test.ts
 *
 * Every assertion here is a real defect that shipped. Both values were read
 * through `as unknown as` casts at the location Stripe used to keep them; the
 * casts satisfied `tsc`, the reads returned undefined, and nothing failed loudly.
 * The `OLD SHAPE` cases are the important ones — they feed in a payload built the
 * way the old code expected and assert we get null, so a revert to the previous
 * property path fails here instead of in production.
 */
import assert from 'node:assert';
import { readSubscriptionPeriod, readInvoiceSubscriptionId } from './api-shape';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const START = 1_780_000_000;
const END = 1_811_536_000;

// --- readSubscriptionPeriod -------------------------------------------------

check('reads the period from the first subscription item', () => {
  const sub = {
    id: 'sub_1',
    items: { data: [{ current_period_start: START, current_period_end: END }] },
  } as unknown as Parameters<typeof readSubscriptionPeriod>[0];
  const period = readSubscriptionPeriod(sub);
  assert.ok(period, 'expected a period');
  assert.strictEqual(period.start.getTime(), START * 1000);
  assert.strictEqual(period.end.getTime(), END * 1000);
});

check('OLD SHAPE: period on the subscription itself yields null, not a date', () => {
  // This is exactly what the pre-fix code assumed existed.
  const sub = {
    id: 'sub_1',
    current_period_start: START,
    current_period_end: END,
    items: { data: [{}] },
  } as unknown as Parameters<typeof readSubscriptionPeriod>[0];
  assert.strictEqual(
    readSubscriptionPeriod(sub),
    null,
    'reading the pre-2025-11-17 location must not appear to succeed'
  );
});

check('no items yields null rather than a fabricated year', () => {
  const sub = { id: 'sub_1', items: { data: [] } } as unknown as Parameters<
    typeof readSubscriptionPeriod
  >[0];
  assert.strictEqual(readSubscriptionPeriod(sub), null);
});

// --- readInvoiceSubscriptionId ----------------------------------------------

check('reads a bare subscription id from invoice.parent', () => {
  const invoice = {
    id: 'in_1',
    parent: { subscription_details: { subscription: 'sub_42' } },
  } as unknown as Parameters<typeof readInvoiceSubscriptionId>[0];
  assert.strictEqual(readInvoiceSubscriptionId(invoice), 'sub_42');
});

check('reads an expanded subscription object from invoice.parent', () => {
  const invoice = {
    id: 'in_1',
    parent: { subscription_details: { subscription: { id: 'sub_42' } } },
  } as unknown as Parameters<typeof readInvoiceSubscriptionId>[0];
  assert.strictEqual(readInvoiceSubscriptionId(invoice), 'sub_42');
});

check('OLD SHAPE: invoice.subscription yields null, not a silent no-op renewal', () => {
  // The pre-fix code read this and returned early on undefined, so every renewal
  // silently failed to extend the membership while the webhook answered 200.
  const invoice = { id: 'in_1', subscription: 'sub_42' } as unknown as Parameters<
    typeof readInvoiceSubscriptionId
  >[0];
  assert.strictEqual(
    readInvoiceSubscriptionId(invoice),
    null,
    'reading the pre-2025-11-17 location must not appear to succeed'
  );
});

check('a one-off invoice with no subscription yields null', () => {
  const invoice = {
    id: 'in_1',
    parent: { subscription_details: null },
  } as unknown as Parameters<typeof readInvoiceSubscriptionId>[0];
  assert.strictEqual(readInvoiceSubscriptionId(invoice), null);
});

console.log(`\n${passed} checks passed.`);
