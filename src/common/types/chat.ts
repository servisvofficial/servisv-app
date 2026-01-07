export interface Chat {
  id: string;
  participantes: string[];
  ultimoMensaje?: Mensaje;
  fechaActualizacion: Date;
  noLeidos: number;
}

export interface Mensaje {
  id: string;
  chatId: string;
  remitenteId: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'archivo';
  fechaEnvio: Date;
  leido: boolean;
}

