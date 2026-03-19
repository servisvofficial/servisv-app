import { getOrCreateChat } from '@/features/chat/services/get-or-create-chat';
import { supabase } from '../lib/supabase/supabaseClient';

export interface CreateQuoteData {
  requestId: string;
  providerId: string;
  providerName: string;
  clientId?: string;
  price: number;
  description: string;
  estimatedDate?: string;
  estimatedDuration?: string;
}

export const createQuote = async (quoteData: CreateQuoteData) => {
  // Obtener la solicitud para determinar si es prioritaria
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('preferred_providers, client_id')
    .eq('id', quoteData.requestId)
    .single();

  if (requestError) {
    throw new Error('Error al obtener la solicitud: ' + requestError.message);
  }

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  // Verificar si el proveedor está en los proveedores preferidos
  const isPriority = request.preferred_providers?.includes(quoteData.providerId) || false;

  // Preparar datos para la BD
  let estimatedDateFormatted = null;
  if (quoteData.estimatedDate) {
    // Si es un string de fecha (YYYY-MM-DD), convertirlo a ISO
    if (typeof quoteData.estimatedDate === 'string' && quoteData.estimatedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      estimatedDateFormatted = new Date(quoteData.estimatedDate).toISOString();
    } else {
      estimatedDateFormatted = quoteData.estimatedDate;
    }
  }

  const dbData = {
    request_id: quoteData.requestId,
    provider_id: quoteData.providerId,
    provider_name: quoteData.providerName,
    client_id: request.client_id || quoteData.clientId || null,
    price: quoteData.price,
    description: quoteData.description,
    status: 'pending' as const,
    is_priority: isPriority,
    estimated_date: estimatedDateFormatted,
    estimated_duration: quoteData.estimatedDuration || null,
  };

  // Insertar quote en la BD
  const { data: newQuoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert(dbData)
    .select()
    .single();

  if (quoteError) {
    console.error('Error al crear quote:', quoteError);
    throw new Error('Error al crear el presupuesto: ' + quoteError.message);
  }

  if (!newQuoteData) {
    throw new Error('No se pudo crear el presupuesto');
  }

  // Actualizar estado de request_providers a 'quoted' si existe
  await supabase
    .from('request_providers')
    .update({ status: 'quoted', updated_at: new Date().toISOString() })
    .eq('request_id', quoteData.requestId)
    .eq('provider_id', quoteData.providerId);

  // Actualizar estado de la solicitud a 'quoted' si es necesario
  const { data: existingQuotes } = await supabase
    .from('quotes')
    .select('id')
    .eq('request_id', quoteData.requestId)
    .eq('status', 'pending');

  if (existingQuotes && existingQuotes.length > 0) {
    await supabase
      .from('requests')
      .update({ status: 'quoted', updated_at: new Date().toISOString() })
      .eq('id', quoteData.requestId);
  }

  // Crear o abrir el chat con el cliente para esta solicitud (el pro ya mandó cotización)
  const clientId = request.client_id || quoteData.clientId;
  if (clientId) {
    await getOrCreateChat(clientId, quoteData.providerId, quoteData.requestId);
  }

  return newQuoteData;
};
