import { API_URL } from './api';
import { Avaliacao, CreateAvaliacaoDTO } from '../types/Avaliacao';

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { erro?: string; message?: string };
    return data.erro ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getAvaliacoes(): Promise<Avaliacao[]> {
  const res = await fetch(`${API_URL}/avaliacoes`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar avaliacoes'));
  return res.json();
}

export async function getAvaliacaoById(id: number): Promise<Avaliacao> {
  const res = await fetch(`${API_URL}/avaliacoes/${id}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Avaliacao nao encontrada'));
  return res.json();
}

export async function getAvaliacoesByProduto(produtoId: number): Promise<Avaliacao[]> {
  const res = await fetch(`${API_URL}/avaliacoes/produto/${produtoId}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar avaliacoes'));
  return res.json();
}

export async function getAvaliacoesByUsuario(usuarioId: number): Promise<Avaliacao[]> {
  const res = await fetch(`${API_URL}/avaliacoes/usuario/${usuarioId}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar avaliacoes'));
  return res.json();
}

export async function createAvaliacao(data: CreateAvaliacaoDTO): Promise<Avaliacao> {
  const res = await fetch(`${API_URL}/avaliacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao criar avaliacao'));
  return res.json();
}

export async function updateAvaliacao(id: number, comentario: string): Promise<Avaliacao> {
  const res = await fetch(`${API_URL}/avaliacoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comentario }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao atualizar avaliacao'));
  return res.json();
}

export async function deleteAvaliacao(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/avaliacoes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao deletar avaliacao'));
}
