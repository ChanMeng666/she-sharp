// Scan all events for content patterns suggesting a list was dropped by the scraper.
// Looks for:
//   (a) paragraphs ending with ":" where the next paragraph is not a list
//   (b) paragraphs with phrases like "such as:", "including:", "focus on:", "key topics:", followed by a short sentence
//   (c) events whose fullDescription seems unusually short vs. other data signals

// This file is plain CommonJS run directly with `node`, so `require` is correct.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const events = JSON.parse(
  fs.readFileSync('lib/data/json/shesharp_events_v3.json', 'utf8')
).events;
const custom = JSON.parse(
  fs.readFileSync('lib/data/json/events-custom.json', 'utf8')
).events;

const all = [...events, ...custom];
const hits = [];

const listIndicators = [
  /include[sd]?:$/i,
  /following:$/i,
  /such as:$/i,
  /below:$/i,
  /discussed:$/i,
  /topics to:$/i,
  /focus on:$/i,
  /questions?:$/i,
  /pathway(s)?:$/i,
  /benefit(s)?:$/i,
  /highlight(s)?:$/i,
  /area(s)? of focus:$/i,
];

for (const e of all) {
  const desc = e.detailPageData?.fullDescription || [];
  for (let i = 0; i < desc.length; i++) {
    const p = desc[i].trim();
    if (p.length > 400) continue;
    const isListTrigger = listIndicators.some((re) => re.test(p));
    const endsWithColon = /:$/.test(p) && p.length < 350;
    if (!isListTrigger && !endsWithColon) continue;
    const next = (desc[i + 1] || '').trim();
    const nextIsList =
      /^[•\-*]\s/.test(next) || /^\d+\./.test(next) || /^[^.!?]+[\n\r]+[•\-*]/.test(next);
    if (nextIsList) continue;
    const hasTopicsSection =
      (e.detailPageData.specialSections || []).some((s) =>
        /topics|agenda|bullets|pathway|focus|discuss/i.test(s.type + ' ' + s.title)
      );
    if (hasTopicsSection) continue;
    hits.push({
      slug: e.slug,
      date: e.date,
      pIdx: i,
      endsWith: p.slice(-120),
      nextStart: next.slice(0, 120),
    });
  }
}

console.log(`Suspected dropped list content: ${hits.length} occurrence(s)`);
for (const h of hits) {
  console.log('---');
  console.log(`${h.slug} | ${h.date} | paragraph ${h.pIdx}`);
  console.log(`  ends: ${h.endsWith}`);
  console.log(`  next: ${h.nextStart}`);
}
