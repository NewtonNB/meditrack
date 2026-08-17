import { useState, useEffect, useCallback } from 'react';

/** Normalize paginated or wrapped API list responses into an array. */
export function getListItems(data) {
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Generic hook for API calls.
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => medicines.list());
 */
export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        return;
      }
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
