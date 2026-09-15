import type { Request } from '../types/request';

/**
 * Nombres de las categorías populares definidas para la aplicación en el orden deseado:
 * 1. Limpieza
 * 2. Plomería
 * 3. Electricidad
 * 4. Cámaras de Seguridad
 * 5. Fotografía y Video (o Fotografía)
 * 6. Cerrajería
 */
export const POPULAR_CATEGORY_NAMES = [
  'Limpieza',
  'Plomería',
  'Electricidad',
  'Cámaras de Seguridad',
  'Fotografía y Video',
  'Cerrajería',
] as const;

/**
 * Normaliza una cadena eliminando tildes, signos diacríticos y espacios sobrantes
 */
export function normalizeCategoryName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Obtiene las categorías populares a partir de la lista general de categorías,
 * ordenadas según la lista oficial de categorías populares.
 *
 * @param categories Lista de categorías obtenidas de la base de datos (Request[])
 * @param limit Límite de categorías a devolver (por defecto 6)
 */
export function getCategoriasPopulares(
  categories: Request[],
  limit = 6
): Request[] {
  if (!categories || categories.length === 0) return [];

  const found: Request[] = [];

  for (const popularName of POPULAR_CATEGORY_NAMES) {
    const normTarget = normalizeCategoryName(popularName);
    const match = categories.find((cat) => {
      const normCat = normalizeCategoryName(cat.name);
      return (
        normCat === normTarget ||
        normCat.startsWith(normTarget) ||
        normTarget.startsWith(normCat) ||
        (normTarget.includes('fotografia') && normCat.includes('fotografia'))
      );
    });

    if (match && !found.some((f) => f.id === match.id)) {
      found.push(match);
    }
  }

  // Fallback: Si no se encuentran suficientes categorías populares, rellenar con las restantes
  if (found.length < limit) {
    for (const cat of categories) {
      if (!found.some((f) => f.id === cat.id)) {
        found.push(cat);
        if (found.length === limit) break;
      }
    }
  }

  return found.slice(0, limit);
}
