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
    nombre: 'Limpieza',
    icono: '🧹',
    descripcion: 'Servicios de limpieza profesional',
    cantidadProveedores: 80,
    color: '#10B981',
  },
  {
    id: '2',
    nombre: 'Plomería',
    icono: '🔧',
    descripcion: 'Reparación e instalación de tuberías',
    cantidadProveedores: 50,
    color: '#4F46E5',
  },
  {
    id: '3',
    nombre: 'Electricidad',
    icono: '⚡',
    descripcion: 'Instalaciones eléctricas y reparaciones',
    cantidadProveedores: 45,
    color: '#F59E0B',
  },
  {
    id: '4',
    nombre: 'Cámaras de Seguridad',
    icono: '📹',
    descripcion: 'Instalación y monitoreo de cámaras',
    cantidadProveedores: 25,
    color: '#64748B',
  },
  {
    id: '5',
    nombre: 'Fotografía',
    icono: '📷',
    descripcion: 'Servicios de fotografía y video profesional',
    cantidadProveedores: 20,
    color: '#0EA5E9',
  },
  {
    id: '6',
    nombre: 'Cerrajería',
    icono: '🔑',
    descripcion: 'Aperturas, cerraduras y copias de llaves',
    cantidadProveedores: 30,
    color: '#F97316',
  },
];

