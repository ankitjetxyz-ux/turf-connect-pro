import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role?: string;
  content: string;
  read?: boolean;
  created_at?: string;
};

export const useChat = (chatId: string | null | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!chatId || !content.trim()) return;

    setSending(true);
    const payload = { 
      sender_id: currentUserId, 
      sender_role: currentUserRole, 
      content 
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

  // Initial load and polling
  useEffect(() => {
    loadMessages();
    
    // Clear previous interval if exists
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Set new interval
    pollingRef.current = setInterval(() => loadMessages(true), 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadMessages]);

  return { 
    messages, 
    loading, 
    sending, 
    error, 
    sendMessage, 
    refreshMessages: () => loadMessages(true),
    currentUserId 
  };
};
