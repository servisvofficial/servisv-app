import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderRegisterStepsProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

const HeaderRegisterSteps = ({ currentStep, totalSteps, title }: HeaderRegisterStepsProps) => {
  const router = useRouter();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="bg-white border-b border-gray-100">
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4"
        >
          <IconSymbol name="chevron.left" size={24} color="#111827" />
        </TouchableOpacity>
        
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
      </View>

      <View className="px-5 pb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: '#6366F1' }}>
          Paso {currentStep} de {totalSteps}
        </Text>
        
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <LinearGradient
            colors={['#4F46E5', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ 
              width: `${progress}%`,
              height: '100%',
              borderRadius: 9999,
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default HeaderRegisterSteps;

