'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { presetQuestions } from './preset-questions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsProps {
  onSelectQuestion: (question: string, answer: string) => void;
}

const categoryColors = {
  about: 'bg-periwinkle-light text-periwinkle-dark border-periwinkle-dark/30',
  events: 'bg-mint-light text-navy-dark border-mint-dark/30',
  mentorship: 'bg-purple-light text-purple-dark border-purple-dark/30',
  support: 'bg-navy-light text-navy-dark border-navy-dark/30',
  general: 'bg-gray/10 text-gray border-gray/30'
};

export function QuickActions({ onSelectQuestion }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-purple-dark/10 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-light/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-purple-dark group-hover:text-purple-mid transition-colors" />
          <span className="text-sm font-medium text-navy-dark">Quick Questions</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-purple-dark" />
        ) : (
          <ChevronDown size={18} className="text-purple-dark" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ScrollArea className="h-44 px-4 pb-4">
              <div className="space-y-3">
                {presetQuestions.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-3 px-4 border-purple-dark/20 hover:bg-purple-light/50 hover:border-purple-dark/40 transition-all duration-200"
                    onClick={() => {
                      onSelectQuestion(preset.question, preset.answer);
                      setIsExpanded(false);
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs flex-shrink-0 border', categoryColors[preset.category])}
                      >
                        {preset.category}
                      </Badge>
                      <span className="text-sm text-navy-dark leading-relaxed flex-1">{preset.question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}