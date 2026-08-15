import { API_URL } from './api';
import { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/Usuario';

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { erro?: string; message?: string };
    return data.erro ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${API_URL}/usuarios`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar usuarios'));
  return res.json();
}

export async function getUsuarioById(id: number): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios/${id}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Usuario nao encontrado'));
  return res.json();
}

export async function createUsuario(data: CreateUsuarioDTO): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao criar usuario'));
  return res.json();
}

export async function updateUsuario(id: number, data: UpdateUsuarioDTO): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao atualizar usuario'));
  return res.json();
}

export async function deleteUsuario(id: number): Promise<void> {
  const url = `${API_URL}/usuarios/${id}`;
  console.info('[DELETE usuario] Enviando requisicao', { id, url, method: 'DELETE' });
  const res = await fetch(url, { method: 'DELETE' });
  console.info('[DELETE usuario] Resposta recebida', { id, url, status: res.status, ok: res.ok });
  if (!res.ok) {
    const message = await getErrorMessage(res, 'Erro ao excluir conta');
    console.error('[DELETE usuario] Falhou', { id, url, status: res.status, message });
    throw new Error(message);
  }
}

export async function uploadFotoUsuario(usuarioId: number, imageUri: string): Promise<void> {
  const filename = imageUri.split('/').pop() ?? 'foto.jpg';
  const match = /\.([a-zA-Z]+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const type = mimeMap[ext] ?? 'image/jpeg';
  const file = { uri: imageUri, name: filename, type };

  const formData = new FormData();
  formData.append('foto', file as unknown as Blob);

  const res = await fetch(`${API_URL}/usuarios/${usuarioId}/foto`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao fazer upload da foto'));
}

export function getUsuarioFotoUrl(usuarioId: number): string {
  return `${API_URL}/usuarios/${usuarioId}/foto`;
}
