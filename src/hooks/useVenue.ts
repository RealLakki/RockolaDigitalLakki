import { useEffect, useState } from 'react';
import { getVenueBySlug, supabase } from '../lib/supabase';
import type { Venue } from '../lib/types';

export function useVenue(slug: string | undefined) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getVenueBySlug(slug)
      .then((v) => { if (!cancelled) setVenue(v); })
      .catch((e) => { if (!cancelled) setError(e as Error); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  // Realtime: si admin cambia config (géneros, blocks), se refleja en clientes.
  useEffect(() => {
    if (!venue) return;
    const ch = supabase
      .channel(`venue:${venue.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'venues', filter: `id=eq.${venue.id}` },
        () => { void getVenueBySlug(venue.slug).then((v) => v && setVenue(v)); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [venue]);

  return { venue, loading, error, setVenue };
}
