'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, X, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';
import { QuickActions } from './quick-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STORAGE_KEY = 'she-sharp-chat-history';
const MAX_HISTORY_SIZE = 50;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Load chat history from localStorage
  const loadChatHistory = useCallback(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.slice(-MAX_HISTORY_SIZE); // Keep only last 50 messages
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m the She Sharp assistant. I\'m here to help you learn about our organization, programs, and how you can get involved. How can I help you today?'
      }
    ];
  }, []);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, error } = useChat({
    api: '/api/chat',
    initialMessages: loadChatHistory(),
    onError: (error) => {
      console.error('[Chatbot] Error occurred:', error);
      console.error('[Chatbot] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    },
    onResponse: (response) => {
      console.log('[Chatbot] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    },
    onFinish: (message) => {
      console.log('[Chatbot] Message finished:', message);
    }
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0 && typeof window !== 'undefined') {
      try {
        const toSave = messages.slice(-MAX_HISTORY_SIZE);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  // Keyboard shortcut to open/close chat
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handlePresetQuestion = (question: string, answer: string) => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: question },
      { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }
    ]);
  };

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Chatbot] Form submitted with input:', input);
    console.log('[Chatbot] Current messages:', messages);
    console.log('[Chatbot] Is loading:', isLoading);
    handleSubmit(e);
  }, [input, messages, isLoading, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('[Chatbot] Enter key pressed, submitting form');
      handleFormSubmit(e as any);
    }
  };


  const clearHistory = useCallback(() => {
    const initialMessages = [
      {
        id: 'welcome',
        role: 'assistant' as const,
        content: 'Hello! I\'m the She Sharp assistant. I\'m here to help you learn about our organization, programs, and how you can get involved. How can I help you today?'
      }
    ];
    setMessages(initialMessages);
    localStorage.removeItem(STORAGE_KEY);
  }, [setMessages]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className={cn(
              'fixed z-50',
              // Mobile layout (default) - fullscreen with margins
              'top-4 right-4 bottom-4 left-4',
              // Desktop layout (sm and up) - positioned dialog
              'sm:top-auto sm:left-auto',
              'sm:bottom-4 sm:right-4',
              'sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]',
              'sm:h-[40rem] sm:max-h-[calc(100vh-5rem)]'
            )}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <Card className="flex flex-col overflow-hidden shadow-2xl border-purple-dark/20 h-full bg-white p-0">
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-dark to-periwinkle-dark p-4 text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <MessageSquare size={22} />
                  <h3 className="font-semibold text-lg">She Sharp Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-white hover:bg-white/20 transition-colors"
                    onClick={clearHistory}
                    title="Clear chat history"
                  >
                    <Trash2 size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-white hover:bg-white/20 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-auto">
                    <div className="flex flex-col">
                      {messages
                        .filter((message) => message.id !== 'system')
                        .map((message) => (
                          <ChatMessage
                            key={message.id}
                            content={message.content}
                            role={message.role as 'user' | 'assistant'}
                            isStreaming={false}
                          />
                        ))}
                      {isLoading && <TypingIndicator />}
                    </div>
                  </ScrollArea>

                  {error && (
                    <Alert variant="destructive" className="mx-4 my-2 flex-shrink-0">
                      <AlertDescription>
                        Error: {error.message || 'Failed to send message. Please check the console for details.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex-shrink-0">
                    <QuickActions onSelectQuestion={handlePresetQuestion} />
                  </div>

                  <form onSubmit={handleFormSubmit} className="border-t border-purple-dark/10 p-5 flex-shrink-0 bg-white">
                    <div className="flex gap-3">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="min-h-[60px] max-h-[120px] resize-none border-purple-dark/20 focus:border-purple-dark focus:ring-purple-dark/20 rounded-xl"
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="bg-purple-dark hover:bg-purple-mid flex-shrink-0 h-[60px] w-[60px] rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Send size={22} />
                      </Button>
                    </div>
                  </form>
                </div>
            </Card>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-4 sm:right-4 z-50',
          isOpen && 'hidden'
        )}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-dark to-periwinkle-dark text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <MessageSquare size={26} />
        </button>
      </motion.div>
    </>
  );
}