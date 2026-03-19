import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Chat, ChatWithDetails, Message } from "@/common/types/chat";
import {
  getOrCreateChat as getOrCreateChatService,
  getChatsByUser,
  getChatsWithDetails,
  getChatById,
  getMessagesByChat,
  sendMessage as sendMessageService,
  markMessagesAsRead as markMessagesAsReadService,
} from "../services";
import { sanitizeChatContactInfo } from "../utils/chatContactSanitizer";
import { ChatContext } from "../context/chatContextRef";

export interface UseChatReturn {
  userId: string | null;
  chats: Chat[];
  chatsWithDetails: ChatWithDetails[];
  messagesByChatId: Record<string, Message[]>;
  loading: boolean;
  loadingChats: boolean;
  loadingMessages: boolean;
  getOrCreateChat: (
    clientId: string,
    professionalId: string,
    requestId?: string | null
  ) => Promise<Chat | null>;
  fetchChats: () => Promise<Chat[]>;
  fetchChatsWithDetails: () => Promise<ChatWithDetails[]>;
  getChatById: (chatId: string) => Promise<Chat | null>;
  fetchMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (
    chatId: string,
    content: string,
    type?: Message["type"],
    attachmentUrl?: string | null
  ) => Promise<{ message: Message | null; hadContactInfo: boolean }>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  totalUnreadCount: number;
  setMessagesForChat: (chatId: string, messages: Message[]) => void;
  subscribeToChat: (
    chatId: string,
    onMessage: (message: Message) => void
  ) => () => void;
}

/**
 * Hook que usa el estado compartido del ChatProvider cuando está disponible.
 * Debe usarse dentro de ChatProvider (ej. en layout protegido).
 */
export function useChat(): UseChatReturn {
  const ctx = useContext(ChatContext) as UseChatReturn | null;
  if (ctx) return ctx;
  return useChatState();
}

/**
 * Estado y lógica del chat (usado por ChatProvider para compartir estado).
 */
export function useChatState(): UseChatReturn {
  const { userId } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsWithDetails, setChatsWithDetails] = useState<ChatWithDetails[]>([]);
  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const getOrCreateChat = useCallback(
    async (
      clientId: string,
      professionalId: string,
      requestId?: string | null
    ): Promise<Chat | null> => {
      const chat = await getOrCreateChatService(
        clientId,
        professionalId,
        requestId ?? null
      );
      if (chat) {
        setChats((prev) => {
          if (prev.some((c) => c.id === chat.id)) return prev;
          return [chat, ...prev];
        });
      }
      return chat;
    },
    []
  );

  const fetchChats = useCallback(async (): Promise<Chat[]> => {
    if (!userId) return [];
    setLoadingChats(true);
    try {
      const list = await getChatsByUser(userId);
      setChats(list);
      return list;
    } finally {
      setLoadingChats(false);
    }
  }, [userId]);

  const fetchChatsWithDetails = useCallback(async (): Promise<ChatWithDetails[]> => {
    if (!userId) return [];
    setLoadingChats(true);
    try {
      const list = await getChatsWithDetails(userId);
      setChatsWithDetails(list);
      return list;
    } finally {
      setLoadingChats(false);
    }
  }, [userId]);

  const getChatByIdCb = useCallback(async (chatId: string): Promise<Chat | null> => {
    const chat = await getChatById(chatId);
    if (chat) {
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });
    }
    return chat;
  }, []);

  const fetchMessages = useCallback(
    async (chatId: string): Promise<Message[]> => {
      setLoadingMessages(true);
      try {
        const list = await getMessagesByChat(chatId);
        setMessagesByChatId((prev) => ({ ...prev, [chatId]: list }));
        return list;
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const setMessagesForChat = useCallback((chatId: string, messages: Message[]) => {
    setMessagesByChatId((prev) => ({ ...prev, [chatId]: messages }));
  }, []);

  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      type: Message["type"] = "text",
      attachmentUrl: string | null = null
    ): Promise<{ message: Message | null; hadContactInfo: boolean }> => {
      if (!userId) return { message: null, hadContactInfo: false };
      let finalContent = content;
      let hadContactInfo = false;
      if (type === "text" && content && content.trim()) {
        const { sanitized, hadContactInfo: had } = sanitizeChatContactInfo(content);
        finalContent = sanitized;
        hadContactInfo = had;
      }
      const msg = await sendMessageService(
        chatId,
        userId,
        finalContent,
        type,
        attachmentUrl
      );
      if (msg) {
        setMessagesByChatId((prev) => {
          const existing = prev[chatId] ?? [];
          if (existing.some((m) => m.id === msg.id)) return prev;
          return { ...prev, [chatId]: [...existing, msg] };
        });
      }
      return { message: msg, hadContactInfo };
    },
    [userId]
  );

  const markMessagesAsRead = useCallback(
    async (chatId: string): Promise<void> => {
      if (!userId) return;
      await markMessagesAsReadService(chatId, userId);
      setMessagesByChatId((prev) => {
        const list = prev[chatId] ?? [];
        return {
          ...prev,
          [chatId]: list.map((m) =>
            m.sender_id !== userId ? { ...m, is_read: true } : m
          ),
        };
      });
      setChatsWithDetails((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
      );
    },
    [userId]
  );

  const totalUnreadCount = useMemo(
    () => chatsWithDetails.reduce((s, c) => s + (c.unread_count ?? 0), 0),
    [chatsWithDetails]
  );

  const subscribeToChat = useCallback(
    (chatId: string, onMessage: (message: Message) => void): (() => void) => {
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const row = payload.new as any;
            const message: Message = {
              id: row.id,
              created_at: row.created_at,
              chat_id: row.chat_id,
              sender_id: row.sender_id,
              type: row.type,
              content: row.content ?? null,
              attachment_url: row.attachment_url ?? null,
              is_read: row.is_read ?? false,
            };
            setMessagesByChatId((prev) => {
              const existing = prev[chatId] ?? [];
              if (existing.some((m) => m.id === message.id)) return prev;
              return { ...prev, [chatId]: [...existing, message] };
            });
            onMessage(message);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const row = payload.new as any;
            setMessagesByChatId((prev) => {
              const list = prev[chatId] ?? [];
              const idx = list.findIndex((m) => m.id === row.id);
              if (idx === -1) return prev;
              const updated = [...list];
              updated[idx] = { ...updated[idx], is_read: row.is_read ?? false };
              return { ...prev, [chatId]: updated };
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    []
  );

  return {
    userId: userId ?? null,
    chats,
    chatsWithDetails,
    messagesByChatId,
    loading,
    loadingChats,
    loadingMessages,
    getOrCreateChat,
    fetchChats,
    fetchChatsWithDetails,
    getChatById: getChatByIdCb,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    totalUnreadCount,
    setMessagesForChat,
    subscribeToChat,
  };
}
