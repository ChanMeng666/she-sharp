import { Fragment, ReactNode } from "react";
import Link from "next/link";

/**
 * Parses simple markdown text and returns React elements.
 * Supports: links [text](url), bold **text**, and line breaks.
 */
export function parseMarkdown(text: string): ReactNode[] {
  const elements: ReactNode[] = [];

  // Split by line breaks first
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      elements.push(<br key={`br-${lineIndex}`} />);
    }

    // Parse inline elements: links and bold
    const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = line.split(pattern);

    parts.forEach((part, partIndex) => {
      const key = `${lineIndex}-${partIndex}`;

      // Check for bold **text**
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        elements.push(<strong key={key}>{boldMatch[1]}</strong>);
        return;
      }

      // Check for link [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        const isExternal = url.startsWith('http');
        if (isExternal) {
          elements.push(
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-[#c846ab] underline underline-offset-2"
            >
              {linkText}
            </a>
          );
        } else {
          elements.push(
            <Link
              key={key}
              href={url}
              className="text-brand hover:text-[#c846ab] underline underline-offset-2"
            >
              {linkText}
            </Link>
          );
        }
        return;
      }

      // Plain text
      if (part) {
        elements.push(<Fragment key={key}>{part}</Fragment>);
      }
    });
  });

  return elements;
}

