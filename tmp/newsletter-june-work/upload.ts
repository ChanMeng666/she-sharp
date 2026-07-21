import { readFileSync } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

async function main() {
  const ROOT = process.cwd();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.error("no token"); process.exit(1); }

  const items = [
    { file: "tmp/newsletter-june-work/upload/hero.jpg",  name: "newsletter/2026-06/photos/her-waka-june-2026-hero.jpg" },
    { file: "tmp/newsletter-june-work/upload/potm.jpg",  name: "newsletter/2026-06/photos/peyvand-academy-20-june-2026-potm.jpg" },
    { file: "tmp/newsletter-june-work/upload/p20-3.jpg", name: "newsletter/2026-06/photos/peyvand-academy-20-june-2026-3.jpg" },
  ];

  for (const it of items) {
    const body = readFileSync(path.join(ROOT, it.file));
    const { url } = await put(it.name, body, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
      token,
    });
    console.log(`${it.file} -> ${url}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
