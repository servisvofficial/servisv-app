import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { postFileToSupabase } from "../services/post-file";
import { postImageToSupabase } from "../services/post-image";

const useSupabaseStorage = (bucket: string) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleUploadImage = async (userId: string, chatId?: string) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            console.error("Permisos", "Necesitamos acceso a tu galería para subir fotos.");
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;

            let fileExtension = imageUri.split(".").pop();
            if (
                fileExtension &&
                ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(
                    fileExtension.toLowerCase()
                )
            ) {
                fileExtension = fileExtension.toLowerCase();
            } else {
                fileExtension = "jpeg";
            }

            const fileName = `${userId}-${Date.now()}.${fileExtension}`;
            const storagePath = chatId
                ? `${chatId}/${userId}/${fileName}`
                : `${userId}/${fileName}`;

            try {
                setIsLoading(true);

                const newImgUri = await postImageToSupabase(
                    imageUri,
                    storagePath,
                    fileExtension,
                    bucket
                );

                return newImgUri;
            } catch (error) {
                console.log("Error al subir la imagen:", error);
                return null;
            } finally {
                setIsLoading(false);
            }
        }
        return null;
    };

    const handleUploadDocument = async (userId: string, chatId?: string) => {
        try {
            setIsLoading(true);

            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/pdf",
                    "image/png",
                    "image/jpeg",
                    "image/jpg",
                ],
                copyToCacheDirectory: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const documentUri = result.assets[0].uri;
                const fileName = result.assets[0].name || `document-${Date.now()}`;
                const fileType = result.assets[0].mimeType || "application/pdf";

                const storagePath = chatId
                    ? `${chatId}/${userId}/files/${fileName}`
                    : `${userId}/files/${fileName}`;

                const newFileUrl = await postFileToSupabase(
                    documentUri,
                    storagePath,
                    fileType,
                    bucket
                );

                return newFileUrl ? { url: newFileUrl, fileName } : null;
            }
            return null;
        } catch (error) {
            console.error("Error al subir el archivo:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        handleUploadImage,
        handleUploadDocument,
        isLoading,
    };
};

export default useSupabaseStorage;
