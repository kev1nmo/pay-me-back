import { useEffect, useState } from 'react';
import { fetchRates, type RateTable } from './rates';

export function useRates(base: string) {
  const [table, setTable] = useState<RateTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTable(null);
    fetchRates(base)
      .then((t) => !cancelled && setTable(t))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [base]);

  return { table, error, loading };
}
