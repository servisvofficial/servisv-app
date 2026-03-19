import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { useTheme } from "@/common/providers/ThemeProvider";
import {
  useRequestDetail,
  useRequestQuotes,
  acceptQuote,
  rejectQuote,
  updateRequestStatus,
} from "@/features/solicitudes";
import { RequestStatusBadge } from "@/features/solicitudes/components/RequestStatusBadge";
import { ImageGallery } from "@/common/components/ImageGallery";
import {
  PaymentModal,
  type PaymentModalPayload,
} from "@/common/components/PaymentModal";
import { ReportModal } from "@/common/components/ReportModal";
import { getCategoryIcon } from "@/common/utils/categoryIcons";
import { supabase } from "@/common/lib/supabase/supabaseClient";

export default function DetalleSolicitudScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { userId } = useAuth();

  // Obtener el ID de la solicitud desde los parámetros
  const requestId = params.requestId as string;

  // Obtener detalle de la solicitud
  const {
    data: solicitud,
    isLoading: isLoadingRequest,
    refetch: refetchRequest,
  } = useRequestDetail(requestId);

  // Verificar si el usuario actual es el dueño de la solicitud
  const isOwner = solicitud?.client?.id === userId;

  // Obtener cotizaciones SOLO si es el dueño de la solicitud
  const {
    data: propuestas = [],
    isLoading: isLoadingQuotes,
    refetch: refetchQuotes,
  } = useRequestQuotes(requestId);

  // Estado para el visor de imágenes
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  // Estado de facturación por quote (si tiene billing = ya pagado o en proceso)
  const [billingStatuses, setBillingStatuses] = useState<
    Record<string, boolean>
  >({});
  const [isUpdatingQuote, setIsUpdatingQuote] = useState(false);
  // Modal de pago: quote seleccionada para pagar y email del comprador
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedQuoteForPayment, setSelectedQuoteForPayment] =
    useState<PaymentModalPayload | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  // Reseñas: solo visibles cuando ambas partes han calificado (is_visible en DB)
  const [existingReviews, setExistingReviews] = useState<
    Array<{
      request_id: string;
      reviewer_id: string;
      reviewed_id: string;
      is_visible?: boolean;
    }>
  >([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewingUserId, setReviewingUserId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCompletingRequest, setIsCompletingRequest] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Filtrar propuestas: si es el dueño (cliente) muestra todas; si no, no muestra lista pero usamos acceptedQuote si existe
  const propuestasToShow = isOwner ? propuestas : [];
  const acceptedQuote = propuestas.find(q => q.status === "accepted");

  // Cargar billing por quote aceptada para saber si mostrar "Pagar servicio"
  useEffect(() => {
    if (!requestId || propuestasToShow.length === 0) return;
    const checkBilling = async () => {
      const statuses: Record<string, boolean> = {};
      for (const quote of propuestasToShow.filter(
        q => q.status === "accepted"
      )) {
        const { data: allBillings } = await supabase
          .from("billing")
          .select("id, quote_id")
          .eq("quote_id", quote.id);
        statuses[quote.id] = !!(allBillings && allBillings.length > 0);
      }
      setBillingStatuses(statuses);
    };
    checkBilling();
  }, [requestId, propuestasToShow.map(p => `${p.id}-${p.status}`).join(",")]);

  // Cargar email del comprador (dueño de la solicitud) para el modal de pago
  useEffect(() => {
    const buyerId = solicitud?.client?.id;
    if (!buyerId) return;
    const loadBuyerEmail = async () => {
      const { data } = await supabase
        .from("users")
        .select("email")
        .eq("id", buyerId)
        .single();
      if (data?.email) setBuyerEmail(data.email);
    };
    loadBuyerEmail();
  }, [solicitud?.client?.id]);

  // Cargar reseñas existentes para esta solicitud (para saber si ya calificó cada uno)
  useEffect(() => {
    if (!requestId || !userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("request_id, reviewer_id, reviewed_id, is_visible")
        .eq("request_id", requestId);
      setExistingReviews(data || []);
    };
    load();
  }, [requestId, userId]);

  // Lógica de reseñas (como en la web: cada uno califica, la review solo aparece cuando ambos han calificado)
  const canReview = solicitud?.status === "completed" && acceptedQuote;
  const hasReviewedProvider = existingReviews.some(
    r =>
      r.reviewer_id === userId &&
      r.reviewed_id === acceptedQuote?.providerId &&
      r.request_id === requestId
  );
  const hasReviewedClient = existingReviews.some(
    r =>
      r.reviewer_id === userId &&
      r.reviewed_id === solicitud?.client?.id &&
      r.request_id === requestId
  );
  const canClientReviewProvider = canReview && isOwner && !hasReviewedProvider;
  const canProviderReviewClient =
    canReview && acceptedQuote?.providerId === userId && !hasReviewedClient;

  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Fecha no disponible";
    }
  };

  const goToProviderProfile = (providerId: string) => {
    router.push({
      pathname: "/(protected)/(mainTabs)/servicios/perfil-proveedor",
      params: { providerId },
    } as any);
  };

  const handleAcceptQuote = (quoteId: string, providerName: string) => {
    Alert.alert(
      "Aceptar presupuesto",
      `¿Estás seguro de que quieres aceptar el presupuesto de ${providerName}? Esta acción rechazará automáticamente los demás presupuestos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceptar",
          onPress: async () => {
            if (!requestId) return;
            setIsUpdatingQuote(true);
            try {
              await acceptQuote(quoteId, requestId);
              await refetchQuotes();
              await refetchRequest();
            } catch (e) {
              console.error(e);
              Alert.alert(
                "Error",
                "No se pudo aceptar el presupuesto. Intenta de nuevo."
              );
            } finally {
              setIsUpdatingQuote(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectQuote = (quoteId: string, providerName: string) => {
    Alert.alert(
      "Rechazar presupuesto",
      `¿Estás seguro de que quieres rechazar el presupuesto de ${providerName}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            setIsUpdatingQuote(true);
            try {
              await rejectQuote(quoteId);
              await refetchQuotes();
            } catch (e) {
              console.error(e);
              Alert.alert(
                "Error",
                "No se pudo rechazar el presupuesto. Intenta de nuevo."
              );
            } finally {
              setIsUpdatingQuote(false);
            }
          },
        },
      ]
    );
  };

  if (isLoadingRequest) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text
            className="text-sm mt-4"
            style={{ color: colors.textSecondary }}
          >
            Cargando solicitud...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!solicitud) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <MaterialIcons
            name="error-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text
            className="text-lg font-semibold mt-4"
            style={{ color: colors.text }}
          >
            Solicitud no encontrada
          </Text>
          <TouchableOpacity
            className="mt-4 px-6 py-3 rounded-xl"
            style={{ backgroundColor: "#4F46E5" }}
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Volver</Text>
          </TouchableOpacity>
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
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            paddingTop: insets.top + 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Mi Solicitud
          </Text>
          <View className="flex-row gap-2">
            <RequestStatusBadge status={solicitud.status} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
          <View className="pt-6">
            <View className="px-5">
              {/* Categoría */}
              <View className="flex-row items-center mb-2">
                <MaterialIcons
                  name={getCategoryIcon(solicitud.serviceCategory)}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  className="text-sm ml-2"
                  style={{ color: colors.textSecondary }}
                >
                  {solicitud.serviceCategory}
                  {solicitud.subcategory && ` • ${solicitud.subcategory}`}
                </Text>
              </View>

              {/* Título */}
              <Text
                className="text-2xl font-bold mb-4"
                style={{ color: colors.text }}
              >
                {solicitud.title}
              </Text>

              {/* Descripción */}
              <Text
                className="text-base mb-6 leading-6"
                style={{ color: colors.text }}
              >
                {solicitud.description}
              </Text>

              {/* Info adicional */}
              <View className="mb-6 space-y-3">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="location-on"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    {typeof solicitud.location === "string"
                      ? solicitud.location
                      : solicitud.location.address}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    {solicitud.scheduledDate
                      ? `Programado: ${formatDate(solicitud.scheduledDate)}`
                      : `Creada: ${formatDate(solicitud.createdAt)}`}
                  </Text>
                </View>
                {solicitud.budgetRange && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="attach-money"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text
                      className="text-sm ml-2"
                      style={{ color: colors.text }}
                    >
                      Presupuesto: ${solicitud.budgetRange.min} - $
                      {solicitud.budgetRange.max}
                    </Text>
                  </View>
                )}
              </View>

              {/* Fotos */}
              {solicitud.photos && solicitud.photos.length > 0 && (
                <View className="mb-6">
                  <Text
                    className="text-sm font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Fotos Adjuntas ({solicitud.photos.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {solicitud.photos.map((photo, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedImageIndex(i)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: photo }}
                            className="w-24 h-24 rounded-xl"
                            style={{ backgroundColor: colors.border }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Visor de imágenes */}
              <ImageGallery
                images={solicitud.photos || []}
                visible={selectedImageIndex !== null}
                onClose={() => setSelectedImageIndex(null)}
                initialIndex={selectedImageIndex || 0}
              />

              {/* Propuestas recibidas para esta solicitud - Solo visible para el dueño */}
              {isOwner && (
                <View>
                  <Text
                    className="text-lg font-bold mb-4"
                    style={{ color: colors.text }}
                  >
                    Propuestas Recibidas ({propuestasToShow.length})
                  </Text>

                  {isLoadingQuotes ? (
                    <View className="items-center justify-center py-8">
                      <ActivityIndicator size="large" color="#4F46E5" />
                      <Text
                        className="mt-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Cargando propuestas...
                      </Text>
                    </View>
                  ) : propuestasToShow.length === 0 ? (
                    <View className="items-center justify-center py-8">
                      <MaterialIcons
                        name="description"
                        size={48}
                        color={colors.textSecondary}
                      />
                      <Text
                        className="mt-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Aún no has recibido presupuestos para esta solicitud.
                      </Text>
                    </View>
                  ) : (
                    propuestasToShow.map(propuesta => (
                      <View
                        key={propuesta.id}
                        className="mb-4 p-4 rounded-2xl border shadow-sm"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                      >
                        <TouchableOpacity
                          className="flex-row items-start mb-3"
                          activeOpacity={0.7}
                          onPress={() =>
                            goToProviderProfile(propuesta.providerId)
                          }
                        >
                          {propuesta.providerProfilePic ? (
                            <Image
                              source={{ uri: propuesta.providerProfilePic }}
                              className="w-12 h-12 rounded-full mr-3"
                              style={{ backgroundColor: colors.border }}
                            />
                          ) : (
                            <View
                              className="w-12 h-12 rounded-full items-center justify-center mr-3"
                              style={{ backgroundColor: "#4F46E5" }}
                            >
                              <Text className="text-white font-bold text-sm">
                                {propuesta.providerName
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </Text>
                            </View>
                          )}
                          <View className="flex-1">
                            <Text
                              className="text-base font-bold"
                              style={{ color: colors.text }}
                            >
                              {propuesta.providerName}
                            </Text>
                            {propuesta.isPriority && (
                              <View className="flex-row items-center mt-1">
                                <MaterialIcons
                                  name="star"
                                  size={14}
                                  color="#F59E0B"
                                />
                                <Text
                                  className="text-xs ml-1"
                                  style={{ color: colors.textSecondary }}
                                >
                                  Proveedor preferido
                                </Text>
                              </View>
                            )}
                          </View>
                          <View className="px-3 py-1 rounded-full overflow-hidden">
                            <LinearGradient
                              colors={["#4F46E5", "#EC4899"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                paddingVertical: 4,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                              }}
                            >
                              <Text className="text-white font-bold text-sm">
                                ${propuesta.price.toFixed(2)}
                              </Text>
                            </LinearGradient>
                          </View>
                        </TouchableOpacity>

                        <Text
                          className="text-sm mb-2 leading-5"
                          style={{ color: colors.text }}
                        >
                          {propuesta.description}
                        </Text>

                        {propuesta.estimatedDuration && (
                          <View className="flex-row items-center mb-2">
                            <MaterialIcons
                              name="schedule"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-xs ml-1"
                              style={{ color: colors.textSecondary }}
                            >
                              Duración estimada: {propuesta.estimatedDuration}
                            </Text>
                          </View>
                        )}

                        {propuesta.estimatedDate && (
                          <View className="flex-row items-center mb-4">
                            <MaterialIcons
                              name="calendar-today"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-xs ml-1"
                              style={{ color: colors.textSecondary }}
                            >
                              Fecha estimada:{" "}
                              {formatDate(propuesta.estimatedDate)}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row gap-2 mt-2">
                          {propuesta.status === "pending" && !acceptedQuote && (
                            <>
                              <TouchableOpacity
                                className="flex-1 rounded-xl overflow-hidden"
                                activeOpacity={0.8}
                                onPress={() =>
                                  handleAcceptQuote(
                                    propuesta.id,
                                    propuesta.providerName
                                  )
                                }
                                disabled={isUpdatingQuote}
                              >
                                <LinearGradient
                                  colors={["#4F46E5", "#EC4899"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                    paddingVertical: 12,
                                    alignItems: "center",
                                    borderRadius: 12,
                                  }}
                                >
                                  <Text className="text-white font-bold text-sm">
                                    Aceptar
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 px-4 py-3 rounded-xl border items-center"
                                style={{
                                  backgroundColor: colors.card,
                                  borderColor: colors.border,
                                }}
                                activeOpacity={0.7}
                                onPress={() =>
                                  handleRejectQuote(
                                    propuesta.id,
                                    propuesta.providerName
                                  )
                                }
                                disabled={isUpdatingQuote}
                              >
                                <Text
                                  className="font-semibold text-sm"
                                  style={{ color: colors.text }}
                                >
                                  Rechazar
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {propuesta.status === "accepted" &&
                            propuesta.id === acceptedQuote?.id &&
                            !billingStatuses[propuesta.id] &&
                            solicitud.status !== "in_progress" &&
                            solicitud.status !== "completed" && (
                              <TouchableOpacity
                                className="flex-1 rounded-xl overflow-hidden"
                                activeOpacity={0.8}
                                onPress={() => {
                                  setSelectedQuoteForPayment({
                                    quoteId: propuesta.id,
                                    requestId: requestId!,
                                    serviceAmount: propuesta.price,
                                    concept:
                                      propuesta.description || solicitud.title,
                                    buyerId: solicitud.client?.id ?? "",
                                    sellerId: propuesta.providerId,
                                  });
                                  setPaymentModalVisible(true);
                                }}
                              >
                                <LinearGradient
                                  colors={["#059669", "#10B981"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                    paddingVertical: 12,
                                    alignItems: "center",
                                    borderRadius: 12,
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 6,
                                  }}
                                >
                                  <MaterialIcons
                                    name="credit-card"
                                    size={18}
                                    color="#FFF"
                                  />
                                  <Text className="text-white font-bold text-sm">
                                    Pagar servicio
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            )}
                          {/* Marcar como completado: solo cliente, cuando está in_progress */}
                          {solicitud?.status === "in_progress" &&
                            propuesta.status === "accepted" &&
                            propuesta.id === acceptedQuote?.id &&
                            isOwner && (
                              <TouchableOpacity
                                className="flex-1 rounded-xl overflow-hidden"
                                activeOpacity={0.8}
                                onPress={() => {
                                  Alert.alert(
                                    "Marcar como completado",
                                    "¿Confirmas que el proveedor realizó el servicio? El pago será liberado al proveedor.",
                                    [
                                      { text: "Cancelar", style: "cancel" },
                                      {
                                        text: "Sí, completado",
                                        onPress: async () => {
                                          if (!requestId) return;
                                          setIsCompletingRequest(true);
                                          try {
                                            await updateRequestStatus(
                                              requestId,
                                              "completed"
                                            );
                                            Alert.alert(
                                              "Listo",
                                              "Servicio marcado como completado. El pago ha sido liberado al proveedor."
                                            );
                                            refetchRequest();
                                            refetchQuotes();
                                          } catch (e) {
                                            console.error(e);
                                            Alert.alert(
                                              "Error",
                                              "No se pudo completar. Intenta de nuevo."
                                            );
                                          } finally {
                                            setIsCompletingRequest(false);
                                          }
                                        },
                                      },
                                    ]
                                  );
                                }}
                                disabled={isCompletingRequest}
                              >
                                <LinearGradient
                                  colors={["#2563EB", "#4F46E5"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                    paddingVertical: 12,
                                    alignItems: "center",
                                    borderRadius: 12,
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 6,
                                  }}
                                >
                                  <MaterialIcons
                                    name="check-circle"
                                    size={18}
                                    color="#FFF"
                                  />
                                  <Text className="text-white font-bold text-sm">
                                    Marcar como completado
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            )}
                          {/* Dejar reseña: cliente al proveedor (solo cuando completado y no ha reseñado) */}
                          {canClientReviewProvider &&
                            propuesta.status === "accepted" &&
                            propuesta.id === acceptedQuote?.id && (
                              <TouchableOpacity
                                className="flex-1 px-4 py-3 rounded-xl border items-center flex-row justify-center gap-2"
                                style={{
                                  borderColor: "#A78BFA",
                                  backgroundColor: "rgba(167, 139, 250, 0.1)",
                                }}
                                onPress={() => {
                                  setReviewingUserId(propuesta.providerId);
                                  setIsReviewModalVisible(true);
                                }}
                              >
                                <MaterialIcons
                                  name="star"
                                  size={18}
                                  color="#7C3AED"
                                />
                                <Text
                                  className="font-semibold text-sm"
                                  style={{ color: "#7C3AED" }}
                                >
                                  Dejar reseña
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Dejar reseña al cliente: para el proveedor aceptado cuando la solicitud está completada */}
            {canProviderReviewClient && (
              <View
                className="mt-4 p-4 rounded-2xl border"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <TouchableOpacity
                  className="py-3 rounded-xl border flex-row items-center justify-center gap-2"
                  style={{
                    borderColor: "#A78BFA",
                    backgroundColor: "rgba(167, 139, 250, 0.1)",
                  }}
                  onPress={() => {
                    setReviewingUserId(solicitud?.client?.id ?? null);
                    setIsReviewModalVisible(true);
                  }}
                >
                  <MaterialIcons name="star" size={20} color="#7C3AED" />
                  <Text className="font-semibold" style={{ color: "#7C3AED" }}>
                    Dejar reseña al cliente
                  </Text>
                </TouchableOpacity>
              </View>
            )}

              {/* Reportar solicitud: cliente reporta al proveedor; proveedor reporta al cliente */}
              {solicitud && userId && (() => {
                const isClient = isOwner;
                const reportTargetUserId = isClient
                  ? (acceptedQuote?.providerId ?? propuestas[0]?.providerId)
                  : solicitud.client?.id;
                const canReport = isClient
                  ? propuestas.length > 0 && !!reportTargetUserId
                  : !!reportTargetUserId;
                if (!canReport) return null;
                return (
                  <View className="mt-4">
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 rounded-xl border"
                      style={{ borderColor: "#DC2626" }}
                      onPress={() => setIsReportModalVisible(true)}
                    >
                      <MaterialIcons name="flag" size={20} color="#DC2626" />
                      <Text className="ml-2 font-semibold" style={{ color: "#DC2626" }}>
                        Reportar solicitud
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
          </View>
        </ScrollView>

        {/* Modal de reporte de solicitud */}
        {solicitud && (() => {
          const isClient = isOwner;
          const reportTargetUserId = isClient
            ? (acceptedQuote?.providerId ?? propuestas[0]?.providerId)
            : solicitud.client?.id;
          if (!reportTargetUserId || !userId) return null;
          return (
            <ReportModal
              visible={isReportModalVisible}
              onClose={() => setIsReportModalVisible(false)}
              reportType="request"
              targetId={requestId}
              targetName={solicitud.title ?? "Solicitud"}
              reportedUserId={reportTargetUserId}
              reporterId={userId}
            />
          );
        })()}

        {/* Modal de reseña (estrellas + comentario opcional) */}
        <Modal
          visible={isReviewModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!isSubmittingReview) {
              Keyboard.dismiss();
              setIsReviewModalVisible(false);
            }
          }}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <KeyboardAvoidingView
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end",
              }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 24,
                    paddingBottom: 40,
                  }}
                >
                  <Text
                    className="text-lg font-bold mb-1"
                    style={{ color: colors.text }}
                  >
                    Dejar reseña
                  </Text>
                  <Text
                    className="text-sm mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Comparte tu experiencia con{" "}
                    {reviewingUserId === solicitud?.client?.id
                      ? "el cliente"
                      : "el profesional"}
                    .
                  </Text>
                  <View className="mb-4">
                    <Text
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Calificación
                    </Text>
                    <View className="flex-row gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <TouchableOpacity
                          key={rating}
                          onPress={() => setReviewRating(rating)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <MaterialIcons
                            name={
                              rating <= reviewRating ? "star" : "star-border"
                            }
                            size={36}
                            color={
                              rating <= reviewRating ? "#F59E0B" : "#D1D5DB"
                            }
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View className="mb-6">
                    <Text
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Comentario (opcional)
                    </Text>
                    <TextInput
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      placeholder="Describe tu experiencia..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                      onKeyPress={({ nativeEvent }) => {
                        if (
                          nativeEvent.key === "Enter" ||
                          nativeEvent.key === "\n"
                        ) {
                          Keyboard.dismiss();
                        }
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 12,
                        minHeight: 100,
                        textAlignVertical: "top",
                        color: colors.text,
                        fontSize: 16,
                      }}
                    />
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        if (!isSubmittingReview) {
                          setIsReviewModalVisible(false);
                          setReviewComment("");
                          setReviewRating(5);
                          setReviewingUserId(null);
                        }
                      }}
                      disabled={isSubmittingReview}
                      className="flex-1 py-3 rounded-xl justify-center h-14 border items-center"
                      style={{ borderColor: colors.border, borderRadius: 12 }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ borderColor: colors.border, borderRadius: 12 }}
                      onPress={async () => {
                        if (!userId || !requestId || !reviewingUserId) return;
                        setIsSubmittingReview(true);
                        try {
                          const { error } = await supabase
                            .from("reviews")
                            .insert({
                              request_id: requestId,
                              reviewer_id: userId,
                              reviewed_id: reviewingUserId,
                              rating: reviewRating,
                              comment: reviewComment.trim() || null,
                            })
                            .select()
                            .single();
                          if (error) throw error;
                          const { data: otherReview } = await supabase
                            .from("reviews")
                            .select("id, is_visible")
                            .eq("request_id", requestId)
                            .neq("reviewer_id", userId)
                            .maybeSingle();
                          if (otherReview?.is_visible) {
                            Alert.alert(
                              "¡Reseña publicada!",
                              "Tu reseña y la del otro usuario ahora son visibles."
                            );
                          } else {
                            Alert.alert(
                              "¡Reseña guardada!",
                              "Tu reseña se publicará cuando la otra parte también deje su reseña."
                            );
                          }
                          setIsReviewModalVisible(false);
                          setReviewComment("");
                          setReviewRating(5);
                          setReviewingUserId(null);
                          const { data: revData } = await supabase
                            .from("reviews")
                            .select(
                              "request_id, reviewer_id, reviewed_id, is_visible"
                            )
                            .eq("request_id", requestId);
                          setExistingReviews(revData || []);
                        } catch (e) {
                          console.error(e);
                          Alert.alert(
                            "Error",
                            "No se pudo enviar la reseña. Intenta de nuevo."
                          );
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      disabled={isSubmittingReview}
                      className="flex-1 py-3 rounded-xl overflow-hidden"
                    >
                      <LinearGradient
                        colors={["#7C3AED", "#A78BFA"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 16,
                          borderRadius: 12,
                        }}
                      >
                        {isSubmittingReview ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text className="text-white font-semibold">
                            Enviar reseña
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>

        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedQuoteForPayment(null);
          }}
          payload={selectedQuoteForPayment}
          userEmail={buyerEmail}
          onPaymentSuccess={() => {
            refetchQuotes();
            refetchRequest();
            setPaymentModalVisible(false);
            setSelectedQuoteForPayment(null);
          }}
        />
      </View>
    </LinearGradient>
  );
}
