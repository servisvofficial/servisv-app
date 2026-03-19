import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

interface ProfileMapProps {
  coverageRadius?: number; // en km
  latitude: number;
  longitude: number;
}

function getDeltaFromRadius(radiusKm: number) {
  // Aproximación: 1 grado de latitud son ~111km
  const delta = radiusKm / 80; // Un poco más de zoom para que se vea el círculo
  return delta;
}

export const ProfileMap = ({
  coverageRadius,
  latitude,
  longitude,
}: ProfileMapProps) => {
  const mapHeight = 192; // h-48 = 192px
  const delta = coverageRadius ? getDeltaFromRadius(coverageRadius) : 0.01;

  return (
    <View>
      <View
        style={{
          width: '100%',
          height: mapHeight,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <MapView
          style={{ width: '100%', height: '100%', borderRadius: 12 }}
          region={{
            latitude,
            longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }} />
          {coverageRadius && coverageRadius > 0 && (
            <Circle
              center={{ latitude, longitude }}
              radius={coverageRadius * 1000}
              strokeColor="#9333EA"
              fillColor="rgba(147, 51, 234, 0.15)"
            />
          )}
        </MapView>
      </View>
    </View>
  );
};
