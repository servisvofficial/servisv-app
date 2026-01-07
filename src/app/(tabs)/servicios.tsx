import { View, Text, ScrollView } from 'react-native';
import { Header, SearchBar, CategoriaCard } from '@/common/components';
import { CATEGORIAS_POPULARES } from '@/common/types';

export default function ServiciosScreen() {
  return (
    <View className="flex-1 bg-white">
      <Header titulo="Servicios" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-2 pb-6">
          <SearchBar placeholder="Buscar servicios..." />
          
          <View className="px-5">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Todas las categorías
            </Text>
            
            <View className="flex-row flex-wrap justify-between">
              {CATEGORIAS_POPULARES.map((categoria) => (
                <CategoriaCard 
                  key={categoria.id}
                  categoria={categoria}
                  onPress={() => {
                    console.log('Categoria seleccionada:', categoria.nombre);
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

