import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchActiveQueue, supabase } from '../lib/supabase';
import type { QueueItem } from '../lib/types';

/**
 * Suscripción realtime a la cola. Memoizamos `queued` y `nowPlaying` para que
 * mantengan referencia estable entre renders mientras los items no cambien
 * (sin esto, los componentes hijos re-disparan animaciones en cada tick).
 */
export function useQueue(venueId: string | undefined) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!venueId) return Promise.resolve();
    return fetchActiveQueue(venueId).then(setItems);
  }, [venueId]);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    void refresh().finally(() => setLoading(false));

    const ch = supabase
      .channel(`queue:${venueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items', filter: `venue_id=eq.${venueId}` },
        () => { void refresh(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(ch); };
  }, [venueId, refresh]);

  const nowPlaying = useMemo(
    () => items.find((i) => i.status === 'playing') ?? null,
    [items],
  );

  const queued = useMemo(
    () => items
      .filter((i) => i.status === 'queued')
      .sort((a, b) => a.position - b.position),
    [items],
  );

  return { items, queued, nowPlaying, loading, refresh };
}
