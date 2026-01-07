export interface Servicio {
  id: string;
  proveedorId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  precio: {
    tipo: 'fijo' | 'por_hora' | 'a_cotizar';
    valor?: number;
  };
  imagenes: string[];
  calificacion: number;
  cantidadReseñas: number;
  disponibilidad: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  apellido: string;
  avatar?: string;
  calificacion: number;
  cantidadTrabajos: number;
  verificado: boolean;
  categorias: string[];
}

