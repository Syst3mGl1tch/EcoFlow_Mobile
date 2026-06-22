import { useState, useEffect, useCallback } from 'react';
import { Avaliacao } from '../types/Avaliacao';
import { getAvaliacoesByProduto } from '../services/avaliacaoService';

export function useAvaliacoes(produtoId: number | null) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!produtoId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAvaliacoesByProduto(produtoId);
      setAvaliacoes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [produtoId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { avaliacoes, loading, error, refetch: fetch };
}
