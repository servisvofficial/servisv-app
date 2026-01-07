import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

// Mapeo de nombres de SF Symbols a Ionicons
const iconMap: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  'house.fill': 'home',
  'paperplane.fill': 'paper-plane',
  'wrench.and.screwdriver.fill': 'construct',
  'message.fill': 'chatbubble',
  'person.fill': 'person',
  'briefcase.fill': 'briefcase',
  'bell.fill': 'notifications',
  'magnifyingglass': 'search',
  'chevron.left': 'chevron-back',
  'chevron.right': 'chevron-forward',
  'arrow.right': 'arrow-forward',
  'xmark': 'close',
  'lock.fill': 'lock-closed',
  'eye.fill': 'eye',
  'eye.slash.fill': 'eye-off',
  'location.fill': 'location',
  'mappin': 'location',
  'map.fill': 'map',
  'photo': 'image',
  'checkmark.circle.fill': 'checkmark-circle',
  'doc.text.fill': 'document-text',
  'plus.circle.fill': 'add-circle',
  'star.fill': 'star',
  'calendar': 'calendar-outline',
  'tag.fill': 'pricetag',
  'questionmark.circle.fill': 'help-circle',
  'gearshape.fill': 'settings',
  'creditcard.fill': 'card',
};

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export function IconSymbol({ name, size = 24, color = '#000', style }: IconSymbolProps) {
  const iconName = iconMap[name] || 'help-circle-outline';
  
  return (
    <Ionicons 
      name={iconName as any}
      size={size} 
      color={color} 
      style={style}
    />
  );
}

