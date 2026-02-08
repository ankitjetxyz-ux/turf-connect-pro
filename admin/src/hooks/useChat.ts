import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import type { Socket } from 'socket.io-client';

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role?: string;
  content: string;
  read?: boolean;      // legacy schema flag
  is_read?: boolean;   // new schema flag
  created_at?: string;
};

export const useChat = (chatId: string | null | undefined, externalSocket?: Socket | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUserId = localStorage.getItem("user_id");
  const currentUserRole = localStorage.getItem("role") || "player";

  const loadMessages = useCallback(async (silent = false) => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    
    if (!silent) setLoading(true);
    
    try {
      const res = await api.get(`/chat/${chatId}/messages`);
      setMessages(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load messages", err);
      setError("Failed to load messages");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [chatId]);

  const sendMessage = async (content: string) => {
    if (!chatId || !content.trim()) return false;

    if (!currentUserId) {
      setError("User ID not found. Please log in again.");
      return false;
    }

    setSending(true);
    const payload = { 
      content,
    };

    try {
      const res = await api.post(`/chat/${chatId}/message`, payload);
      if (res.status === 200 || res.status === 201) {
        // Optimistically add message or just refresh
        await loadMessages(true);
        return true;
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setError("Failed to send message");
      return false;
    } finally {
      setSending(false);
    }
  };

  // Attach to an existing Socket.IO connection: join chat room & listen for realtime events
  useEffect(() => {
    if (!chatId || !externalSocket) return;

    socketRef.current = externalSocket;

    externalSocket.emit("join_chat", chatId);

    const handleReceive = (msg: Message) => {
      if (msg.chat_id === chatId) {
        setMessages((prev) => {
          // Avoid duplicates if the message is already in the list
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = ({ chatId: incomingChatId, userId: typingUserId }: { chatId: string; userId: string }) => {
      if (incomingChatId === chatId && typingUserId !== currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    };

    externalSocket.on("receive_message", handleReceive);
    externalSocket.on("typing", handleTyping);

    return () => {
      externalSocket.off("receive_message", handleReceive);
      externalSocket.off("typing", handleTyping);
    };
  }, [chatId, currentUserId, externalSocket]);

  // Initial load and polling as a safety net (in case of missed socket events)
  useEffect(() => {
    loadMessages();
    
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(true), 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadMessages]);

  return { 
    messages, 
    loading, 
    sending, 
    error, 
    isTyping,
    sendMessage, 
    refreshMessages: () => loadMessages(true),
    currentUserId,
    socket: socketRef.current,
  };
};
