import { API_URL } from './api';
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
  console.info('[DELETE produto] Enviando requisicao', { id, url, method: 'DELETE' });
  const res = await fetch(url, { method: 'DELETE' });
  console.info('[DELETE produto] Resposta recebida', { id, url, status: res.status, ok: res.ok });
  if (!res.ok) {
    const message = await getErrorMessage(res, 'Erro ao excluir anuncio');
    console.error('[DELETE produto] Falhou', { id, url, status: res.status, message });
    throw new Error(message);
  }
}

export async function uploadFoto(produtoId: number, imageUri: string): Promise<void> {
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

  const res = await fetch(`${API_URL}/produtos/${produtoId}/foto`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao fazer upload da foto'));
}

export function getProdutoFotoUrl(produtoId: number): string {
  return `${API_URL}/produtos/${produtoId}/foto`;
}
