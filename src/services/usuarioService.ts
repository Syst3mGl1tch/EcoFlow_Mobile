import { API_URL } from './api';
import { appendFotoToFormData, resolveFotoMeta } from './fotoUtils';
import { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/Usuario';
import type { FotoUpload } from './produtoService';

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

export async function uploadFotoUsuario(usuarioId: number, imagem: FotoUpload): Promise<void> {
  const { filename, type } = resolveFotoMeta(imagem);
  const formData = new FormData();
  await appendFotoToFormData(formData, imagem);

  const url = `${API_URL}/usuarios/${usuarioId}/foto`;
  console.log('[UPLOAD USUARIO] Iniciando', { id: usuarioId, uri: imagem.uri, name: filename, type });
  console.log('[UPLOAD USUARIO] URL', url);

  const res = await fetch(url, {
    method: 'PUT',
    body: formData,
  });

  console.log('[UPLOAD USUARIO] Status HTTP', res.status);
  if (!res.ok) {
    const message = await getErrorMessage(res, 'Erro ao fazer upload da foto');
    console.error('[UPLOAD USUARIO] Falhou', { id: usuarioId, url, status: res.status, message });
    throw new Error(message);
  }
}

export function getUsuarioFotoUrl(usuarioId: number, updatedAt?: number): string {
  const url = `${API_URL}/usuarios/${usuarioId}/foto`;
  return updatedAt ? `${url}?updated=${updatedAt}` : url;
}
