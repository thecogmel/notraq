import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

/**
 * Abre a galeria para o usuário selecionar uma imagem de cupom fiscal.
 * Retorna a URI da imagem selecionada ou null se cancelou.
 */
export async function pickReceiptImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de acesso à galeria negada');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/**
 * Escaneia um QR code a partir de uma imagem (URI local).
 * Usa Camera.scanFromURLAsync do expo-camera.
 * Retorna a string do QR code ou null se não encontrou.
 */
export async function scanQrFromImage(imageUri: string): Promise<string | null> {
  try {
    const results = await Camera.scanFromURLAsync(imageUri, ['qr']);
    if (results.length > 0) {
      return results[0].data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fluxo completo: abre galeria → escaneia QR da imagem.
 * Retorna a URL do QR code ou null.
 */
export async function pickAndScanQr(): Promise<string | null> {
  const imageUri = await pickReceiptImage();
  if (!imageUri) return null;
  return scanQrFromImage(imageUri);
}
