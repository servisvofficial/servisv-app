import React, { useState } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { colors } from '../theme/colors';

interface RehireButtonProps {
  requestId: string;
  providerId: string;
}

export function RehireButton({ requestId, providerId }: RehireButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session } = useAuth();
  
  const handleRehire = async () => {
    if (!session?.user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para volver a contratar.');
      return;
    }
    
    Alert.alert(
      'Volver a contratar',
      '¿Deseas crear una nueva solicitud idéntica con este profesional?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, crear',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await supabase.rpc('duplicate_request_for_rehire', {
                p_original_request_id: requestId,
                p_provider_id: providerId,
                p_client_id: session.user.id
              });

              if (error) throw error;
              
              if (data) {
                Alert.alert('¡Éxito!', 'Se ha creado la nueva solicitud.', [
                  { 
                    text: 'Ir a la solicitud', 
                    onPress: () => router.push(`/trabajos/detalle-solicitud?id=${data}`)
                  }
                ]);
              }
            } catch (err: any) {
              console.error(err);
              Alert.alert('Error', err.message || 'No se pudo crear la solicitud');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleRehire}
      disabled={loading}
      className="flex-row items-center justify-center bg-gray-100 rounded-full px-4 py-2 border border-gray-200"
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary.main} />
      ) : (
        <>
          <RefreshCw size={16} color={colors.primary.main} style={{ marginRight: 6 }} />
          <Text className="text-primary-main font-semibold text-sm">Volver a Contratar</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
