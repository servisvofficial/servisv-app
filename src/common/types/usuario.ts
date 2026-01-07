export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar?: string;
  rol: 'cliente' | 'proveedor' | 'ambos';
  verificado: boolean;
  fechaRegistro: Date;
  ubicacion?: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
}

