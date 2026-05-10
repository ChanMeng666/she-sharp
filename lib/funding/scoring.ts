import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { fundingOpportunities } from '@/lib/db/schema';
import type { FundingOpportunity } from '@/lib/db/schema';
import { keywordScore, NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, SHE_SHARP_MISSION } from './keywords';

const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 5;

const SYSTEM_PROMPT = `You are a grant analyst for She Sharp, a New Zealand non-profit.

${SHE_SHARP_MISSION}

For each funding/grant/tender item provided, output a relevance score 0-100 indicating how well it matches She Sharp's mission. A score of:
- 80-100: directly targets women in tech / STEM / digital equity / NGOs supporting under-represented women
- 60-79: indirectly relevant — community capability, education, digital inclusion, NGO procurement
- 30-59: tangentially related (general community fund without gender/tech focus)
- 0-29: clearly off-topic (roading, plumbing, agriculture, farming, racing, defence, etc.)

Strong positive signals: ${POSITIVE_KEYWORDS.slice(0, 15).map((k) => k.term).join(', ')}.
Strong negative signals: ${NEGATIVE_KEYWORDS.slice(0, 8).join(', ')}.

Respond with strict JSON: {"items":[{"externalId":"...","score":<int 0-100>,"reason":"<one-sentence reason ≤ 120 chars>"}, ...]}.`;

interface ScoreResponse {
  items: Array<{ externalId: string; score: number; reason: string }>;
}

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/**
 * Deterministic fallback used when OpenAI is unavailable or fails.
 * Uses the keyword dictionary to compute a stable score.
 */
function fallbackScore(o: FundingOpportunity): { score: number; reason: string } {
  const text = `${o.title}\n${o.summary ?? ''}`;
  const { score, matched } = keywordScore(text);
  const reason = matched.length
    ? `Keyword match: ${matched.slice(0, 3).join(', ')}`
    : 'No keyword match (fallback scorer)';
  return { score, reason };
}

async function scoreBatch(client: OpenAI, batch: FundingOpportunity[]): Promise<Map<string, { score: number; reason: string }>> {
  const userPayload = batch.map((o) => ({
    externalId: o.externalId,
    title: o.title,
    summary: (o.summary ?? '').slice(0, 400),
    source: o.source,
  }));

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ items: userPayload }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{"items":[]}';
  const parsed = JSON.parse(raw) as ScoreResponse;

  const map = new Map<string, { score: number; reason: string }>();
  for (const item of parsed.items ?? []) {
    if (typeof item.externalId !== 'string') continue;
    const score = Math.max(0, Math.min(100, Math.round(Number(item.score))));
    if (!Number.isFinite(score)) continue;
    map.set(item.externalId, { score, reason: String(item.reason ?? '').slice(0, 200) });
  }
  return map;
}

/**
 * Scores all rows whose `relevance_score IS NULL` and persists results to the DB.
 * Returns the number of rows scored.
 */
export async function scoreUnscored(rows: FundingOpportunity[]): Promise<number> {
  if (rows.length === 0) return 0;

  const client = getClient();
  let scoredCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    let scoreMap: Map<string, { score: number; reason: string }> | null = null;

    if (client) {
      try {
        scoreMap = await scoreBatch(client, batch);
      } catch (err) {
        console.warn('[funding] OpenAI batch failed, falling back to keyword scorer:', err instanceof Error ? err.message : err);
      }
    }

    const ids: number[] = [];
    const updates = batch.map((o) => {
      const result = scoreMap?.get(o.externalId) ?? fallbackScore(o);
      ids.push(o.id);
      return { id: o.id, ...result };
    });

    // Drizzle does not support multi-row UPDATE with per-row values in one statement,
    // so we issue one UPDATE per row. Batch is at most 5 → cheap.
    await Promise.all(
      updates.map((u) =>
        db
          .update(fundingOpportunities)
          .set({ relevanceScore: u.score, relevanceReason: u.reason })
          .where(eq(fundingOpportunities.id, u.id)),
      ),
    );
    scoredCount += updates.length;
  }

  return scoredCount;
}
