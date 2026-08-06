import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  focus?: boolean;
}

export function ChatInput({ onSend, disabled, focus = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    updateDesktop();
    window.addEventListener("resize", updateDesktop);
    return () => window.removeEventListener("resize", updateDesktop);
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    if (focus && taRef.current) {
      setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [focus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !disabled) {
        onSend(text.trim());
        setText("");
      }
    }
  };

  return (
    <div className="w-full z-10 flex flex-col items-center justify-end pb-2 sm:pb-3 bg-transparent pt-1">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8">
        <div className="relative flex flex-col rounded-[22px] border border-border/80 bg-transparent shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-3xl overflow-hidden p-1.5 transition-all hover:border-primary/40">
          
          <div className="flex items-center gap-2 px-2">
            {/* Sparkles Icon Indicator - Only shown on mobile/tablet */}
            {!isDesktop && (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 fill-primary/10 animate-pulse" />
              </div>
            )}

            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the tutor..."
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/60 text-sm sm:text-base focus:ring-0 resize-none min-h-[24px] max-h-[120px] py-1.5 custom-scrollbar font-medium"
              rows={1}
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mic Button */}
              <button
                type="button"
                aria-label="Voice input"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Mic className="h-5 w-5" />
              </button>
              
              {/* Send Button */}
              <button
                aria-label="Send message"
                onClick={() => {
                  if (text.trim() && !disabled) {
                    onSend(text.trim());
                    setText("");
                  }
                }}
                disabled={disabled || !text.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(112,181,255,0.3)] transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none hover:bg-primary/95 cursor-pointer"
              >
                <Send className="h-4.5 w-4.5 ml-0.5" />
              </button>
            </div>
          </div>

          <div className="text-center py-0.5">
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/45 font-medium">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
