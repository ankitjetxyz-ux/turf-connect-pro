import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import ChatList from "@/components/chat/ChatList";
import MessageWindow from "@/components/chat/MessageWindow";
import { io, Socket } from "socket.io-client";

export type Conversation = {
  id: string;
  owner_id: string;
  player_id: string;
  last_message?: string;
  updated_at?: string;
  other_user?: {
    name: string;
    email: string;
    profile_image_url?: string | null;
  };
};

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);



  const loadConversations = useCallback(async () => {
    try {
      // Backend derives user from JWT; no path param is required here
      const res = await api.get("/chat/conversations");
      const items = Array.isArray(res.data) ? res.data : [];
      setConversations(items);
    } catch (error) {
      console.error("Failed to load conversations", error);
      setConversations([]);
    }
  }, []);
  useEffect(() => {
    // Connect Socket.IO (shared instance for the whole chat page)
    const s = io("http://localhost:8080");
    setSocket(s);

    s.on("connect", () => {
      console.log("Socket connected");
    });

    s.on("receive_message", (msg: unknown) => {
      console.log("New message received:", msg);
      loadConversations();
    });

    return () => {
      s.disconnect();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (activeChat && socket) {
      socket.emit("join_chat", activeChat);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatParam = params.get("chat");
    if (chatParam) setActiveChat(chatParam);

    loadConversations();
  }, [loadConversations]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 flex flex-col pt-20 pb-6 container mx-auto px-4 h-[calc(100vh-80px)] relative z-10">
        <div className="flex-1 glass-card border border-white/10 rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in duration-500 backdrop-blur-md" style={{ height: 'calc(100vh - 104px)' }}>

          {/* Chat List Sidebar */}
          <div className={`md:col-span-1 lg:col-span-1 border-r border-white/10 bg-secondary/20 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
            <ChatList
              conversations={conversations}
              onSelect={(id) => setActiveChat(id)}
              activeId={activeChat}
              onRefresh={loadConversations}
            />
          </div>

          {/* Message Window */}
          <div className={`md:col-span-2 lg:col-span-3 flex flex-col bg-background/40 backdrop-blur-sm ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
            {activeChat ? (
              <MessageWindow
                chatId={activeChat}
                onBack={() => setActiveChat(null)}
                conversation={conversations.find(c => c.id === activeChat)}
                socket={socket}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-fade-in">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary opacity-80"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2 text-foreground">Select a conversation</h3>
                <p className="text-muted-foreground max-w-sm">Choose a chat from the left sidebar to start messaging with turf owners or players.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div >
  );
};

export default ChatPage;
