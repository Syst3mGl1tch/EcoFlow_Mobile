import { API_URL } from './api';
import { Usuario } from '../types/Usuario';

export interface LoginDTO {
  username: string;
  password: string;
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { erro?: string; message?: string };
    return data.erro ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function login(data: LoginDTO): Promise<Usuario> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Email ou senha invalidos.'));
  }
  return res.json();
}
