"use client";

import { EventSpecialSection } from "@/types/event";
import { cn } from "@/lib/utils";
import { ExternalLink, Video, FileText, Lightbulb } from "lucide-react";

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

function getIconForType(type: string) {
  switch (type.toLowerCase()) {
    case "workshop_preparation":
      return <Lightbulb className="w-5 h-5 text-brand" />;
    case "video":
      return <Video className="w-5 h-5 text-brand" />;
    default:
      return <FileText className="w-5 h-5 text-brand" />;
  }
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

export function EventSpecialSections({
  sections,
  className,
}: EventSpecialSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {sections.map((section, index) => (
        <div
          key={index}
          className="rounded-2xl bg-muted/40 border border-border p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            {getIconForType(section.type)}
            <h3 className="text-xl font-semibold text-foreground">
              {section.title}
            </h3>
          </div>
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
        </div>
      ))}
    </div>
  );
}
