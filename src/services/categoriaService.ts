import { API_URL } from './api';
import { Categoria } from '../types/Categoria';

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { erro?: string; message?: string };
    return data.erro ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/categorias`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao buscar categorias'));
  return res.json();
}

export async function getCategoriaById(id: number): Promise<Categoria> {
  const res = await fetch(`${API_URL}/categorias/${id}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Categoria nao encontrada'));
  return res.json();
}

export async function createCategoria(nome: string): Promise<Categoria> {
  const res = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao criar categoria'));
  return res.json();
}

export async function updateCategoria(id: number, nome: string): Promise<Categoria> {
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao atualizar categoria'));
  return res.json();
}

export async function deleteCategoria(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Erro ao excluir categoria'));
}
