export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'SUSPENSO';

export interface Usuario {
  id: number;
  nome: string;
  username: string;
  nivelAcesso?: string;
  temFoto?: boolean;
  dataCadastro?: string;
  dataAtualizacao?: string;
  statusUsuario: StatusUsuario;
}

export interface CreateUsuarioDTO {
  nome: string;
  username: string;
  password: string;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  username?: string;
}
