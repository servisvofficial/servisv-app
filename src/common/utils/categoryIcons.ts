import { MaterialIcons } from '@expo/vector-icons';

/**
 * Mapeo de nombres de categorías a iconos de MaterialIcons
 * Basado en los nombres de las categorías en la tabla requests
 */
export const categoryIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'Plomería': 'plumbing',
  'Electricidad': 'electrical-services',
  'Limpieza': 'cleaning-services',
  'Carpintería': 'carpenter',
  'Pintura': 'format-paint',
  'Lavandería': 'local-laundry-service',
  'Jardinería': 'yard',
  'Mudanzas': 'local-shipping',
  'Aire Acondicionado': 'ac-unit',
  'Cosmetología': 'spa',
  'Cámaras de Seguridad': 'security',
  'Cerrajería': 'vpn-key',
  'Reparación de Electrodomésticos': 'build',
  'Reparación de Celulares': 'phone-android',
  'Lavado de Autos a Domicilio': 'local-car-wash',
  'Mascotas': 'pets',
  'Abogados y Notarios': 'gavel',
  'Diseño Gráfico': 'palette',
  'Médicos Especialistas': 'local-hospital',
  'Médicos Generales': 'medical-services',
  // Nuevas categorías (iconos coherentes con el servicio)
  'Sastrería': 'content-cut',
  'Fotografía y Video': 'photo-camera',
  'Enfermería': 'vaccines',
  'Informáticos': 'computer',
  'Contadores': 'account-balance',
  'Programador Freelance': 'code',
  'Community Manager': 'groups',
  // Fallback (solo para categorías sin mapeo)
  'default': 'category',
};

/**
 * Mapeo de palabras clave a iconos para categorías sin icono definido
 */
const keywordToIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  // Profesionales
  'abogado': 'gavel',
  'notario': 'gavel',
  'legal': 'gavel',
  'contador': 'account-balance',
  'contaduría': 'account-balance',
  'contabilidad': 'account-balance',
  'traductor': 'translate',
  'traducción': 'translate',
  'diseño': 'palette',
  'gráfico': 'palette',
  'diseño gráfico': 'palette',
  'programador': 'code',
  'programación': 'code',
  'desarrollador': 'code',
  'community': 'people',
  'manager': 'people',
  'veterinario': 'pets',
  'veterinaria': 'pets',
  'médico': 'medical-services',
  'medicina': 'medical-services',
  'salud': 'medical-services',
  'doctor': 'medical-services',
  'médicos generales': 'medical-services',
  'médicos especialistas': 'local-hospital',
  'especialista': 'local-hospital',
  'especialistas': 'local-hospital',
  'sastrería': 'content-cut',
  'sastre': 'content-cut',
  'costura': 'content-cut',
  'ropa': 'content-cut',
  'fotografía': 'photo-camera',
  'foto': 'photo-camera',
  'video': 'videocam',
  'cámara': 'photo-camera',
  'enfermería': 'vaccines',
  'enfermero': 'vaccines',
  'enfermera': 'vaccines',
  'cuidados': 'vaccines',
  'informático': 'computer',
  'informática': 'computer',
  'computadora': 'computer',
  'laptop': 'computer',
  'soporte técnico': 'computer',
  
  // Técnicos
  'plomería': 'plumbing',
  'plomero': 'plumbing',
  'fontanería': 'plumbing',
  'fontanero': 'plumbing',
  'tubería': 'plumbing',
  'electricidad': 'electrical-services',
  'electricista': 'electrical-services',
  'eléctrico': 'electrical-services',
  'limpieza': 'cleaning-services',
  'limpiar': 'cleaning-services',
  'carpintería': 'carpenter',
  'carpintero': 'carpenter',
  'madera': 'carpenter',
  'pintura': 'format-paint',
  'pintor': 'format-paint',
  'lavandería': 'local-laundry-service',
  'lavado': 'local-laundry-service',
  'jardinería': 'yard',
  'jardín': 'yard',
  'jardinero': 'yard',
  'planta': 'yard',
  'mudanza': 'local-shipping',
  'mudanzas': 'local-shipping',
  'aire': 'ac-unit',
  'acondicionado': 'ac-unit',
  'clima': 'ac-unit',
  'refrigeración': 'ac-unit',
  'cosmetología': 'spa',
  'cosmético': 'spa',
  'belleza': 'spa',
  'estética': 'spa',
  'cámara': 'security',
  'seguridad': 'security',
  'cerrajería': 'vpn-key',
  'cerrajero': 'vpn-key',
  'llave': 'vpn-key',
  'electrodoméstico': 'build',
  'reparación': 'build',
  'reparar': 'build',
  'celular': 'phone-android',
  'teléfono': 'phone-android',
  'móvil': 'phone-android',
  'auto': 'local-car-wash',
  'carro': 'local-car-wash',
  'vehículo': 'local-car-wash',
  'mascota': 'pets',
  'animal': 'pets',
  'albañil': 'construction',
  'albañilería': 'construction',
  'construcción': 'construction',
  'técnico': 'build',
  'tapicero': 'chair',
  'tapicería': 'chair',
  'colocador': 'layers',
  'gasista': 'local-gas-station',
  'gas': 'local-gas-station',
  'arquitecto': 'home',
  'arquitectura': 'home',
  'herrero': 'hardware',
  'herrería': 'hardware',
  'decorador': 'palette',
  'decoración': 'palette',
  'plaga': 'bug-report',
  'control': 'bug-report',
  'piscina': 'pool',
  'pileta': 'pool',
  'bienestar': 'spa',
  'cuidado': 'favorite',
  'cuidador': 'favorite',
  'evento': 'event',
  'fiesta': 'event',
};

/**
 * Obtiene el icono para una categoría
 * Si no tiene icono definido, busca por palabras clave en el nombre
 */
export function getCategoryIcon(categoryName: string): keyof typeof MaterialIcons.glyphMap {
  // Primero verificar si tiene icono definido directamente
  if (categoryIcons[categoryName]) {
    return categoryIcons[categoryName];
  }
  
  // Si no, buscar por palabras clave en el nombre
  const nameLower = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = nameLower.split(/\s+/);
  
  // Buscar coincidencias en palabras clave
  for (const word of words) {
    if (keywordToIconMap[word]) {
      return keywordToIconMap[word];
    }
  }
  
  // Buscar coincidencias parciales
  for (const [keyword, icon] of Object.entries(keywordToIconMap)) {
    if (nameLower.includes(keyword) || keyword.includes(nameLower)) {
      return icon;
    }
  }
  
  // Si no encuentra nada, usar el icono por defecto
  return categoryIcons.default;
}

/**
 * Colores para las categorías
 */
export const categoryColors: Record<string, string> = {
  'Plomería': '#4F46E5',
  'Electricidad': '#F59E0B',
  'Limpieza': '#10B981',
  'Carpintería': '#8B5CF6',
  'Pintura': '#EF4444',
  'Lavandería': '#06B6D4',
  'Jardinería': '#14B8A6',
  'Mudanzas': '#6366F1',
  'Aire Acondicionado': '#3B82F6',
  'Cosmetología': '#EC4899',
  'Cámaras de Seguridad': '#64748B',
  'Cerrajería': '#F97316',
  'Reparación de Electrodomésticos': '#84CC16',
  'Reparación de Celulares': '#8B5CF6',
  'Lavado de Autos a Domicilio': '#06B6D4',
  'Mascotas': '#F59E0B',
  'Abogados y Notarios': '#6366F1',
  'Diseño Gráfico': '#EC4899',
  'Médicos Especialistas': '#EF4444',
  'Médicos Generales': '#10B981',
  'Sastrería': '#7C3AED',
  'Fotografía y Video': '#0EA5E9',
  'Enfermería': '#059669',
  'Informáticos': '#4F46E5',
  'Contadores': '#0369A1',
  'Programador Freelance': '#7C3AED',
  'Community Manager': '#6366F1',
  'default': '#6B7280',
};

/**
 * Obtiene el color para una categoría
 */
export function getCategoryColor(categoryName: string): string {
  return categoryColors[categoryName] || categoryColors.default;
}
