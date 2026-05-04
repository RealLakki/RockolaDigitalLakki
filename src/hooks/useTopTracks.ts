import { useCallback, useEffect, useState } from 'react';
import { getTopTracks, supabase, type TopTrackRow } from '../lib/supabase';

/**
 * Carga las canciones más pedidas para un venue. Refresca cada 30s y
 * cuando hay cambios en la cola (algo se reprodujo / se agregó).
 */
export function useTopTracks(venueId: string | undefined, limit = 20) {
  const [tracks, setTracks] = useState<TopTrackRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!venueId) return;
    try {
      const data = await getTopTracks(venueId, limit);
      setTracks(data);
    } catch (e) {
      console.warn('[top-tracks] failed:', e);
    }
  }, [venueId, limit]);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    void refresh().finally(() => setLoading(false));

    // Refresca cuando algo cambia en la cola (después de played/skipped)
    const ch = supabase
      .channel(`top-tracks:${venueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items', filter: `venue_id=eq.${venueId}` },
        () => { void refresh(); },
      )
      .subscribe();

    // Polling adicional cada 30s por si el realtime perdió algún evento
    const interval = window.setInterval(() => { void refresh(); }, 30_000);

    return () => {
      void supabase.removeChannel(ch);
      window.clearInterval(interval);
    };
  }, [venueId, refresh]);

  return { tracks, loading, refresh };
}
