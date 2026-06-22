import { Usuario } from './Usuario';
import { Categoria } from './Categoria';

export type StatusProduto = 'ATIVO' | 'INATIVO';

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  dataCadastro?: string;
  foto?: string;
  temFoto?: boolean;   // backend retorna true se existe foto salva
  telefone?: string;
  email?: string;
  usuario: Usuario;
  categoria: Categoria;
  statusProduto: StatusProduto;
}

export interface CreateProdutoDTO {
  nome: string;
  descricao: string;
  telefone?: string;
  email?: string;
  usuarioId: number;
  categoriaId: number;
  statusProduto: StatusProduto;
}
