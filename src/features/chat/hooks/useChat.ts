import { useCallback, useContext, useMemo, useRef, useState } from "react";
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
import {
  sanitizeChatContactInfo,
  messageHasNumericContent,
  numericHistoryKey,
  CHAT_NUMERIC_HISTORY_MAX,
  CHAT_NUMERIC_HISTORY_TTL_MS,
} from "../utils/chatContactSanitizer";
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
  const senderNumericHistoryRef = useRef<
    Map<string, { texts: string[]; updatedAt: number }>
  >(new Map());

  const getRecentSenderTexts = useCallback(
    (chatId: string, senderId: string): string[] => {
      const key = numericHistoryKey(chatId, senderId);
      const entry = senderNumericHistoryRef.current.get(key);
      if (!entry) return [];
      if (Date.now() - entry.updatedAt > CHAT_NUMERIC_HISTORY_TTL_MS) {
        senderNumericHistoryRef.current.delete(key);
        return [];
      }
      return [...entry.texts];
    },
    []
  );

  const recordSenderNumericMessage = useCallback(
    (chatId: string, senderId: string, rawContent: string) => {
      if (!messageHasNumericContent(rawContent)) return;
      const key = numericHistoryKey(chatId, senderId);
      const now = Date.now();
      const entry = senderNumericHistoryRef.current.get(key);
      const texts = entry?.texts ? [...entry.texts, rawContent] : [rawContent];
      if (texts.length > CHAT_NUMERIC_HISTORY_MAX) {
        texts.splice(0, texts.length - CHAT_NUMERIC_HISTORY_MAX);
      }
      senderNumericHistoryRef.current.set(key, { texts, updatedAt: now });
    },
    []
  );

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
        const recentSenderTexts = getRecentSenderTexts(chatId, userId);
        const { sanitized, hadContactInfo: had } = sanitizeChatContactInfo(
          content,
          { recentSenderTexts }
        );
        finalContent = sanitized;
        hadContactInfo = had;
        recordSenderNumericMessage(chatId, userId, content);
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

      // Si se detectó información de contacto, enviar advertencia de sistema
      if (hadContactInfo) {
        const sysMsg = await sendMessageService(
          chatId,
          userId,
          "⚠️ ServiSV bloqueó información de contacto en el mensaje anterior. Compartir números de teléfono, correos u otros datos para operar fuera de la plataforma infringe nuestras normas de uso y puede resultar en la suspensión de tu cuenta.",
          "system",
          null
        );
        if (sysMsg) {
          setMessagesByChatId((prev) => {
            const existing = prev[chatId] ?? [];
            if (existing.some((m) => m.id === sysMsg.id)) return prev;
            return { ...prev, [chatId]: [...existing, sysMsg] };
          });
        }
      }

      return { message: msg, hadContactInfo };
    },
    [userId, getRecentSenderTexts, recordSenderNumericMessage]
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
