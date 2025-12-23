import { useMemo } from "react";
import { Conversation } from "@/pages/ChatPage";

const ChatList = ({ conversations = [], onSelect, activeId }: { conversations?: Conversation[]; onSelect: (id: string) => void; activeId?: string | null }) => {
  const items = useMemo(() => conversations || [], [conversations]);
  const currentUserId = localStorage.getItem("user_id");

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full" />
          Chats
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-2xl">💬</span>
             </div>
             No conversations yet
          </div>
        ) : (
          items.map((c: Conversation, i) => {
            const time = c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
            const displayName = c.other_user?.name || (c.owner_id === currentUserId ? "Player" : "Turf Owner");
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`p-4 cursor-pointer transition-all duration-300 flex items-center gap-3 border-b border-white/5 last:border-0 hover:bg-white/5 animate-slide-right
                  ${activeId === c.id ? "bg-white/10 border-l-4 border-l-primary shadow-inner" : "border-l-4 border-l-transparent hover:pl-5"}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-glow-sm shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className={`font-semibold truncate pr-2 ${activeId === c.id ? 'text-primary' : 'text-foreground'}`}>{displayName}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{time}</div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {c.last_message || <span className="italic opacity-70">No messages yet</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
