import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'stranger';
}

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

export function ChatBox({ messages, onSendMessage, disabled }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">Live Chat</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                  msg.sender === 'me'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && !disabled && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
              <p className="text-sm">Say hello! 👋</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Waiting for connection..." : "Type a message..."}
          disabled={disabled}
          className="flex-1 bg-background/50 border-white/10 focus-visible:ring-primary/50"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={disabled || !input.trim()}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
