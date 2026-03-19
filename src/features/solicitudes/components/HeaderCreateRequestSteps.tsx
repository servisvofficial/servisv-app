import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/common/providers/ThemeProvider';

interface HeaderCreateRequestStepsProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

const HeaderCreateRequestSteps = ({ currentStep, totalSteps, title }: HeaderCreateRequestStepsProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={{ backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      {currentStep > 1 && (
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{title}</Text>
        </View>
      )}

      {currentStep === 1 && (
        <View className="flex-row items-center px-5 py-4">
          <Text className="text-lg font-bold flex-1 text-center" style={{ color: colors.text }}>{title}</Text>
        </View>
      )}

      <View className="px-5 pb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: '#6366F1' }}>
          Paso {currentStep} de {totalSteps}
        </Text>
        
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
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

export default HeaderCreateRequestSteps;
