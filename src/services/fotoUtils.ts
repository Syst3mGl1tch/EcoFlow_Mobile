import { Platform } from 'react-native';
import type { FotoUpload } from './produtoService';

export function resolveFotoMeta(imagem: FotoUpload): { filename: string; type: string } {
  const filename = imagem.fileName ?? imagem.uri.split('/').pop() ?? 'foto.jpg';
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const type = imagem.mimeType ?? mimeMap[ext] ?? 'image/jpeg';
  return { filename, type };
}

export async function appendFotoToFormData(
  formData: FormData,
  imagem: FotoUpload,
): Promise<{ name: string; type: string }> {
  const { filename, type } = resolveFotoMeta(imagem);

  if (Platform.OS === 'web') {
    const response = await fetch(imagem.uri);
    if (!response.ok) {
      throw new Error('Nao foi possivel ler a imagem selecionada');
    }
    const blob = await response.blob();
    formData.append('foto', blob, filename);
  } else {
    formData.append('foto', { uri: imagem.uri, name: filename, type } as unknown as Blob);
  }

  return { name: filename, type };
}
