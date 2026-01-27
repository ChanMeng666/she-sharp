"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X, Send, Trash2, EllipsisVertical, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { presetQuestions } from "./preset-questions";
import { Badge } from "@/components/ui/badge";
import { PresetQuestion } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseMarkdown } from "./markdown-utils";

const STORAGE_KEY = "she-sharp-chat-history";
const MAX_HISTORY_SIZE = 50;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "questions">("chat");
  const [selectedQuestion, setSelectedQuestion] = useState<PresetQuestion | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage
  const loadChatHistory = useCallback(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.slice(-MAX_HISTORY_SIZE); // Keep only last 50 messages
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }

    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm the She Sharp assistant. I'm here to help you learn about our organisation, programmes, and how you can get involved. How can I help you today?",
      },
    ];
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: "/api/chat",
    initialMessages: loadChatHistory(),
    onError: (error) => {
      console.error("[Chatbot] Error occurred:", error);
      console.error("[Chatbot] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    },
    onResponse: (response) => {
      console.log("[Chatbot] Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    },
    onFinish: (message) => {
      console.log("[Chatbot] Message finished:", message);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0 && typeof window !== "undefined") {
      try {
        const toSave = messages.slice(-MAX_HISTORY_SIZE);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    }
  }, [messages]);

  // Keyboard shortcut to open/close chat
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  // Reset activeTab and focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("chat");
      setSelectedQuestion(null);
      if (textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    }
  }, [isOpen]);

  const handlePresetQuestion = (preset: PresetQuestion) => {
    setSelectedQuestion(preset);
    setActiveTab("questions");
  };

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      console.log("[Chatbot] Form submitted with input:", input);
      console.log("[Chatbot] Current messages:", messages);
      console.log("[Chatbot] Is loading:", isLoading);
      handleSubmit(e);
    },
    [input, messages, isLoading, handleSubmit]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("[Chatbot] Enter key pressed, submitting form");
      handleFormSubmit(e as any);
    }
  };

  const clearHistory = useCallback(() => {
    const initialMessages = [
      {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hello! I'm the She Sharp assistant. I'm here to help you learn about our organisation, programmes, and how you can get involved. How can I help you today?",
      },
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
              "fixed z-50",
              // Mobile layout (default) - fullscreen with margins
              "top-4 right-4 bottom-0 left-4",
              // Desktop layout (sm and up) - positioned dialog
              "sm:top-auto sm:left-auto",
              "sm:bottom-4 sm:right-4",
              "sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]",
              "sm:h-[40rem] sm:max-h-[calc(100vh-5rem)]"
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <Card className="flex flex-col overflow-hidden shadow-2xl border-border h-full bg-background p-0 gap-0">
                <div className="flex items-center justify-between bg-navy p-4 text-background shrink-0">
                  <div className="flex items-center gap-3">
                    {selectedQuestion ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedQuestion(null)}
                        className="text-white bg-transparent hover:bg-transparent hover:text-white border-none w-12 h-12 p-0 flex items-center justify-center "
                      >
                        <ArrowLeft size={24} />
                      </Button>
                    ) : (
                      <MessageSquare size={24} />
                    )}

                    <h3 className="font-semibold text-lg">
                      She Sharp Assistant
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          title="More options"
                          className="text-white bg-transparent hover:bg-transparent hover:text-white border-none w-12 h-12 p-0 flex items-center justify-center [&_svg]:w-[24px]! [&_svg]:h-[24px]!"
                        >
                          <EllipsisVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={clearHistory}
                          variant="destructive"
                        >
                          <Trash2 size={20} />
                          Clear chat history
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="text-white bg-transparent hover:bg-transparent hover:text-white border-none w-12 h-12 p-0 flex items-center justify-center [&_svg]:w-[24px]! [&_svg]:h-[24px]!"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                  {activeTab === "chat" ? (
                    <>
                      <ScrollArea
                        ref={scrollAreaRef}
                        className="flex-1 overflow-auto"
                      >
                        <div className="flex flex-col">
                          {messages
                            .filter((message) => message.id !== "system")
                            .map((message) => (
                              <ChatMessage
                                key={message.id}
                                content={message.content}
                                role={message.role as "user" | "assistant"}
                                isStreaming={false}
                              />
                            ))}
                          {messages.filter((message) => message.id !== "system")
                            .length <= 1 && (
                            <div className="px-6 py-3">
                              <div className="rounded-lg bg-muted/50 border border-border/30 px-4 py-3 text-sm text-muted-foreground">
                                💡 <strong>Tip:</strong> Check out the{" "}
                                <button
                                  onClick={() => {
                                    setActiveTab("questions");
                                    setSelectedQuestion(null);
                                  }}
                                  className="text-brand hover:underline font-medium"
                                >
                                  Quick Questions
                                </button>{" "}
                                tab to see answers to commonly asked questions!
                              </div>
                            </div>
                          )}
                          {isLoading && <TypingIndicator />}
                        </div>
                      </ScrollArea>

                      {error && (
                        <Alert
                          variant="destructive"
                          className="mx-4 my-2 shrink-0"
                        >
                          <AlertDescription>
                            Error:{" "}
                            {error.message ||
                              "Failed to send message. Please check the console for details."}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <ScrollArea className="flex-1 overflow-auto">
                      {selectedQuestion ? (
                        <div className="p-6">
                          <div className="mb-4">
                            <Badge
                              variant="outline"
                              className="text-xs text-brand shrink-0 border border-brand rounded-full py-2 mb-3"
                            >
                              {selectedQuestion.category.toUpperCase()}
                            </Badge>
                            <h2 className="text-lg font-semibold text-foreground mb-4">
                              {selectedQuestion.question}
                            </h2>
                          </div>
                          <div className="prose prose-sm max-w-none text-sm leading-loose text-foreground">
                            {parseMarkdown(selectedQuestion.answer)}
                          </div>
                        </div>
                      ) : (
                        <div className="px-2 py-4 space-y-2">
                          {presetQuestions.map((preset) => (
                            <Button
                              key={preset.id}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left h-auto py-2 px-2 border-0 hover:bg-muted transition-colors"
                              onClick={() => {
                                handlePresetQuestion(preset);
                              }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Badge
                                  variant="outline"
                                  className="text-xs  text-brand shrink-0 border border-brand rounded-full py-2  "
                                >
                                  {preset.category.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-foreground leading-snug flex-1">
                                  {preset.question}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}

                  {activeTab === "chat" && (
                    <form
                      onSubmit={handleFormSubmit}
                      className="border-t border-border p-4 shrink-0 bg-background"
                    >
                      <div className="relative">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your message..."
                          className="min-h-[60px] max-h-[120px] resize-none border-none focus:border-none focus:ring-0 focus-visible:ring-0 pr-12"
                          disabled={isLoading}
                        />
                        <Button
                          type="submit"
                          variant="brand"
                          disabled={isLoading || !input.trim()}
                          className="absolute top-1/2 -translate-y-1/2 right-2 h-10 w-10 shrink-0"
                        >
                          <Send size={20} />
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Bottom Navigation */}
                  <div className="bg-background shrink-0">
                    <div className="flex">
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex-1 rounded-none py-6 transition-colors",
                          activeTab === "chat"
                            ? "bg-brand text-white hover:bg-brand-hover"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setActiveTab("chat");
                          setSelectedQuestion(null);
                        }}
                      >
                        Chat
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex-1 rounded-none py-6 transition-colors",
                          activeTab === "questions"
                            ? "bg-brand text-white hover:bg-brand-hover"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setActiveTab("questions");
                          setSelectedQuestion(null);
                        }}
                      >
                        Quick Questions
                      </Button>
                    </div>
                  </div>
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
          "fixed bottom-4 right-4 sm:bottom-4 sm:right-4 z-50",
          isOpen && "hidden"
        )}
      >
        <Button
          variant="brand"
          onClick={() => setIsOpen(!isOpen)}
          className="h-16 w-16 shadow-xl hover:shadow-2xl"
        >
          <MessageSquare size={24} />
        </Button>
      </motion.div>
    </>
  );
}
