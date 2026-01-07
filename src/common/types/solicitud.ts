export type EstadoSolicitud = 'abierta' | 'en_progreso' | 'completada' | 'cancelada';

export interface Solicitud {
  id: string;
  usuarioId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  ubicacion: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
  estado: EstadoSolicitud;
  presupuesto?: {
    minimo: number;
    maximo: number;
  };
  imagenes?: string[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

