/**
 * Smoke test: exercise each funding source standalone, print top 3 results.
 * Run: npx tsx scripts/smoke-test-funding-sources.ts
 */

import { beehiveSource } from '@/lib/funding/sources/beehive-rss';
import { treasurySource } from '@/lib/funding/sources/treasury-rss';
import { getsSource } from '@/lib/funding/sources/gets-rss';
import { dataGovtSource } from '@/lib/funding/sources/data-govt-ckan';
import { mbieSource } from '@/lib/funding/sources/mbie-html';
import { womenGovtSource } from '@/lib/funding/sources/women-govt-html';
import type { FundingSource } from '@/lib/funding/types';

const sources: FundingSource[] = [
  beehiveSource,
  treasurySource,
  getsSource,
  dataGovtSource,
  mbieSource,
  womenGovtSource,
];

async function main() {
  for (const src of sources) {
    const start = Date.now();
    process.stdout.write(`\n=== ${src.key} (${src.displayName}) ===\n`);
    try {
      const items = await src.fetch();
      const ms = Date.now() - start;
      console.log(`✓ ${items.length} items in ${ms}ms`);
      items.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.title.slice(0, 90)}`);
        console.log(`     ${item.url}`);
        if (item.publishedAt) console.log(`     published: ${item.publishedAt.toISOString()}`);
      });
    } catch (err) {
      console.error(`✗ failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
