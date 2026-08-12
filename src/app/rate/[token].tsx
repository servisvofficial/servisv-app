import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/common/lib/supabase/supabaseClient';
import { useTheme } from '@/common/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

export default function RateServiceScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    async function loadReview() {
      if (!token) {
        Alert.alert('Error', 'Token no válido');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('review_token', token)
        .single();
        
      if (error || !data) {
        Alert.alert('Error', 'El enlace es inválido o ha expirado');
      } else if (data.review_status === 'completed') {
        Alert.alert('Aviso', 'Ya has enviado esta reseña anteriormente');
        router.replace('/');
      } else {
        setReviewData(data);
      }
      setLoading(false);
    }
    
    loadReview();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment,
          review_status: 'completed',
          review_token: null, // Invalidar token
          token_expires_at: null,
        })
        .eq('id', reviewData.id);

      if (error) throw error;
      
      Alert.alert('¡Gracias!', 'Tu reseña ha sido enviada correctamente.', [
        { text: 'Ir al Inicio', onPress: () => router.replace('/') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'Hubo un problema al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!reviewData) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <MaterialIcons name="error-outline" size={64} color="#DC2626" />
        <Text className="text-xl font-bold mt-4 text-center">Enlace inválido</Text>
        <TouchableOpacity 
          className="mt-6 bg-indigo-600 px-6 py-3 rounded-xl"
          onPress={() => router.replace('/')}
        >
          <Text className="text-white font-bold">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1 p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center mt-12">
          <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="star" size={32} color="#4F46E5" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Califica el servicio</Text>
          <Text className="text-gray-500 text-center mb-8">
            ¿Cómo fue tu experiencia? Tu opinión es muy importante para nosotros.
          </Text>

          {/* Selector de estrellas */}
          <View className="flex-row justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <MaterialIcons 
                  name={star <= rating ? "star" : "star-border"} 
                  size={40} 
                  color={star <= rating ? "#F59E0B" : "#D1D5DB"} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <View className="w-full mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Comentario (Opcional)</Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800"
              placeholder="Cuéntanos más detalles..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity
            className={`w-full rounded-xl p-4 items-center ${submitting ? 'bg-gray-400' : 'bg-indigo-600'}`}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Enviar Calificación</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
