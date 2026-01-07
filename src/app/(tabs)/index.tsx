import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Header, SearchBar, CategoriaCard } from '@/common/components';
import { MisSolicitudesCard } from '@/features/solicitudes/components/MisSolicitudesCard';
import { NuevaSolicitudCard } from '@/features/solicitudes/components/NuevaSolicitudCard';
import { ExplorarServiciosCard } from '@/features/servicios/components/ExplorarServiciosCard';
import { CATEGORIAS_POPULARES } from '@/common/types';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-2 pb-6">
          {/* Saludo */}
          <View className="px-5 py-4">
            <Text className="text-2xl font-bold text-gray-900">¡Hola, Juan!</Text>
            <Text className="text-base text-gray-600 mt-1">
              Encontremos el servicio perfecto para ti.
            </Text>
          </View>

          {/* Barra de búsqueda */}
          <SearchBar placeholder="¿Qué servicio necesitas?" />

          {/* Mis Solicitudes */}
          <MisSolicitudesCard 
            totalSolicitudes={2}
            abiertas={1}
            completadas={0}
          />

          {/* Nueva Solicitud */}
          <NuevaSolicitudCard 
            onPress={() => router.push('/crear-solicitud' as any)}
          />

          {/* Explorar Servicios */}
          <ExplorarServiciosCard />

          {/* Categorías Populares */}
          <View className="px-5 mt-4">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Categorías populares
            </Text>
            
            <View className="flex-row flex-wrap justify-between">
              {CATEGORIAS_POPULARES.map((categoria) => (
                <CategoriaCard 
                  key={categoria.id}
                  categoria={categoria}
                  onPress={() => {
                    // Navegar a la pantalla de categoría
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
