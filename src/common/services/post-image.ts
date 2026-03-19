import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from "../lib/supabase/supabaseClient";

export const postImageToSupabase = async (
    imageUri: string,
    storagePath: string,
    fileExtension: string,
    bucket: string
) => {
    try {
        // Leer el archivo como base64 usando expo-file-system (legacy API)
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Determinar el tipo MIME correcto
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        // Subir la imagen usando Uint8Array
        const { error } = await supabase.storage
            .from(bucket)
            .upload(storagePath, byteArray, {
                cacheControl: '3600',
                upsert: false,
                contentType: mimeType,
            });

        if (error) {
            console.error("Error al subir la imagen:", error);
            return "";
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath);

        if (publicUrlData && publicUrlData.publicUrl) {
            return publicUrlData.publicUrl;
        } else {
            console.error("Error", "No se pudo obtener la URL pública de la imagen.");
            return "";
        }
    } catch (uploadError: any) {
        console.error("Error en el proceso de subida:", uploadError);
        return "";
    }
};
