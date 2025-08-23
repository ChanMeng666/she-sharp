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
          ? 'bg-periwinkle-dark text-white' 
          : 'bg-purple-dark text-white'
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
            ? 'bg-periwinkle-light border border-periwinkle-dark/20 rounded-br-md' 
            : 'bg-purple-light border border-purple-dark/20 rounded-bl-md'
        )}>
          <div className={cn(
            'prose prose-sm max-w-none',
            isUser ? 'text-navy-dark' : 'text-navy-dark'
          )}>
            {content}
            {isStreaming && (
              <span className="inline-block h-4 w-1 animate-pulse bg-mint-dark ml-1 rounded-full" />
            )}
          </div>
        </div>
        
        <span className={cn(
          'text-xs text-gray mt-1 px-2',
          isUser ? 'text-right' : 'text-left'
        )}>
          {isUser ? 'You' : 'She Sharp Assistant'}
        </span>
      </div>
    </motion.div>
  );
}