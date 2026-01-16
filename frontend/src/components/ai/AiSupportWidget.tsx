import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import api from "@/services/api";

const faqs = [
  {
    q: "How do I book a turf?",
    a: "Go to Browse Turfs, open a turf, pick a slot, and complete the payment. Your booking will appear in your dashboard.",
  },
  {
    q: "Can I chat with turf owners?",
    a: "Yes. After a confirmed booking, you can start a chat from your bookings and talk directly to the turf owner.",
  },
  {
    q: "How do tournaments work?",
    a: "Visit the Tournaments page, select a tournament, and join with your team details. Spots are limited.",
  },
];

const AiSupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{
    role: "user" | "assistant";
    content: string;
  }[]>([
    {
      role: "assistant",
      content: "Hi! I'm your turf assistant. Ask me about bookings, chat, or tournaments.",
    },
  ]);

  const handleToggle = () => setOpen((o) => !o);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);
    setInput("");

    try {
      // ✅ FIXED: Use API service instead of hardcoded URL
      // AI endpoint returns plain text, so we use fetch with proper base URL
      const baseURL = import.meta.env.VITE_API_URL || "/api";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${baseURL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ]);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2 bg-primary text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium">Help</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:right-6 z-40 w-[90vw] max-w-md rounded-2xl glass-card border border-white/15 shadow-elevated overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold">Turf Assistant</p>
                <p className="text-[10px] text-muted-foreground">Quick help & FAQs</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2 text-xs custom-scrollbar bg-background/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[80%] leading-snug border text-[11px] ${m.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/40 rounded-br-sm"
                    : "bg-secondary/70 text-foreground border-white/10 rounded-bl-sm"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 bg-background/80">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask something..."
                className="flex-1 bg-secondary/40 border border-white/10 rounded-xl px-3 py-2 text-xs resize-none outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiSupportWidget;
