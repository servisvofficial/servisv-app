import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { ChatWithDetails } from "@/common/types/chat";
import { getChatsByUser } from "./get-chats-by-user";

/**
 * Obtiene los chats del usuario con título de solicitud, nombre del otro participante,
 * último mensaje y cantidad de no leídos.
 */
export async function getChatsWithDetails(
  userId: string
): Promise<ChatWithDetails[]> {
  const chats = await getChatsByUser(userId);
  if (chats.length === 0) return [];

  const requestIds = [...new Set(chats.map((c) => c.request_id).filter(Boolean))] as string[];
  const otherIds = [...new Set(chats.flatMap((c) => [c.client_id, c.professional_id]).filter((id) => id !== userId))];

  let requests: Record<string, { title: string; status: string; service_category?: string; subcategory?: string | null }> = {};
  let users: Record<string, { name: string; last_name?: string; profile_pic?: string | null }> = {};
  let lastMessages: Record<string, { content: string | null; created_at: string }> = {};
  let unreadCounts: Record<string, number> = {};

  if (requestIds.length > 0) {
    const { data: reqData } = await supabase
      .from("requests")
      .select("id, title, status, service_category, subcategory")
      .in("id", requestIds);
    if (reqData) {
      reqData.forEach((r: any) => {
        requests[r.id] = {
          title: r.title,
          status: r.status || "open",
          service_category: r.service_category,
          subcategory: r.subcategory ?? null,
        };
      });
    }
  }

  if (otherIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, last_name, profile_pic")
      .in("id", otherIds);
    if (usersData) {
      usersData.forEach((u: any) => {
        users[u.id] = {
          name: u.name || "",
          last_name: u.last_name,
          profile_pic: u.profile_pic ?? null,
        };
      });
    }
  }

  for (const chat of chats) {
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, created_at")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastMsg) {
      lastMessages[chat.id] = { content: lastMsg.content, created_at: lastMsg.created_at };
    }

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chat.id)
      .neq("sender_id", userId)
      .eq("is_read", false);
    unreadCounts[chat.id] = count ?? 0;
  }

  return chats.map((chat) => {
    const otherId = chat.client_id === userId ? chat.professional_id : chat.client_id;
    const u = users[otherId];
    const name = u ? `${u.name} ${u.last_name ?? ""}`.trim() : "Usuario";
    const profilePic = u?.profile_pic ?? null;
    const req = chat.request_id ? requests[chat.request_id] : undefined;
    const requestTitle = req?.title ?? null;
    const requestStatus = req?.status ?? null;
    const requestCategory =
      req?.service_category
        ? req.subcategory
          ? `${req.service_category} • ${req.subcategory}`
          : req.service_category
        : null;
    const last = lastMessages[chat.id];

    return {
      ...chat,
      request_title: requestTitle,
      request_status: requestStatus as ChatWithDetails["request_status"],
      request_category: requestCategory,
      other_participant_id: otherId,
      other_participant_name: name,
      other_participant_profile_pic: profilePic,
      last_message_content: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
      unread_count: unreadCounts[chat.id] ?? 0,
    };
  });
}
