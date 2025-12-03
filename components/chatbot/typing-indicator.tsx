'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 px-6 py-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm bg-[#9b2e83] text-white">
        <Bot size={18} />
      </div>

      <div className="flex flex-col items-start">
        <div className="bg-[#f7e5f3] border border-[#9b2e83]/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#9b2e83]"
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="text-xs text-muted-foreground mt-1 px-2">
          She Sharp Assistant is typing...
        </span>
      </div>
    </motion.div>
  );
}