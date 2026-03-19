import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/common/providers/ThemeProvider';
import { useChat } from '@/features/chat';
import { Skeleton } from '@/common/components/Skeleton';
import type { ChatWithDetails } from '@/common/types/chat';

type TabKey = 'aceptadas' | 'pendientes' | 'completadas';

function filterChatsByTab(chats: ChatWithDetails[], tab: TabKey): ChatWithDetails[] {
  if (tab === 'aceptadas') {
    return chats.filter((c) => c.request_status === 'accepted' || c.request_status === 'in_progress');
  }
  if (tab === 'pendientes') {
    return chats.filter(
      (c) =>
        !c.request_status ||
        c.request_status === 'open' ||
        c.request_status === 'quoted' ||
        c.request_status === 'cancelled'
    );
  }
  if (tab === 'completadas') {
    return chats.filter((c) => c.request_status === 'completed');
  }
  return chats;
}

function formatChatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || '?';
}

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    userId,
    chatsWithDetails,
    loadingChats,
    fetchChatsWithDetails,
  } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [tabActivo, setTabActivo] = useState<TabKey>('aceptadas');

  const chatsAceptadas = useMemo(
    () => filterChatsByTab(chatsWithDetails, 'aceptadas'),
    [chatsWithDetails]
  );
  const chatsPendientes = useMemo(
    () => filterChatsByTab(chatsWithDetails, 'pendientes'),
    [chatsWithDetails]
  );
  const chatsCompletadas = useMemo(
    () => filterChatsByTab(chatsWithDetails, 'completadas'),
    [chatsWithDetails]
  );

  const tabs = useMemo(
    () => [
      { key: 'aceptadas' as const, label: 'Aceptadas', count: chatsAceptadas.length },
      { key: 'pendientes' as const, label: 'Pendientes', count: chatsPendientes.length },
      { key: 'completadas' as const, label: 'Completadas', count: chatsCompletadas.length },
    ],
    [chatsAceptadas.length, chatsPendientes.length, chatsCompletadas.length]
  );

  const chatsFiltrados = useMemo(() => {
    switch (tabActivo) {
      case 'aceptadas':
        return chatsAceptadas;
      case 'pendientes':
        return chatsPendientes;
      case 'completadas':
        return chatsCompletadas;
      default:
        return chatsWithDetails;
    }
  }, [tabActivo, chatsAceptadas, chatsPendientes, chatsCompletadas, chatsWithDetails]);

  const load = useCallback(async () => {
    await fetchChatsWithDetails();
  }, [fetchChatsWithDetails]);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId, load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  if (!userId) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ color: colors.textSecondary }}>
            Inicia sesión para ver tus chats.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <LinearGradient
          colors={['#4F46E5', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingTop: insets.top, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-center px-5 pb-4">
            <Text className="text-2xl font-bold text-white">Mis Chats</Text>
          </View>
        </LinearGradient>

        {/* Tabs Aceptadas / Pendientes / Completadas */}
        <View
          className="flex-row px-5 pt-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 items-center pb-3"
              onPress={() => setTabActivo(tab.key)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text
                  className={`text-sm font-semibold ${
                    tabActivo === tab.key ? 'text-purple-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${
                      tabActivo === tab.key ? 'bg-purple-100' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        tabActivo === tab.key ? 'text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
              {tabActivo === tab.key && (
                <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
          refreshControl={
            <RefreshControl refreshing={refreshing || loadingChats} onRefresh={onRefresh} />
          }
        >
          {loadingChats ? (
            <View className="py-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View
                  key={i}
                  className="px-5 py-4 flex-row items-center border-b"
                  style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}
                >
                  <Skeleton width={56} height={56} borderRadius={28} />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Skeleton width="60%" height={16} borderRadius={6} />
                      <Skeleton width={48} height={12} borderRadius={4} />
                    </View>
                    <Skeleton width="90%" height={14} borderRadius={6} />
                    <View className="flex-row gap-2 mt-2">
                      <Skeleton width={80} height={22} borderRadius={11} />
                      <Skeleton width={100} height={22} borderRadius={11} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : chatsFiltrados.length === 0 ? (
            <View className="items-center justify-center py-20">
              <MaterialIcons name="chat-bubble-outline" size={64} color={colors.textSecondary} />
              <Text className="text-lg mt-4" style={{ color: colors.textSecondary }}>
                No tienes conversaciones {tabActivo}
              </Text>
              <Text className="text-sm mt-2 text-center px-6" style={{ color: colors.textSecondary }}>
                {tabActivo === 'pendientes'
                  ? 'Las solicitudes pendientes aparecerán aquí'
                  : tabActivo === 'completadas'
                    ? 'Las conversaciones completadas aparecerán aquí'
                    : 'Inicia una conversación con un proveedor o acepta un presupuesto.'}
              </Text>
            </View>
          ) : (
            <View className="py-2">
              {chatsFiltrados.map((chat: ChatWithDetails) => (
                <TouchableOpacity
                  key={chat.id}
                  className="px-5 py-4 flex-row items-center border-b"
                  style={{
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border,
                  }}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(protected)/(mainTabs)/chats/${chat.id}` as any)}
                >
                  <View className="relative mr-3">
                    {chat.other_participant_profile_pic ? (
                      <Image
                        source={{ uri: chat.other_participant_profile_pic }}
                        className="w-14 h-14 rounded-full bg-gray-200"
                        style={{ width: 56, height: 56 }}
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
                        <Text className="text-white font-semibold text-base">
                          {initials(chat.other_participant_name)}
                        </Text>
                      </View>
                    )}
                    {chat.unread_count > 0 && (
                      <View className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-purple-500 items-center justify-center px-1">
                        <Text className="text-white text-xs font-bold">
                          {chat.unread_count > 99 ? '99+' : chat.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                        {chat.other_participant_name}
                      </Text>
                      <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                        {formatChatDate(chat.last_message_at ?? chat.updated_at)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-sm flex-1"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        {chat.last_message_content || 'Sin mensajes'}
                      </Text>
                    </View>
                    {(chat.request_title || chat.request_category) && (
                      <View className="mt-1 flex-row flex-wrap gap-1">
                        {chat.request_title && (
                          <View className="px-3 py-1 bg-purple-50 rounded-full">
                            <Text className="text-xs text-purple-700 font-medium" numberOfLines={1}>
                              {chat.request_title}
                            </Text>
                          </View>
                        )}
                        {chat.request_category && (
                          <View className="px-3 py-1 bg-gray-100 rounded-full">
                            <Text className="text-xs text-gray-600 font-medium" numberOfLines={1}>
                              {chat.request_category}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
