import { View, TextInput } from 'react-native';
import { IconSymbol } from '@/common/components/ui/IconSymbol';

interface SearchBarProps {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  value?: string;
}

export function SearchBar({ placeholder = '¿Qué servicio necesitas?', onChangeText, value }: SearchBarProps) {
  return (
    <View className="mx-5 my-4 px-4 py-3 bg-gray-50 rounded-xl flex-row items-center gap-3">
      <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
      <TextInput
        className="flex-1 text-base text-gray-900"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onChangeText={onChangeText}
        value={value}
      />
    </View>
  );
}

