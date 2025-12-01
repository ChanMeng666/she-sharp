'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
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
          : 'bg-foreground text-background'
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
            : 'bg-muted border border-border rounded-bl-md'
        )}>
          <div className={cn(
            'prose prose-sm max-w-none',
            isUser ? 'text-foreground' : 'text-foreground'
          )}>
            {content}
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