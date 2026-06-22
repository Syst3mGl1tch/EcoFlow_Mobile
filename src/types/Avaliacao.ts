import { Usuario } from './Usuario';
import { Produto } from './Produto';

export interface Avaliacao {
  id: number;
  produto: Produto;
  usuario: Usuario;
  dataCadastro?: string;
  comentario: string;
}

export interface CreateAvaliacaoDTO {
  produtoId: number;
  usuarioId: number;
  comentario: string;
}
