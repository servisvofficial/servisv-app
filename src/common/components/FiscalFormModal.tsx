import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { validateDUI, validateNIT } from "@/common/services/paymentCalculations";
import type { FiscalData } from "@/common/types/fiscal";
import {
  MUNICIPIOS_POR_DEPARTAMENTO,
  DEPARTAMENTOS,
} from "@/common/constants/municipios";

// Catálogo de actividades económicas según el Ministerio de Hacienda (igual que servisv-proyecto-web)
const ACTIVIDADES_ECONOMICAS = [
  { codigo: "62010", descripcion: "PORTALES WEB" },
  { codigo: "62020", descripcion: "DISEÑO Y DESARROLLO DE SOFTWARE" },
  { codigo: "62090", descripcion: "OTRAS ACTIVIDADES DE TECNOLOGÍA DE LA INFORMACIÓN" },
  { codigo: "63110", descripcion: "PROCESAMIENTO DE DATOS" },
  { codigo: "63120", descripcion: "PORTALES WEB Y HOSPEDAJE" },
  { codigo: "70200", descripcion: "ACTIVIDADES DE CONSULTORÍA DE GESTIÓN" },
  { codigo: "71100", descripcion: "ACTIVIDADES DE ARQUITECTURA E INGENIERÍA" },
  { codigo: "73200", descripcion: "ESTUDIOS DE MERCADO Y ENCUESTAS DE OPINIÓN PÚBLICA" },
  { codigo: "74900", descripcion: "OTRAS ACTIVIDADES PROFESIONALES, CIENTÍFICAS Y TÉCNICAS" },
  { codigo: "77100", descripcion: "ALQUILER Y ARRENDAMIENTO DE VEHÍCULOS AUTOMOTORES" },
  { codigo: "77200", descripcion: "ALQUILER DE EFECTOS PERSONALES Y ENSERES DOMÉSTICOS" },
  { codigo: "77300", descripcion: "ALQUILER DE MAQUINARIA, EQUIPO Y BIENES TANGIBLES" },
  { codigo: "77400", descripcion: "ARRENDAMIENTO DE PROPIEDAD INTELECTUAL Y SIMILARES" },
  { codigo: "78100", descripcion: "ACTIVIDADES DE AGENCIAS DE EMPLEO" },
  { codigo: "78200", descripcion: "ACTIVIDADES DE AGENCIAS DE EMPLEO TEMPORAL" },
  { codigo: "79100", descripcion: "ACTIVIDADES DE AGENCIAS DE VIAJES" },
  { codigo: "79900", descripcion: "OTRAS ACTIVIDADES DE SERVICIOS DE RESERVAS Y ACTIVIDADES RELACIONADAS" },
  { codigo: "80100", descripcion: "ACTIVIDADES DE SEGURIDAD PRIVADA" },
  { codigo: "80200", descripcion: "ACTIVIDADES DE SERVICIOS DE SISTEMAS DE SEGURIDAD" },
  { codigo: "80300", descripcion: "ACTIVIDADES DE INVESTIGACIÓN" },
  { codigo: "82110", descripcion: "ACTIVIDADES COMBINADAS DE APOYO A INSTALACIONES" },
  { codigo: "82190", descripcion: "OTRAS ACTIVIDADES DE APOYO A EMPRESAS" },
  { codigo: "82200", descripcion: "ACTIVIDADES DE CENTROS DE LLAMADAS" },
  { codigo: "82300", descripcion: "ORGANIZACIÓN DE CONVENCIONES Y FERIAS DE MUESTRAS" },
  { codigo: "82910", descripcion: "ACTIVIDADES DE AGENCIAS DE COBRO Y OFICINAS DE INFORMACIÓN COMERCIAL" },
  { codigo: "82920", descripcion: "ACTIVIDADES DE ENVASADO Y EMPAQUE" },
  { codigo: "82990", descripcion: "OTRAS ACTIVIDADES DE APOYO A EMPRESAS N.C.P." },
  { codigo: "85500", descripcion: "OTRAS ACTIVIDADES DE ENSEÑANZA" },
  { codigo: "90000", descripcion: "ACTIVIDADES CREATIVAS, ARTÍSTICAS Y DE ENTRETENIMIENTO" },
  { codigo: "91010", descripcion: "ACTIVIDADES DE BIBLIOTECAS Y ARCHIVOS" },
  { codigo: "91020", descripcion: "ACTIVIDADES DE MUSEOS Y CONSERVACIÓN DE LUGARES Y EDIFICIOS HISTÓRICOS" },
  { codigo: "91030", descripcion: "ACTIVIDADES DE JARDINES BOTÁNICOS Y ZOOLÓGICOS Y RESERVAS NATURALES" },
  { codigo: "92000", descripcion: "ACTIVIDADES DE JUEGOS DE AZAR Y APUESTAS" },
  { codigo: "93110", descripcion: "GESTIÓN DE INSTALACIONES DEPORTIVAS" },
  { codigo: "93120", descripcion: "ACTIVIDADES DE CLUBES DEPORTIVOS" },
  { codigo: "93130", descripcion: "ACTIVIDADES DE GIMNASIOS" },
  { codigo: "93190", descripcion: "OTRAS ACTIVIDADES DEPORTIVAS" },
  { codigo: "93210", descripcion: "ACTIVIDADES DE PARQUES DE ATRACCIONES Y PARQUES TEMÁTICOS" },
  { codigo: "93290", descripcion: "OTRAS ACTIVIDADES DE ESPARCIMIENTO Y RECREATIVAS" },
  { codigo: "94110", descripcion: "ACTIVIDADES DE ASOCIACIONES EMPRESARIALES Y DE EMPLEADORES" },
  { codigo: "94120", descripcion: "ACTIVIDADES DE ASOCIACIONES PROFESIONALES" },
  { codigo: "94200", descripcion: "ACTIVIDADES DE SINDICATOS" },
  { codigo: "94910", descripcion: "ACTIVIDADES DE ORGANIZACIONES RELIGIOSAS" },
  { codigo: "94920", descripcion: "ACTIVIDADES DE ORGANIZACIONES POLÍTICAS" },
  { codigo: "94990", descripcion: "ACTIVIDADES DE OTRAS ORGANIZACIONES DE AFILIACIÓN" },
  { codigo: "96010", descripcion: "LAVADO Y LIMPIEZA DE PRENDAS DE TELA Y DE PIEL" },
  { codigo: "96020", descripcion: "PELUQUERÍA Y OTROS TRATAMIENTOS DE BELLEZA" },
  { codigo: "96030", descripcion: "POMPAS FÚNEBRES Y ACTIVIDADES CONEXAS" },
  { codigo: "96090", descripcion: "OTRAS ACTIVIDADES DE SERVICIOS PERSONALES" },
];

interface FiscalFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FiscalData) => void;
  initialData?: Partial<FiscalData>;
  defaultEmail?: string;
  isLoading?: boolean;
  /** Si true, no envuelve en Modal; solo renderiza el contenido (para usar dentro de otro Modal) */
  embedded?: boolean;
}

export function FiscalFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  defaultEmail = "",
  isLoading = false,
  embedded = false,
}: FiscalFormModalProps) {
  const [tipoPersona, setTipoPersona] = useState<"natural" | "juridica">(
    initialData?.tipo_persona || "natural"
  );
  const [nombreCompleto, setNombreCompleto] = useState(
    initialData?.nombre_completo || ""
  );
  const [email, setEmail] = useState(initialData?.email || defaultEmail);
  const [dui, setDui] = useState(initialData?.dui || "");
  const [nit, setNit] = useState(initialData?.nit || "");
  const [numeroRegistro, setNumeroRegistro] = useState(
    initialData?.numero_registro_contribuyente || ""
  );
  const [telefono, setTelefono] = useState(initialData?.telefono || "");
  const [direccion, setDireccion] = useState(initialData?.direccion || "");
  const [departamento, setDepartamento] = useState(
    initialData?.departamento || ""
  );
  const [municipio, setMunicipio] = useState(initialData?.municipio || "");
  const [codActividad, setCodActividad] = useState(
    initialData?.cod_actividad || ""
  );
  const [descActividad, setDescActividad] = useState(
    initialData?.desc_actividad || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activityPickerVisible, setActivityPickerVisible] = useState(false);

  const tipoDte: "01" | "03" = numeroRegistro.trim() ? "03" : "01";

  useEffect(() => {
    if (tipoPersona === "natural") setNit("");
    else setDui("");
  }, [tipoPersona]);

  useEffect(() => {
    setMunicipio("");
  }, [departamento]);

  const formatDui = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length > 8) return d.slice(0, 8) + "-" + d.slice(8, 9);
    if (d.length === 8) return d + "-";
    return d;
  };

  const formatNit = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length > 13)
      return `${d.slice(0, 4)}-${d.slice(4, 10)}-${d.slice(10, 13)}-${d.slice(13, 14)}`;
    if (d.length > 10)
      return `${d.slice(0, 4)}-${d.slice(4, 10)}-${d.slice(10)}`;
    if (d.length > 4) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return d;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombreCompleto.trim()) e.nombreCompleto = "Nombre requerido";
    if (!email.trim()) e.email = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email no válido";
    if (tipoPersona === "natural") {
      if (!dui.trim()) e.dui = "DUI requerido";
      else if (!validateDUI(dui)) e.dui = "Formato DUI: 00000000-0";
    } else {
      if (!nit.trim()) e.nit = "NIT requerido";
      else if (!validateNIT(nit)) e.nit = "Formato NIT: 0000-000000-000-0";
    }
    if (numeroRegistro.trim()) {
      if (!codActividad.trim()) e.codActividad = "Actividad económica requerida con NRC";
      if (!descActividad.trim()) e.descActividad = "Descripción de actividad requerida";
    }
    if (!telefono.trim()) e.telefono = "Teléfono requerido";
    if (!direccion.trim()) e.direccion = "Dirección requerida";
    if (!departamento) e.departamento = "Departamento requerido";
    if (!municipio) e.municipio = "Municipio requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const tipoDocumento =
      tipoPersona === "natural" && dui.trim() ? "13" : tipoPersona === "juridica" && nit.trim() ? "36" : undefined;
    const data: FiscalData = {
      tipo_persona: tipoPersona,
      tipo_dte: tipoDte,
      nombre_completo: nombreCompleto.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      departamento: departamento.trim(),
      municipio: municipio.trim(),
      tipo_documento: tipoDocumento,
      ...(tipoPersona === "natural" ? { dui: dui.trim() } : {}),
      ...(tipoPersona === "juridica"
        ? {
            nit: nit.trim(),
            ...(tipoDte === "03" ? { numero_registro_contribuyente: numeroRegistro.trim() } : {}),
          }
        : {}),
      ...(tipoDte === "03"
        ? {
            numero_registro_contribuyente: numeroRegistro.trim(),
            cod_actividad: codActividad.trim(),
            desc_actividad: descActividad.trim(),
          }
        : {}),
    };
    onSubmit(data);
  };

  const inputStyle = {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    color: "#111827",
  };

  const sheetContent = (
    <View style={{ flex: 1, backgroundColor: embedded ? "transparent" : "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
      <View
        style={{
          maxHeight: Dimensions.get("window").height * 0.92,
          minHeight: Dimensions.get("window").height * 0.6,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        <LinearGradient
            colors={["#FFFFFF", "#F5F3FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1, minHeight: Dimensions.get("window").height * 0.6 }}
          >
            <View style={{ flex: 1 }}>
            <View
              className="px-5 py-4 border-b"
              style={{ borderBottomColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-bold" style={{ color: "#111827" }}>
                  Datos fiscales
                </Text>
                <TouchableOpacity onPress={onClose} disabled={isLoading}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
                  ServiSV
                </Text>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-sm mb-4" style={{ color: "#6B7280" }}>
                Se generará Crédito Fiscal (CCF) si indicas NRC; si no, Factura Consumidor Final.
              </Text>

              <View className="flex-row gap-4 mb-4">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
                  style={{
                    borderColor: tipoPersona === "natural" ? "#4F46E5" : "#E5E7EB",
                    backgroundColor: tipoPersona === "natural" ? "rgba(79,70,229,0.1)" : "#F9FAFB",
                  }}
                  onPress={() => setTipoPersona("natural")}
                >
                  <Text style={{ color: "#111827", fontWeight: "600" }}>Persona Natural</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
                  style={{
                    borderColor: tipoPersona === "juridica" ? "#4F46E5" : "#E5E7EB",
                    backgroundColor: tipoPersona === "juridica" ? "rgba(79,70,229,0.1)" : "#F9FAFB",
                  }}
                  onPress={() => setTipoPersona("juridica")}
                >
                  <Text style={{ color: "#111827", fontWeight: "600" }}>Persona Jurídica</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  Nombre completo *
                </Text>
                <TextInput
                  value={nombreCompleto}
                  onChangeText={setNombreCompleto}
                  placeholder="Nombre o razón social"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 border rounded-xl text-base"
                  style={[{ height: 48 }, inputStyle]}
                />
                {errors.nombreCompleto && (
                  <Text className="text-sm text-red-600 mt-1">{errors.nombreCompleto}</Text>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  Email *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="px-4 py-3 border rounded-xl text-base"
                  style={[{ height: 48 }, inputStyle]}
                />
                {errors.email && (
                  <Text className="text-sm text-red-600 mt-1">{errors.email}</Text>
                )}
              </View>

              {tipoPersona === "natural" && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                    DUI *
                  </Text>
                  <TextInput
                    value={dui}
                    onChangeText={(t) => setDui(formatDui(t))}
                    placeholder="00000000-0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={10}
                    className="px-4 py-3 border rounded-xl text-base"
                    style={[{ height: 48 }, inputStyle]}
                  />
                  {errors.dui && (
                    <Text className="text-sm text-red-600 mt-1">{errors.dui}</Text>
                  )}
                </View>
              )}

              {tipoPersona === "juridica" && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                    NIT *
                  </Text>
                  <TextInput
                    value={nit}
                    onChangeText={(t) => setNit(formatNit(t))}
                    placeholder="0000-000000-000-0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={17}
                    className="px-4 py-3 border rounded-xl text-base"
                    style={[{ height: 48 }, inputStyle]}
                  />
                  {errors.nit && (
                    <Text className="text-sm text-red-600 mt-1">{errors.nit}</Text>
                  )}
                </View>
              )}

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  NRC (opcional; con NRC se emite CCF)
                </Text>
                <TextInput
                  value={numeroRegistro}
                  onChangeText={(t) => setNumeroRegistro(t.replace(/\D/g, "").slice(0, 8))}
                  placeholder="8 dígitos"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={8}
                  className="px-4 py-3 border rounded-xl text-base"
                  style={[{ height: 48 }, inputStyle]}
                />
              </View>

              {numeroRegistro.trim() && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                      Código de Actividad Económica *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActivityPickerVisible(true)}
                      className="px-4 py-3 border rounded-xl flex-row items-center justify-between"
                      style={[{ height: 48, borderColor: "#E5E7EB" }, inputStyle]}
                    >
                      <Text
                        numberOfLines={1}
                        style={{ color: codActividad ? "#111827" : "#9CA3AF", fontSize: 16 }}
                      >
                        {codActividad
                          ? `${ACTIVIDADES_ECONOMICAS.find((a) => a.codigo === codActividad)?.codigo ?? codActividad} - ${descActividad || ""}`
                          : "Selecciona una actividad económica"}
                      </Text>
                      <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <Text className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Requerido para Crédito Fiscal (CCF)
                    </Text>
                    {errors.codActividad && (
                      <Text className="text-sm text-red-600 mt-1">{errors.codActividad}</Text>
                    )}
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                      Descripción de Actividad Económica *
                    </Text>
                    <TextInput
                      value={descActividad}
                      editable={false}
                      placeholder="Descripción de la actividad económica"
                      placeholderTextColor="#9CA3AF"
                      className="px-4 py-3 border rounded-xl text-base"
                      style={[
                        { height: 48, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
                        inputStyle,
                      ]}
                    />
                    <Text className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Se llena automáticamente al seleccionar el código
                    </Text>
                    {errors.descActividad && (
                      <Text className="text-sm text-red-600 mt-1">{errors.descActividad}</Text>
                    )}
                  </View>
                </>
              )}

              {/* Modal lista de actividades económicas */}
              <Modal
                visible={activityPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setActivityPickerVisible(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setActivityPickerVisible(false)}
                  style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ maxHeight: "70%", backgroundColor: "#FFF", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Actividad económica</Text>
                      <TouchableOpacity onPress={() => setActivityPickerVisible(false)}>
                        <MaterialIcons name="close" size={24} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={ACTIVIDADES_ECONOMICAS}
                      keyExtractor={(item) => item.codigo}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setCodActividad(item.codigo);
                            setDescActividad(item.descripcion);
                            setActivityPickerVisible(false);
                          }}
                          style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
                        >
                          <Text style={{ fontSize: 15, color: "#111827" }} numberOfLines={2}>
                            {item.codigo} - {item.descripcion}
                          </Text>
                        </TouchableOpacity>
                      )}
                      style={{ maxHeight: Dimensions.get("window").height * 0.6 }}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  Teléfono *
                </Text>
                <TextInput
                  value={telefono}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, "");
                    setTelefono(d.length > 4 ? d.slice(0, 4) + "-" + d.slice(4, 8) : d);
                  }}
                  placeholder="2200-1100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={9}
                  className="px-4 py-3 border rounded-xl text-base"
                  style={[{ height: 48 }, inputStyle]}
                />
                {errors.telefono && (
                  <Text className="text-sm text-red-600 mt-1">{errors.telefono}</Text>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  Dirección (complemento) *
                </Text>
                <TextInput
                  value={direccion}
                  onChangeText={setDireccion}
                  placeholder="Dirección completa"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 border rounded-xl text-base"
                  style={[inputStyle, { minHeight: 48 }]}
                />
                {errors.direccion && (
                  <Text className="text-sm text-red-600 mt-1">{errors.direccion}</Text>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  Departamento *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DEPARTAMENTOS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      onPress={() => setDepartamento(d.value)}
                      className="px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: departamento === d.value ? "#4F46E5" : "#E5E7EB",
                        backgroundColor: departamento === d.value ? "rgba(79,70,229,0.1)" : "#F9FAFB",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: "#111827" }}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.departamento && (
                  <Text className="text-sm text-red-600 mt-1">{errors.departamento}</Text>
                )}
              </View>

              {departamento && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                    Municipio (CAT-013) *
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row flex-wrap gap-2"
                  >
                    {(MUNICIPIOS_POR_DEPARTAMENTO[departamento] ?? []).map((m) => (
                      <TouchableOpacity
                        key={m.codigo}
                        onPress={() => setMunicipio(m.codigo)}
                        className="px-3 py-2 rounded-lg border mr-2"
                        style={{
                          borderColor: municipio === m.codigo ? "#4F46E5" : "#E5E7EB",
                          backgroundColor: municipio === m.codigo ? "rgba(79,70,229,0.1)" : "#F9FAFB",
                        }}
                      >
                        <Text
                          className="text-xs"
                          style={{ color: "#111827" }}
                          numberOfLines={1}
                        >
                          {m.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.municipio && (
                    <Text className="text-sm text-red-600 mt-1">{errors.municipio}</Text>
                  )}
                </View>
              )}

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl border items-center"
                  style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text className="font-semibold" style={{ color: "#111827" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-xl overflow-hidden"
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 12, alignItems: "center" }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text className="text-white font-bold">Continuar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  if (embedded) {
    return sheetContent;
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {sheetContent}
    </Modal>
  );
}
