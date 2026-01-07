import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  titulo: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  titulo, 
  onPress, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  fullWidth = true 
}: ButtonProps) {
  const getButtonStyle = () => {
    if (disabled) return 'bg-gray-300';
    
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'secondary':
        return 'bg-gray-200';
      case 'outline':
        return 'bg-white border-2 border-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return 'text-white';
      case 'secondary':
        return 'text-gray-800';
      case 'outline':
        return 'text-blue-500';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      className={`${fullWidth ? 'w-full' : ''} py-4 px-6 rounded-xl items-center justify-center ${getButtonStyle()}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#3B82F6' : '#FFF'} />
      ) : (
        <Text className={`text-base font-semibold ${getTextStyle()}`}>
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
}

