import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import { supabaseRealtime } from "@/services/chatRealtime";

const ChatPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = Number(localStorage.getItem("user_id"));

  /* LOAD CHAT */
  useEffect(() => {
    const loadChat = async () => {
      try {
        const chatRes = await api.get(`/chats/booking/${bookingId}`);
        setChatId(String(chatRes.data.id));

        const msgRes = await api.get(`/chats/messages/${chatRes.data.id}`);
        setMessages(msgRes.data);
      } catch {
        alert("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [bookingId]);

  /* REALTIME */
  useEffect(() => {
    if (!chatId) return;

    const channel = supabaseRealtime
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id)
              ? prev
              : [...prev, payload.new]
          );
        }
      )
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [chatId]);

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* SEND */
  const sendMessage = async () => {
    if (!text.trim() || !chatId) return;

    try {
      await api.post("/chats/send", {
        chat_id: chatId,
        content: text,
      });
      setText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Send failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="pt-24 flex-1">
        <div className="container max-w-3xl h-full flex flex-col">
          <Card className="flex-1">
            <CardContent className="flex flex-col h-full p-4">
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground pt-10">
                    No messages yet
                  </div>
                )}

                {messages.map((msg) => {
                  const mine = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                          mine
                            ? "bg-primary text-white"
                            : "bg-secondary"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="pt-4 flex gap-2 border-t">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full border"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!text.trim()}>
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChatPage;
