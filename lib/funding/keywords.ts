/**
 * Keyword dictionaries for She Sharp funding relevance scoring.
 * Used both inside the OpenAI system prompt and as a deterministic fallback
 * scorer when the API is unavailable.
 */

export const SHE_SHARP_MISSION = `
She Sharp is a New Zealand non-profit supporting women and gender minorities
in Science, Technology, Engineering, and Mathematics (STEM). Core focus areas:
mentorship for women in tech, digital equity for under-represented communities,
STEM education for girls and young women, career development for women in tech,
and digital inclusion for Māori, Pasifika, and migrant women.
`.trim();

export const POSITIVE_KEYWORDS: ReadonlyArray<{ term: string; weight: number }> = [
  // Core mission (high weight)
  { term: 'women in tech', weight: 30 },
  { term: 'women in stem', weight: 30 },
  { term: 'gender equity', weight: 25 },
  { term: 'gender equality', weight: 25 },
  { term: 'digital equity', weight: 25 },
  { term: 'digital inclusion', weight: 25 },
  { term: 'digital divide', weight: 20 },

  // Tech / STEM (medium-high)
  { term: 'stem education', weight: 20 },
  { term: 'cyber security', weight: 15 },
  { term: 'cybersecurity', weight: 15 },
  { term: 'data science', weight: 15 },
  { term: 'innovation', weight: 10 },
  { term: 'technology', weight: 8 },
  { term: 'digital skills', weight: 15 },
  { term: 'coding', weight: 12 },
  { term: 'software', weight: 8 },

  // Audience overlap (medium)
  { term: 'māori', weight: 12 },
  { term: 'pasifika', weight: 12 },
  { term: 'pacific', weight: 8 },
  { term: 'youth', weight: 8 },
  { term: 'young women', weight: 18 },
  { term: 'girls', weight: 15 },
  { term: 'underrepresented', weight: 12 },
  { term: 'marginalised', weight: 10 },
  { term: 'migrant', weight: 8 },

  // Funding nature (signals it is a grant we could apply to)
  { term: 'grant', weight: 10 },
  { term: 'funding', weight: 8 },
  { term: 'scholarship', weight: 10 },
  { term: 'sponsorship', weight: 8 },
  { term: 'community fund', weight: 12 },
  { term: 'capability', weight: 6 },
  { term: 'capacity building', weight: 8 },
  { term: 'mentorship', weight: 15 },
  { term: 'non-profit', weight: 8 },
  { term: 'not-for-profit', weight: 8 },
  { term: 'charity', weight: 6 },
  { term: 'ngo', weight: 8 },
];

export const NEGATIVE_KEYWORDS: ReadonlyArray<string> = [
  'road maintenance',
  'roading',
  'plumbing',
  'sewerage',
  'wastewater',
  'irrigation',
  'farming subsidy',
  'forestry',
  'fisheries quota',
  'racing industry',
  'gun licence',
  'firearms',
  'demolition',
  'abattoir',
  'paving',
  'asphalt',
];

/**
 * GETS UNSPSC top-level category whitelist for She Sharp relevance.
 * See: https://www.unspsc.org/
 *  - 43000000 IT & Telecommunications
 *  - 80000000 Management & Business Services
 *  - 81000000 Engineering, Research & Tech-Based Services
 *  - 85000000 Healthcare Services (sometimes social-sector procurement)
 *  - 86000000 Education & Training Services
 *  - 93000000 Politics & Civic Affairs Services
 *  - 94000000 Organisations & Clubs
 */
export const GETS_RELEVANT_CATEGORY_PREFIXES = [
  '43',
  '80',
  '81',
  '85',
  '86',
  '93',
  '94',
];

/**
 * Deterministic fallback scorer used when OpenAI is unavailable.
 * Returns 0-100 — sums positive matches, subtracts 30 per negative match,
 * caps to [0, 100].
 */
export function keywordScore(text: string): { score: number; matched: string[] } {
  const lower = text.toLowerCase();
  let score = 0;
  const matched: string[] = [];

  for (const { term, weight } of POSITIVE_KEYWORDS) {
    if (lower.includes(term)) {
      score += weight;
      matched.push(term);
    }
  }

  for (const term of NEGATIVE_KEYWORDS) {
    if (lower.includes(term)) {
      score -= 30;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), matched };
}
