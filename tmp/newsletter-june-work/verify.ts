import { getIssue } from "@/lib/newsletter/issues-registry";

const issue = getIssue("2026-06");
if (!issue) { console.error("FAIL: getIssue returned null"); process.exit(1); }
console.log("Schema parse: OK (2026-06)");

// Collect every photo URL in the issue.
const urls: { where: string; url: string }[] = [];
if (issue.editorial.heroImageUrl) urls.push({ where: "heroImageUrl", url: issue.editorial.heroImageUrl });
if (issue.editorial.photoOfTheMonth) urls.push({ where: "photoOfTheMonth", url: issue.editorial.photoOfTheMonth.src });
if (issue.editorial.founderNote.photoUrl) urls.push({ where: "founderNote.photoUrl", url: issue.editorial.founderNote.photoUrl });
issue.auto.photoStrip.forEach((p, i) => urls.push({ where: `photoStrip[${i}]`, url: p.src }));

console.log(`\nAll photo/image URLs (${urls.length}):`);
for (const u of urls) console.log(`  ${u.where.padEnd(22)} ${u.url}`);

// Uniqueness (exclude founder headshot from the "no duplicate event photos" rule but still print).
const stripAndFeature = urls.filter((u) => u.where !== "founderNote.photoUrl").map((u) => u.url);
const dupes = stripAndFeature.filter((u, i) => stripAndFeature.indexOf(u) !== i);
console.log(`\nUnique (hero+POM+strip): ${new Set(stripAndFeature).size}/${stripAndFeature.length}  dupes=${dupes.length ? dupes.join(",") : "NONE"}`);

// Absolute https check for ALL urls in the issue (photos + links).
const allUrls = [
  ...urls.map((u) => u.url),
  issue.editorial.primaryCta.href,
  ...issue.editorial.opportunities.map((o) => o.href),
  ...issue.auto.recapEvents.map((e) => e.url),
  ...(issue.auto.photoAlbumUrl ? [issue.auto.photoAlbumUrl] : []),
];
const notHttps = allUrls.filter((u) => !/^https:\/\//.test(u));
console.log(`Absolute https: ${notHttps.length === 0 ? "ALL OK" : "BAD -> " + notHttps.join(",")}`);

// Field presence spot checks.
console.log(`\nsubjectLine (${issue.editorial.subjectLine.length} chars): "${issue.editorial.subjectLine}"`);
console.log(`previewText (${issue.editorial.previewText.length} chars)`);
console.log(`primaryCta.label (${issue.editorial.primaryCta.label.length} chars): "${issue.editorial.primaryCta.label}"`);
console.log(`spotlight key present in editorial JSON? ${("spotlight" in (issue.editorial as any))}`);
console.log(`founderNote.photoUrl: ${issue.editorial.founderNote.photoUrl}`);

const ok = dupes.length === 0 && notHttps.length === 0 && issue.editorial.subjectLine.length <= 50 && issue.editorial.previewText.length <= 120 && issue.editorial.primaryCta.label.length <= 40;
console.log(`\nRESULT: ${ok ? "PASS" : "FAIL"}`);
if (!ok) process.exit(1);
