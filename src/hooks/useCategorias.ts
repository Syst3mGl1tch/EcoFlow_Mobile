import { useState, useEffect } from 'react';
import { Categoria } from '../types/Categoria';
import { getCategorias } from '../services/categoriaService';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCategorias()
      .then(setCategorias)
      .catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'))
      .finally(() => setLoading(false));
  }, []);

  return { categorias, loading, error };
}
