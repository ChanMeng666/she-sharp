'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Fragment, ReactNode } from 'react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
}

/**
 * Parses simple markdown text and returns React elements.
 * Supports: links [text](url), bold **text**, and line breaks.
 */
function parseMarkdown(text: string): ReactNode[] {
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
              className="text-[#9b2e83] hover:text-[#c846ab] underline underline-offset-2"
            >
              {linkText}
            </a>
          );
        } else {
          elements.push(
            <Link
              key={key}
              href={url}
              className="text-[#9b2e83] hover:text-[#c846ab] underline underline-offset-2"
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

export function ChatMessage({ content, role, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-3 px-6 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm',
        isUser
          ? 'bg-muted text-foreground'
          : 'bg-[#9b2e83] text-white'
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className={cn(
        'flex flex-col max-w-[75%]',
        isUser ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-muted border border-border rounded-br-md'
            : 'bg-[#f7e5f3] border border-[#9b2e83]/20 rounded-bl-md'
        )}>
          <div className={cn(
            'prose prose-sm max-w-none text-sm leading-relaxed',
            isUser ? 'text-foreground' : 'text-foreground'
          )}>
            {parseMarkdown(content)}
            {isStreaming && (
              <span className="inline-block h-4 w-1 animate-pulse bg-foreground ml-1 rounded-full" />
            )}
          </div>
        </div>

        <span className={cn(
          'text-xs text-muted-foreground mt-1 px-2',
          isUser ? 'text-right' : 'text-left'
        )}>
          {isUser ? 'You' : 'She Sharp Assistant'}
        </span>
      </div>
    </motion.div>
  );
}