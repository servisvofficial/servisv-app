import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useChat } from "@/features/chat";
import { supabase } from "@/common/lib/supabase/supabaseClient";
import useSupabaseStorage from "@/common/hooks/useSupabaseStorage";
import { Skeleton } from "@/common/components/Skeleton";
import type { Chat, Message } from "@/common/types/chat";

// Mismo bucket que onboarding, crear-solicitud y perfil (documents)
const CHAT_FILES_BUCKET = "documents";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(s => s[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Nombre a mostrar para un mensaje tipo file: content, o extraído de la URL, o "Ver archivo". */
function getFileMessageDisplayName(msg: Message): string {
  if (msg.content && msg.content !== "Archivo adjunto") {
    return msg.content;
  }
  if (msg.attachment_url) {
    try {
      const path = new URL(msg.attachment_url).pathname;
      const segment = path.split("/").filter(Boolean).pop();
      if (segment) return decodeURIComponent(segment);
    } catch {
      // ignore
    }
  }
  return "Ver archivo";
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ chatId: string }>();
  const chatId =
    typeof params.chatId === "string" ? params.chatId : params.chatId?.[0];

  const [inputText, setInputText] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("Usuario");
  const [otherProfilePic, setOtherProfilePic] = useState<string | null>(null);
  const [requestTitle, setRequestTitle] = useState<string | null>(null);
  const [requestCategory, setRequestCategory] = useState<string | null>(null);

  const {
    userId,
    messagesByChatId,
    loadingMessages,
    getChatById,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToChat,
  } = useChat();

  const {
    handleUploadImage,
    handleUploadDocument,
    isLoading: isUploading,
  } = useSupabaseStorage(CHAT_FILES_BUCKET);

  const messages: Message[] = chatId ? (messagesByChatId[chatId] ?? []) : [];
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll al último mensaje al cargar o al llegar mensajes nuevos
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(t);
  }, [messages.length, messages[messages.length - 1]?.id]);

  // Cargar datos del chat (sin marcar como leído aquí)
  useEffect(() => {
    if (!chatId || !userId) {
      setIsInitialLoading(false);
      return;
    }

    (async () => {
      const c = await getChatById(chatId);
      setChat(c ?? null);
        if (c) {
        const otherId =
          c.client_id === userId ? c.professional_id : c.client_id;
        setOtherParticipantId(otherId);
        const { data: userRow } = await supabase
          .from("users")
          .select("name, last_name, profile_pic")
          .eq("id", otherId)
          .single();
        if (userRow) {
          setOtherName(
            `${userRow.name ?? ""} ${userRow.last_name ?? ""}`.trim() ||
              "Usuario"
          );
          setOtherProfilePic(userRow.profile_pic ?? null);
        }
        if (c.request_id) {
          const { data: reqRow } = await supabase
            .from("requests")
            .select("title, service_category, subcategory")
            .eq("id", c.request_id)
            .single();
          if (reqRow) {
            setRequestTitle(reqRow.title ?? null);
            setRequestCategory(
              reqRow.service_category
                ? reqRow.subcategory
                  ? `${reqRow.service_category} • ${reqRow.subcategory}`
                  : reqRow.service_category
                : null
            );
          } else {
            setRequestTitle(null);
            setRequestCategory(null);
          }
        } else {
          setRequestTitle(null);
          setRequestCategory(null);
        }
      }

      await fetchMessages(chatId);
      setIsInitialLoading(false);
    })();
  }, [chatId, userId, getChatById, fetchMessages]);

  // Solo marcar como leído cuando la pantalla está enfocada (visible).
  useFocusEffect(
    useCallback(() => {
      if (!chatId || !userId) return;

      markMessagesAsRead(chatId);
      const unsub = subscribeToChat(chatId, () => {
        markMessagesAsRead(chatId);
      });

      return () => unsub();
    }, [chatId, userId, markMessagesAsRead, subscribeToChat])
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !chatId) return;
    setInputText("");
    const { hadContactInfo } = await sendMessage(chatId, text);
    if (hadContactInfo) {
      Alert.alert(
        "Información de contacto ocultada",
        "Se ha ocultado datos de contacto para mantener la conversación en la plataforma."
      );
    }
  }, [inputText, chatId, sendMessage]);

  const handleAttachImage = useCallback(async () => {
    if (!userId || !chatId || isUploading) return;
    const url = await handleUploadImage(userId, chatId);
    if (url) await sendMessage(chatId, "", "image", url);
  }, [userId, chatId, isUploading, handleUploadImage, sendMessage]);

  const handleAttachFile = useCallback(async () => {
    if (!userId || !chatId || isUploading) return;
    const result = await handleUploadDocument(userId, chatId);
    if (result) await sendMessage(chatId, result.fileName, "file", result.url);
  }, [userId, chatId, isUploading, handleUploadDocument, sendMessage]);

  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  if (!chatId) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.textSecondary }}>Chat no encontrado</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header */}
      <View 
          className="flex-row items-center border-b px-4 py-3"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
          {isInitialLoading ? (
            <View className="flex-row items-center flex-1">
              <Skeleton width={40} height={40} borderRadius={20} />
              <View className="flex-1 ml-3">
                <Skeleton width={120} height={16} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width={180} height={12} borderRadius={6} />
          </View>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row items-center flex-1"
              onPress={() => {
                if (otherParticipantId) {
                  router.push({
                    pathname: "/(protected)/(mainTabs)/servicios/perfil-proveedor",
                    params: { providerId: otherParticipantId },
                  } as any);
                }
              }}
              activeOpacity={0.7}
              disabled={!otherParticipantId}
            >
              {otherProfilePic ? (
                <Image
                  source={{ uri: otherProfilePic }}
                  className="w-10 h-10 rounded-full mr-3 bg-gray-200"
                  style={{ width: 40, height: 40 }}
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                  <Text className="text-white font-semibold text-sm">
                    {initials(otherName)}
              </Text>
            </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {otherName}
                </Text>
                {requestTitle && (
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {requestTitle}
                  </Text>
                )}
                {requestCategory && (
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {requestCategory}
                  </Text>
                )}
              </View>
          </TouchableOpacity>
          )}
      </View>

        {/* Mensajes + Input con teclado */}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={{ flex: 1 }}
        >
      <ScrollView 
            ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 4 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {loadingMessages && messages.length === 0 ? (
              <View className="px-4 pt-4">
                <View className="flex-row justify-start mb-4">
                  <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                  <Skeleton width={180} height={44} borderRadius={22} />
                </View>
                <View className="flex-row justify-end mb-4">
                  <Skeleton width={200} height={44} borderRadius={22} />
                </View>
                <View className="flex-row justify-start mb-4">
                  <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                  <Skeleton width={140} height={44} borderRadius={22} />
                </View>
                <View className="flex-row justify-end mb-4">
                  <Skeleton width={160} height={44} borderRadius={22} />
          </View>
        </View>
            ) : messages.length === 0 ? (
              <View className="py-8 items-center">
                <Text style={{ color: colors.textSecondary }}>
                  Sin mensajes. Envía el primero.
                </Text>
              </View>
            ) : (
              messages.map(msg => {
                const isSent = msg.sender_id === userId;
                return (
                  <View
                    key={msg.id}
                    className={`mb-4 flex-row ${isSent ? "justify-end" : "justify-start"}`}
                  >
                    {!isSent &&
                      (otherProfilePic ? (
                        <Image
                          source={{ uri: otherProfilePic }}
                          className="w-8 h-8 rounded-full mr-2 mt-1 bg-gray-200"
                          style={{ width: 32, height: 32 }}
                        />
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2 mt-1">
                          <Text className="text-blue-600 font-semibold text-xs">
                            {initials(otherName)}
                          </Text>
                        </View>
                      ))}
                    <View
                      className={`max-w-[75%] ${isSent ? "items-end" : "items-start"}`}
                    >
              <View
                        className={`rounded-2xl overflow-hidden ${
                          msg.type === "text" || (msg.type !== "image" && msg.type !== "file")
                            ? "px-4 py-3"
                            : "p-1"
                        } ${
                          isSent ? "rounded-tr-sm" : "rounded-tl-sm"
                        }`}
                        style={isSent ? {} : { backgroundColor: colors.border }}
                      >
                        {isSent ? (
                  <LinearGradient
                            colors={["#4F46E5", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                              position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      borderRadius: 16,
                    }}
                  />
                ) : null}
                        {msg.type === "image" && msg.attachment_url ? (
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setImagePreviewUri(msg.attachment_url!)}
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            <Image
                              source={{ uri: msg.attachment_url }}
                              style={{ width: 200, height: 200, borderRadius: 12 }}
                              resizeMode="cover"
                            />
                            {msg.content ? (
                              <Text
                                className="text-sm mt-2"
                                style={{ color: isSent ? "#FFFFFF" : colors.text }}
                              >
                                {msg.content}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        ) : msg.type === "file" && msg.attachment_url ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => Linking.openURL(msg.attachment_url!)}
                            className="flex-row items-center py-2 px-2"
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            <MaterialIcons
                              name="insert-drive-file"
                              size={24}
                              color={isSent ? "#FFFFFF" : colors.text}
                            />
                            <Text
                              className="text-sm ml-2 flex-1"
                              style={{ color: isSent ? "#FFFFFF" : colors.text }}
                              numberOfLines={1}
                            >
                              {getFileMessageDisplayName(msg)}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                <Text
                            className="text-sm"
                            style={{
                              color: isSent ? "#FFFFFF" : colors.text,
                              position: isSent ? "relative" : undefined,
                              zIndex: isSent ? 1 : undefined,
                            }}
                          >
                            {msg.content || ""}
                </Text>
                        )}
              </View>
                      <View
                        className={`flex-row items-center mt-1 ${isSent ? "flex-row-reverse" : ""}`}
                      >
                        <Text
                          className="text-xs mr-2"
                          style={{ color: colors.textSecondary }}
                        >
                          {formatTime(msg.created_at)}
                        </Text>
                        {isSent && msg.is_read && (
                          <MaterialIcons
                            name="done-all"
                            size={14}
                            color="#4F46E5"
                          />
                )}
              </View>
            </View>
          </View>
                );
              })
            )}
      </ScrollView>

          {/* Input (queda arriba del teclado gracias a KeyboardAvoidingView) */}
          <View
            className="px-4 py-3 border-t flex-row items-center"
            style={{
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 8),
            }}
          >
            {isUploading ? (
              <View className="w-10 h-10 items-center justify-center mr-1">
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleAttachImage}
                  disabled={!userId}
                  className="w-10 h-10 rounded-full items-center justify-center mr-1"
                  style={{ backgroundColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="image" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAttachFile}
                  disabled={!userId}
                  className="w-10 h-10 rounded-full items-center justify-center mr-1"
                  style={{ backgroundColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="attach-file" size={22} color={colors.text} />
          </TouchableOpacity>
              </>
            )}
          <TextInput
              className="flex-1 rounded-full text-sm mx-2"
            style={{ 
                backgroundColor: colors.border,
                color: colors.text,
              fontSize: 14,
                paddingVertical: 10,
              paddingHorizontal: 16,
                minHeight: Platform.OS === "ios" ? 40 : 44,
            }}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              maxLength={500}
          />
          <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 rounded-full overflow-hidden">
              <LinearGradient
                  colors={
                    inputText.trim()
                      ? ["#4F46E5", "#EC4899"]
                      : [colors.border, colors.border]
                  }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </View>

      {/* Modal para ver imagen a pantalla completa */}
      <Modal
        visible={!!imagePreviewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreviewUri(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
          onPress={() => setImagePreviewUri(null)}
        >
          <Pressable onPress={e => e.stopPropagation()} style={{ flex: 1, width: "100%", justifyContent: "center" }}>
            {imagePreviewUri ? (
              <Image
                source={{ uri: imagePreviewUri }}
                style={{
                  width: Dimensions.get("window").width,
                  height: Dimensions.get("window").height - insets.top - insets.bottom,
                }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
          <TouchableOpacity
            onPress={() => setImagePreviewUri(null)}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}
