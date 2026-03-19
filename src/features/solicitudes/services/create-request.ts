import { supabase } from '@/common/lib/supabase/supabaseClient';
import type { CreateRequestData } from '../contexts/CreateRequestContext';

export const createRequest = async (
  userId: string,
  data: CreateRequestData
): Promise<{ id: string }> => {
  try {
    // Obtener nombre del cliente desde Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, last_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
    }

    const clientName = userData 
      ? `${userData.name} ${userData.last_name || ''}`.trim()
      : 'Usuario';

    // Preparar los datos para insertar
    // Nota: preferred_time no existe en la tabla, solo scheduled_date
    const payload: any = {
      client_id: userId,
      client_name: clientName,
      title: data.title,
      description: data.description,
      service_category: data.serviceCategory,
      subcategory: data.subcategory || null,
      location: data.location,
      coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
      scheduled_date: data.scheduledDate || null,
      // preferred_time no existe en la tabla requests
      photos: data.photos && data.photos.length > 0 ? data.photos : null,
      preferred_providers: data.preferredProviders && data.preferredProviders.length > 0 
        ? data.preferredProviders 
        : null,
      status: 'open', // Estado inicial
    };

    const { data: request, error } = await supabase
      .from('requests')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      console.error('Error al crear la solicitud:', error);
      throw new Error(`Error al crear la solicitud: ${error.message}`);
    }

    if (!request) {
      throw new Error('No se pudo crear la solicitud');
    }

    return { id: request.id };
  } catch (error) {
    console.error('Error inesperado al crear solicitud:', error);
    throw error;
  }
};
