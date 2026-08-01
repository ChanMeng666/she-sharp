import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeckPrint } from "@/components/deck/deck-print";
import { DeckViewport } from "@/components/deck/deck-viewport";
import { getDeck } from "@/lib/deck/registry";
import { collectDeckImages } from "@/lib/deck/utils";
import { absoluteUrl } from "@/lib/seo/site";

// NOTE: the root layout awaits `cookies()` (via the SWR `getUser()` fallback),
// which forces dynamic rendering for every route. A `force-static` here would
// be silently ignored, so it is deliberately absent. The cost is one server
// render of static data — no database, no fetch — after which the deck is
// entirely client-side.

type PageProps = {
  params: Promise<{ deck: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** First parameter value, ignoring repeats. */
function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parses `?aspect=16:9` or `?aspect=1.7778` into a ratio, or null for auto. */
function parseAspect(raw: string | undefined): number | null {
  if (!raw) return null;
  const pair = raw.match(/^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/i);
  if (pair) {
    const ratio = Number(pair[1]) / Number(pair[2]);
    return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { deck: slug } = await params;
  const deck = getDeck(slug);

  if (!deck) {
    return { title: { absolute: "Presentation not found | She Sharp" } };
  }

  return {
    title: { absolute: `${deck.title} — Presentation | She Sharp` },
    description: deck.subtitle,
    robots: { index: false, follow: false },
    // Defensive: the root layout declares no canonical, so nothing cascades
    // today. Setting our own guarantees a future `/present` canonical can never
    // pair a noindex child with a parent-pointing canonical.
    alternates: { canonical: absoluteUrl(`/present/${slug}`) },
  };
}

export default async function PresentDeckPage({
  params,
  searchParams,
}: PageProps) {
  const { deck: slug } = await params;
  const query = await searchParams;
  const deck = getDeck(slug);

  if (!deck) notFound();

  if (firstValue(query.print)) {
    return <DeckPrint deck={deck} />;
  }

  const zoom = Number(firstValue(query.zoom));

  return (
    <>
      {/* Warm the first few slides before hydration so slide one paints even on
          venue wifi that is about to get much worse. */}
      {collectDeckImages(deck)
        .slice(0, 6)
        .map((src) => (
          // eslint-disable-next-line @next/next/no-head-element
          <link key={src} rel="preload" as="image" href={src} />
        ))}
      <DeckViewport
        deck={deck}
        aspectLock={parseAspect(firstValue(query.aspect))}
        fit={firstValue(query.fit) === "contain" ? "contain" : "fill"}
        zoom={Number.isFinite(zoom) && zoom > 0 ? zoom : 1}
      />
    </>
  );
}
