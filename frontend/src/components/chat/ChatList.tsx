import { useMemo, useState, useRef, useEffect } from "react";
import { Conversation } from "@/pages/ChatPage";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Star, StarOff } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const ChatList = ({ 
  conversations = [], 
  onSelect, 
  activeId,
  onRefresh 
}: { 
  conversations?: Conversation[]; 
  onSelect: (id: string) => void; 
  activeId?: string | null;
  onRefresh?: () => void;
}) => {
  const items = useMemo(() => conversations || [], [conversations]);
  const currentUserId = localStorage.getItem("user_id");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { toast } = useToast();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const handleToggleFavorite = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/chat/${chatId}/favorite`);
      toast({
        title: "Success",
        description: "Favorite status updated",
      });
      if (onRefresh) onRefresh();
      setOpenMenuId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full" />
          Chats
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden" style={{ minHeight: 0 }}>
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
            const profileImage = c.other_user?.profile_image_url || null;

            return (
              <div
                key={c.id}
                onClick={() => {
                  setOpenMenuId(null);
                  onSelect(c.id);
                }}
                className={`p-4 cursor-pointer transition-all duration-300 flex items-center gap-3 border-b border-white/5 last:border-0 hover:bg-white/5 animate-slide-right relative
                  ${activeId === c.id ? "bg-white/10 border-l-4 border-l-primary shadow-inner" : "border-l-4 border-l-transparent hover:pl-5"}
                  ${c.is_favorite ? "bg-primary/5" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {c.is_favorite && (
                  <div className="absolute top-2 left-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                
                <Avatar className={`w-12 h-12 shadow-glow-sm shrink-0 ${c.is_favorite ? 'ring-2 ring-yellow-400/50' : ''}`}>
                  {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
                  <AvatarFallback className="gradient-primary text-white font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className={`font-semibold truncate pr-2 flex items-center gap-1 ${activeId === c.id ? 'text-primary' : 'text-foreground'}`}>
                      {displayName}
                      {c.is_favorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{time}</div>
                      <div className="relative" ref={(el) => (menuRefs.current[c.id] = el)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === c.id ? null : c.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        
                        {openMenuId === c.id && (
                          <div className="absolute right-0 top-8 bg-background border border-white/10 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
                            <button
                              onClick={(e) => handleToggleFavorite(c.id, e)}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-white/5 flex items-center gap-2 transition-colors"
                            >
                              {c.is_favorite ? (
                                <>
                                  <StarOff className="w-4 h-4" />
                                  Remove Favorite
                                </>
                              ) : (
                                <>
                                  <Star className="w-4 h-4" />
                                  Add Favorite
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
