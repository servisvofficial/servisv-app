import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIAS_POPULARES } from '@/common/types';
import HeaderRegisterSteps from './HeaderRegisterSteps';

const SelectServices = () => {
  const router = useRouter();
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);

  const handleNext = () => {
    router.push('/(auth)/sign-up/service-zone');
  };

  const toggleServicio = (id: string) => {
    if (serviciosSeleccionados.includes(id)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s !== id));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, id]);
    }
  };

  const isFormValid = serviciosSeleccionados.length > 0;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps 
        currentStep={3}
        totalSteps={4}
        title="Regístrate como Proveedor"
      />

      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Selecciona los servicios que ofreces
        </Text>
        
        <Text className="text-sm text-gray-600 mb-6">
          Puedes seleccionar uno o varios servicios.
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {CATEGORIAS_POPULARES.map((categoria) => {
            const isSelected = serviciosSeleccionados.includes(categoria.id);
            
            return (
              <TouchableOpacity
                key={categoria.id}
                className={`w-[48%] mb-4 p-4 rounded-2xl border-2 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => toggleServicio(categoria.id)}
                activeOpacity={0.7}
              >
                <View className="items-center">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: isSelected ? categoria.color : categoria.color + '20' }}
                  >
                    <Text className="text-2xl">{categoria.icono}</Text>
                  </View>
                  
                  <Text className="text-sm font-semibold text-gray-900 text-center">
                    {categoria.nombre}
                  </Text>
                  
                  {isSelected && (
                    <View className="absolute top-2 right-2">
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#3B82F6" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {serviciosSeleccionados.length > 0 && (
          <View className="mt-4 p-4 bg-blue-50 rounded-xl">
            <Text className="text-sm font-medium text-blue-900">
              {serviciosSeleccionados.length} {serviciosSeleccionados.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View className="px-5 pb-6 border-t border-gray-100 pt-4">
        <TouchableOpacity
          className="w-full rounded-3xl overflow-hidden"
          onPress={handleNext}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          {isFormValid ? (
            <LinearGradient
              colors={['#4F46E5', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-base font-semibold">
                Siguiente
              </Text>
            </LinearGradient>
          ) : (
            <View 
              style={{ 
                backgroundColor: '#D1D5DB',
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-base font-semibold">
                Siguiente
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SelectServices;

