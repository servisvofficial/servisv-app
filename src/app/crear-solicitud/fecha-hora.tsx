import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function CreateRequestStep4Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { requestData, updateRequestData } = useCreateRequest();
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    requestData.scheduledDate 
      ? new Date(requestData.scheduledDate) 
      : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState<string>(
    requestData.preferredTime?.split(' - ')[0] || '14:00'
  );
  const [endTime, setEndTime] = useState<string>(
    requestData.preferredTime?.split(' - ')[1] || '16:00'
  );
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
      }
    } else {
      // iOS
      if (date) {
        setSelectedDate(date);
      }
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    }
  };

  const handleStartTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      if (event.type === 'set' && date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setStartTime(`${hours}:${minutes}`);
      }
    } else {
      // iOS
      if (date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setStartTime(`${hours}:${minutes}`);
      }
      if (event.type === 'dismissed') {
        setShowStartTimePicker(false);
      }
    }
  };

  const handleEndTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
      if (event.type === 'set' && date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hours}:${minutes}`);
      }
    } else {
      // iOS
      if (date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hours}:${minutes}`);
      }
      if (event.type === 'dismissed') {
        setShowEndTimePicker(false);
      }
    }
  };

  const handleNext = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const timeRange = `${startTime} - ${endTime}`;
    updateRequestData({
      scheduledDate: dateStr,
      preferredTime: timeRange,
    });
    router.push('/crear-solicitud/fotos');
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps currentStep={4} totalSteps={6} title="Crear Solicitud" />
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>Fecha y hora preferida</Text>
            <View className="mb-6">
              <Text className="text-sm mb-2 font-medium" style={{ color: colors.textSecondary }}>Fecha *</Text>
              <TouchableOpacity
                className="px-4 py-3 rounded-xl flex-row items-center justify-between"
                style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
                onPress={() => setShowDatePicker(true)}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="calendar-today" size={20} color="#6366F1" />
                  <Text className="ml-2 text-base" style={{ color: colors.text }}>{formatDate(selectedDate)}</Text>
                </View>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              {Platform.OS === 'android' && showDatePicker && (
                <View className="mt-2">
                  <TouchableOpacity className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.border }} onPress={() => setShowDatePicker(false)}>
                    <Text className="text-center" style={{ color: colors.text }}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View className="mb-6">
              <Text className="text-sm mb-2 font-medium" style={{ color: colors.textSecondary }}>Hora *</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 px-4 py-3 rounded-xl flex-row items-center justify-between"
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="access-time" size={20} color="#6366F1" />
                    <Text className="ml-2 text-base" style={{ color: colors.text }}>{formatTime(startTime)}</Text>
                  </View>
                </TouchableOpacity>
                <Text className="text-base self-center" style={{ color: colors.textSecondary }}>-</Text>
                <TouchableOpacity
                  className="flex-1 px-4 py-3 rounded-xl flex-row items-center justify-between"
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="access-time" size={20} color="#6366F1" />
                    <Text className="ml-2 text-base" style={{ color: colors.text }}>{formatTime(endTime)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {showStartTimePicker && (
                <>
                  <DateTimePicker
                    value={new Date(`2000-01-01T${startTime}`)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartTimeChange}
                    is24Hour={false}
                  />
                  {Platform.OS === 'android' && (
                    <View className="mt-2">
                      <TouchableOpacity className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.border }} onPress={() => setShowStartTimePicker(false)}>
                        <Text className="text-center" style={{ color: colors.text }}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
              {showEndTimePicker && (
                <>
                  <DateTimePicker value={new Date(`2000-01-01T${endTime}`)} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleEndTimeChange} is24Hour={false} />
                  {Platform.OS === 'android' && (
                    <View className="mt-2">
                      <TouchableOpacity className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.border }} onPress={() => setShowEndTimePicker(false)}>
                        <Text className="text-center" style={{ color: colors.text }}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
            <View className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)', borderWidth: 1 }}>
              <View className="flex-row items-start">
                <MaterialIcons name="info" size={20} color="#3B82F6" />
                <Text className="ml-2 text-sm flex-1" style={{ color: colors.text }}>El proveedor confirmará la fecha y hora final o te propondrá una alternativa. Esta es solo tu preferencia.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={() => router.back()} activeOpacity={0.8}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Anterior</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient colors={['#4F46E5', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-white text-base font-semibold">Siguiente</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
