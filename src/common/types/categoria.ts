export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  cantidadProveedores: number;
  color: string;
}

export const CATEGORIAS_POPULARES: Categoria[] = [
  {
    id: '1',
    nombre: 'Fontanería',
    icono: '🔧',
    descripcion: 'Reparación e instalación de tuberías',
    cantidadProveedores: 50,
    color: '#4F46E5',
  },
  {
    id: '2',
    nombre: 'Electricidad',
    icono: '⚡',
    descripcion: 'Instalaciones eléctricas y reparaciones',
    cantidadProveedores: 45,
    color: '#F59E0B',
  },
  {
    id: '3',
    nombre: 'Limpieza',
    icono: '🧹',
    descripcion: 'Servicios de limpieza profesional',
    cantidadProveedores: 80,
    color: '#10B981',
  },
  {
    id: '4',
    nombre: 'Jardinería',
    icono: '🌿',
    descripcion: 'Mantenimiento de jardines y áreas verdes',
    cantidadProveedores: 30,
    color: '#14B8A6',
  },
  {
    id: '5',
    nombre: 'Pintura',
    icono: '🎨',
    descripcion: 'Pintura interior y exterior',
    cantidadProveedores: 25,
    color: '#EF4444',
  },
  {
    id: '6',
    nombre: 'Carpintería',
    icono: '🔨',
    descripcion: 'Trabajos en madera y muebles',
    cantidadProveedores: 20,
    color: '#8B5CF6',
  },
];

