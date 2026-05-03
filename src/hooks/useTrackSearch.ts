import { useEffect, useMemo, useRef, useState } from 'react';
import { itunesSearch } from '../lib/itunes';
import type { Genre, TrackSearchResult } from '../lib/types';

const DEBOUNCE_MS = 300;

export function useTrackSearch(
  query: string,
  allowExplicit: boolean,
  allowedGenres: Genre[] = [],
) {
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqIdRef = useRef(0);

  // Estabilizamos la referencia para que cambios irrelevantes no re-disparen
  const genresKey = useMemo(() => allowedGenres.slice().sort().join(','), [allowedGenres]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const myId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    const handle = window.setTimeout(() => {
      itunesSearch(q, {
        limit: 12,
        allowExplicit,
        allowedGenres: genresKey ? (genresKey.split(',') as Genre[]) : [],
      })
        .then((r) => {
          if (reqIdRef.current === myId) setResults(r);
        })
        .catch((e) => {
          if (reqIdRef.current === myId) setError(e as Error);
        })
        .finally(() => {
          if (reqIdRef.current === myId) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, allowExplicit, genresKey]);

  return { results, loading, error };
}
