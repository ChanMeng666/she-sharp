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
  about: 'bg-[#f7e5f3] text-[#9b2e83] border-[#9b2e83]/30',
  events: 'bg-[#effefb] text-[#1f1e44] border-[#b1f6e9]',
  mentorship: 'bg-[#f4f4fa] text-[#8982ff] border-[#8982ff]/30',
  support: 'bg-[#eaf2ff] text-[#1f1e44] border-[#1378d1]/30',
  general: 'bg-muted text-foreground border-border'
};

export function QuickActions({ onSelectQuestion }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-border bg-background">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors group"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-[#9b2e83] group-hover:text-[#c846ab] transition-colors" />
          <span className="text-sm font-medium text-foreground">Quick Questions</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-[#9b2e83]" />
        ) : (
          <ChevronDown size={18} className="text-[#9b2e83]" />
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
              <div className="space-y-2">
                {presetQuestions.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-4 border-border border-[1px] hover:bg-muted transition-colors"
                    onClick={() => {
                      onSelectQuestion(preset.question, preset.answer);
                      setIsExpanded(false);
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs flex-shrink-0 border', categoryColors[preset.category])}
                      >
                        {preset.category}
                      </Badge>
                      <span className="text-sm text-foreground leading-snug flex-1">{preset.question}</span>
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