"use client";

import { EventSpecialSection } from "@/types/event";
import { cn } from "@/lib/utils";
import { ExternalLink, Video, FileText, Lightbulb, Link2, ListChecks } from "lucide-react";

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

function getIconForType(type: string) {
  switch (type.toLowerCase()) {
    case "workshop_preparation":
      return <Lightbulb className="w-5 h-5 text-brand" />;
    case "video":
    case "youtube":
      return <Video className="w-5 h-5 text-brand" />;
    case "related-links":
    case "related_links":
    case "links":
      return <Link2 className="w-5 h-5 text-brand" />;
    case "topics":
    case "agenda":
    case "bullets":
    case "prizes":
    case "judging":
      return <ListChecks className="w-5 h-5 text-brand" />;
    default:
      return <FileText className="w-5 h-5 text-brand" />;
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5 marker:text-brand">
      {items.map((item, i) => (
        <li key={i} className="text-muted-foreground pl-1">
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

  return <p className="text-muted-foreground">{content}</p>;
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
          <div
            key={index}
            className="rounded-[var(--radius-card-sm)] bg-muted/40 border border-border p-4 sm:p-5 md:p-6 lg:p-8"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              {getIconForType(section.type)}
              <h3 className="text-xl font-semibold text-foreground">
                {section.title}
              </h3>
            </div>
            {isYouTube ? (
              <YouTubeEmbeds items={section.content} />
            ) : isRelatedLinks ? (
              <RelatedLinks items={section.content} />
            ) : isBulletList ? (
              <BulletList
                items={section.content.filter((item) => item !== section.title)}
              />
            ) : (
              <div className="space-y-4">
                {section.content.map((item, i) => {
                  // Skip duplicate titles
                  if (item === section.title) {
                    return null;
                  }
                  return (
                    <div key={i}>
                      <SpecialSectionContent content={item} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
