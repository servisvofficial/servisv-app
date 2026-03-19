import React, { useContext, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { supabase } from "@/common/lib/supabase/supabaseClient";
import { useChatState } from "../hooks/useChat";
import type { UseChatReturn } from "../hooks/useChat";
import { ChatContext } from "./chatContextRef";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const value = useChatState();
  const appState = useRef(AppState.currentState);

  // Cargar chats en cuanto hay userId (global, sin tener que abrir la pestaña Chats)
  useEffect(() => {
    if (value.userId) {
      value.fetchChatsWithDetails();
    }
  }, [value.userId]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchChatsWithDetails es estable

  // Refrescar no leídos cuando la app vuelve al frente (para que el puntito sea global)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active" && value.userId) {
        value.fetchChatsWithDetails();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [value.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tiempo real: cuando llega un mensaje (y no es tuyo), refrescar lista para que el badge aparezca en cualquier tab
  useEffect(() => {
    if (!value.userId) return;

    const channel = supabase
      .channel("global-new-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as { sender_id?: string };
          if (row.sender_id && row.sender_id !== value.userId) {
            value.fetchChatsWithDetails();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [value.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChatContext.Provider value={value as unknown}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): UseChatReturn | null {
  return useContext(ChatContext);
}
