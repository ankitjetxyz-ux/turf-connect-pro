import { useEffect, useRef, useState } from "react";
import { Conversation } from "@/pages/ChatPage";
import { useChat } from "@/hooks/useChat";

const MessageWindow = ({ 
  chatId, 
  onBack, 
  conversation 
}: { 
  chatId?: string | null; 
  onBack?: () => void;
  conversation?: Conversation;
}) => {
  const { messages, sending, sendMessage, currentUserId } = useChat(chatId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const success = await sendMessage(text);
    if (success) {
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = conversation?.other_user?.name || (conversation?.owner_id === currentUserId ? "Player" : "Turf Owner");

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <button 
          onClick={onBack} 
          className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-foreground">{displayName}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="text-muted-foreground text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">Start the conversation</span>
          </div>
        )}
        
        {messages.map((m, i) => {
          const isMe = m.sender_id === currentUserId;
          
          return (
            <div key={m.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-slide-up`}>
              <div 
                className={`max-w-[80%] md:max-w-[60%] p-3 rounded-2xl shadow-sm text-sm relative group backdrop-blur-sm
                  ${isMe 
                    ? "gradient-primary text-primary-foreground rounded-tr-none shadow-glow-sm" 
                    : "glass-card border-white/10 text-foreground rounded-tl-none"
                  }`}
              >
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className={`text-[10px] mt-1 opacity-70 flex items-center gap-1 ${isMe ? "justify-end text-primary-foreground/90" : "justify-start text-muted-foreground"}`}>
                  {m.created_at && new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && (
                    <span>
                      {m.read ? (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                         <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex gap-2 items-end bg-black/20 p-2 rounded-xl border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="Type a message..." 
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-3 px-2 text-sm text-foreground placeholder:text-muted-foreground"
            rows={1}
            style={{ minHeight: '44px' }} 
          />
          <button 
            onClick={handleSend} 
            disabled={!text.trim() || sending}
            className={`p-3 rounded-lg transition-all flex-shrink-0 mb-1
              ${!text.trim() || sending 
                ? "bg-white/5 text-muted-foreground cursor-not-allowed" 
                : "gradient-primary text-primary-foreground hover:shadow-glow transform hover:scale-105"
              }`}
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageWindow;
