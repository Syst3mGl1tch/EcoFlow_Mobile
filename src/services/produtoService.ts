import { API_URL } from './api';
import { appendFotoToFormData, resolveFotoMeta } from './fotoUtils';
import { Produto, CreateProdutoDTO } from '../types/Produto';

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { erro?: string; message?: string };
    return data.erro ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getProdutos(params?: { categoriaId?: number; usuarioId?: number }): Promise<Produto[]> {
  const query = new URLSearchParams();
  if (params?.categoriaId) query.append('categoriaId', String(params.categoriaId));
  if (params?.usuarioId) query.append('usuarioId', String(params.usuarioId));
  const qs = query.toString();
  const res = await fetch(`${API_URL}/produtos${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar produtos'));
  return res.json();
}

export async function getProdutoById(id: number): Promise<Produto> {
  const res = await fetch(`${API_URL}/produtos/${id}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Produto nao encontrado'));
  return res.json();
}

export async function createProduto(data: CreateProdutoDTO): Promise<Produto> {
  const res = await fetch(`${API_URL}/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao criar produto'));
  return res.json();
}

export async function updateProduto(id: number, data: Partial<CreateProdutoDTO>): Promise<Produto> {
  const { usuarioId: _usuarioId, ...payload } = data;
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao atualizar produto'));
  return res.json();
}

export async function deactivateProduto(id: number): Promise<Produto> {
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statusProduto: 'INATIVO' }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao desativar produto'));
  return res.json();
}

export async function deleteProduto(id: number): Promise<void> {
  const url = `${API_URL}/produtos/${id}`;
  console.info('[DELETE PRODUTO] id:', id);
  console.info('[DELETE PRODUTO] url:', url);
  const res = await fetch(url, { method: 'DELETE' });
  console.info('[DELETE PRODUTO] status:', res.status);
  if (!res.ok) {
    const message = await getErrorMessage(res, 'Erro ao desativar produto');
    throw new Error(message);
  }
}

export interface FotoUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function uploadFotoProduto(produtoId: number, imagem: FotoUpload): Promise<void> {
  const { filename, type } = resolveFotoMeta(imagem);
  const formData = new FormData();
  await appendFotoToFormData(formData, imagem);

  const url = `${API_URL}/produtos/${produtoId}/foto`;
  console.log('[UPLOAD PRODUTO] Iniciando', { id: produtoId, uri: imagem.uri, name: filename, type });
  console.log('[UPLOAD PRODUTO] URL', url);

  const res = await fetch(url, {
    method: 'PUT',
    body: formData,
  });

  console.log('[UPLOAD PRODUTO] Status HTTP', res.status);
  if (!res.ok) {
    const message = await getErrorMessage(res, 'Erro ao fazer upload da foto');
    console.error('[UPLOAD PRODUTO] Falhou', { id: produtoId, url, status: res.status, message });
    throw new Error(message);
  }
}

/** @deprecated Use uploadFotoProduto */
export const uploadFoto = uploadFotoProduto;

export function getProdutoFotoUrl(produtoId: number, updatedAt?: number): string {
  const url = `${API_URL}/produtos/${produtoId}/foto`;
  return updatedAt ? `${url}?updated=${updatedAt}` : url;
}
