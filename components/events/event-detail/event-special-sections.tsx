import { EventSpecialSection } from "@/types/event";
import { cn } from "@/lib/utils";
import { ExternalLink, Video, ListChecks } from "lucide-react";

interface EventSpecialSectionsProps {
  sections: EventSpecialSection[];
  className?: string;
}

function extractVideoEmbed(content: string): {
  text: string;
  url: string;
} | null {
  // Check for patterns like "text :https://..." or "text:https://..."
  const match = content.match(/^(.+?)\s*:\s*(https?:\/\/\S+)$/);
  if (match) {
    return {
      text: match[1].trim(),
      url: match[2].trim(),
    };
  }
  return null;
}

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();

  // Bare video id (11-char YouTube identifier)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}


function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5 marker:text-brand">
      {items.map((item, i) => (
        <li key={i} className="text-muted-foreground leading-relaxed text-pretty pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

function SpecialSectionContent({ content }: { content: string }) {
  const videoData = extractVideoEmbed(content);

  if (videoData) {
    return (
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground">{videoData.text}:</span>
        <a
          href={videoData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline flex items-center gap-1 break-all"
        >
          {videoData.url}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    );
  }

  // Check if content is a plain URL
  if (content.match(/^https?:\/\/\S+$/)) {
    return (
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand hover:underline flex items-center gap-1 break-all"
      >
        {content}
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    );
  }

  return <p className="text-muted-foreground leading-relaxed text-pretty">{content}</p>;
}

function YouTubeEmbeds({ items }: { items: string[] }) {
  const videoIds = items
    .map(extractYouTubeId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {videoIds.map((id) => (
        <div
          key={id}
          className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-card-sm)] bg-black"
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Self-hosted video files (as opposed to the YouTube embeds above).
 *
 * Each item is pipe-delimited: "<video src>|Accessible label|/poster.jpg",
 * matching the delimiter convention used by CollaborationLogos. The poster is
 * optional but strongly preferred — without it the player sits on a black
 * rectangle until the user presses play.
 *
 * The video src is an absolute Vercel Blob URL (see `lib/config/assets.ts`);
 * the poster stays a same-origin `/img/` path so `next/image`-adjacent tooling
 * and `scripts/verify-image-paths.ts` still see it. JSON cannot import the
 * constants, so the URL is written out in `shesharp_events_v3.json` and the two
 * are changed together.
 *
 * Deliberately NOT autoplaying: these are content videos rather than the
 * decorative loops elsewhere on the site, so playback stays under the reader's
 * control and nothing downloads beyond metadata until they ask for it.
 */
function VideoEmbeds({ items }: { items: string[] }) {
  const videos = items
    .map((raw) => {
      const [src, label, poster] = raw.split("|").map((s) => s.trim());
      return { src, label: label || "Event video", poster: poster || undefined };
    })
    .filter((v) => Boolean(v.src));

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <figure key={video.src} className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-card-sm)] border border-border bg-black">
            <video
              src={video.src}
              poster={video.poster}
              controls
              preload="metadata"
              playsInline
              aria-label={video.label}
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <figcaption className="text-sm text-ink-600">{video.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function CollaborationLogos({ items }: { items: string[] }) {
  // Each item is either a bare logo path, or a pipe-delimited
  // "Alt text|/logo/path.svg|https://optional-link". Pipe is a safe delimiter
  // (it never appears in URLs, paths, or org names).
  const logos = items.map((raw) => {
    const parts = raw.split("|").map((s) => s.trim());
    if (parts.length >= 2) {
      return { alt: parts[0], src: parts[1], href: parts[2] || undefined };
    }
    return { alt: "Partner logo", src: parts[0], href: undefined };
  });

  return (
    <div className="flex flex-wrap gap-8 md:gap-12 items-center">
      {logos.map((logo, i) => {
        // Partner logos are vector art sized by height with `w-auto`, so they
        // stay a raw <img>: the optimizer rejects SVG without
        // `dangerouslyAllowSVG`, and a fixed width would break the lock-up.
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo.src}
            alt={logo.alt}
            loading="lazy"
            decoding="async"
            className="h-14 sm:h-16 md:h-20 w-auto object-contain"
          />
        );
        return logo.href ? (
          <a
            key={i}
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            title={logo.alt}
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            {img}
          </a>
        ) : (
          <div key={i} className="inline-flex items-center">
            {img}
          </div>
        );
      })}
    </div>
  );
}

function RelatedLinks({ items }: { items: string[] }) {
  const links = items
    .map((item) => {
      const withLabel = item.match(/^(.+?)\s*:\s*(https?:\/\/\S+)$/);
      if (withLabel) {
        return { label: withLabel[1].trim(), url: withLabel[2].trim() };
      }
      if (/^https?:\/\/\S+$/.test(item.trim())) {
        return { label: item.trim(), url: item.trim() };
      }
      return null;
    })
    .filter((link): link is { label: string; url: string } => Boolean(link));

  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-2 text-brand hover:underline break-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{link.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function normalizeTitle(title: string): string {
  if (title === title.toUpperCase() && title.length > 3) {
    return title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return title;
}

export function EventSpecialSections({
  sections,
  className,
}: EventSpecialSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      {sections.map((section, index) => {
        const sectionType = section.type.toLowerCase();
        const isYouTube = sectionType === "youtube";
        const isVideo = sectionType === "video";
        const isCollaboration =
          sectionType === "collaboration" ||
          sectionType === "in-collaboration" ||
          sectionType === "in_collaboration";
        const isRelatedLinks =
          sectionType === "related-links" ||
          sectionType === "related_links" ||
          sectionType === "links";
        const isBulletList =
          sectionType === "topics" ||
          sectionType === "agenda" ||
          sectionType === "bullets" ||
          sectionType === "prizes" ||
          sectionType === "judging";

        return (
          <div key={index} className="py-6 md:py-8 space-y-5">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {normalizeTitle(section.title)}
            </h3>
            <div
              className={
                isYouTube || isVideo || isCollaboration ? "w-full" : "max-w-prose"
              }
            >
              {isYouTube ? (
                <YouTubeEmbeds items={section.content} />
              ) : isVideo ? (
                <VideoEmbeds items={section.content} />
              ) : isCollaboration ? (
                <CollaborationLogos items={section.content} />
              ) : isRelatedLinks ? (
                <RelatedLinks items={section.content} />
              ) : isBulletList ? (
                <BulletList
                  items={section.content.filter((item) => item !== section.title)}
                />
              ) : (
                <div className="space-y-3">
                  {section.content.map((item, i) => {
                    if (item === section.title) return null;
                    return (
                      <div key={i}>
                        <SpecialSectionContent content={item} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
