/**
 * Renders a JSON-LD structured-data block.
 *
 * Server-component friendly. Pass any schema.org object (or array of objects)
 * built via the helpers in lib/seo/schema.ts.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
