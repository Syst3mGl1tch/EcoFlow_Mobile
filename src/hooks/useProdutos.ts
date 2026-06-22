import { useState, useEffect, useCallback } from 'react';
import { Produto } from '../types/Produto';
import { getProdutos } from '../services/produtoService';

interface Params {
  categoriaId?: number;
  usuarioId?: number;
}

export function useProdutos(params?: Params) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProdutos(params);
      setProdutos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [params?.categoriaId, params?.usuarioId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { produtos, loading, error, refetch: fetch };
}
