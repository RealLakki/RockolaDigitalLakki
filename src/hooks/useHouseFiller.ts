import { useEffect, useRef } from 'react';
import { getRandomHouseTrack } from '../lib/houseArtists';
import { resolveOnYoutube } from '../lib/youtube';
import { enqueueTrack } from '../lib/supabase';
import type { QueueItem, ResolvedTrack } from '../lib/types';

interface Args {
  venueId: string;
  queued: QueueItem[];
  nowPlaying: QueueItem | null;
  /** Si false, no auto-fill (modo silencio voluntario). */
  enabled?: boolean;
  /** Cuántos ms esperar antes de inyectar el pre-fetched cuando hay silencio
   *  (margen para que admin meta algo manualmente). Default 1500ms. */
  silenceMs?: number;
}

/**
 * Auto-fill con "Las de siempre" cuando la cola se queda vacía. Estrategia:
 *
 * 1. PRE-FETCH: apenas `queued.length === 0`, empieza a buscar/resolver una
 *    canción de la casa en background, AUNQUE haya nowPlaying. Resultado
 *    queda en `prefetchedRef`.
 * 2. INJECT: cuando además se acaba el silencio (no nowPlaying + queue vacía),
 *    espera `silenceMs` y enqueue el pre-fetched instantáneamente. Si admin
 *    agregó algo en ese tiempo, descarta el pre-fetched.
 *
 * Tiempo total de silencio: ~1.5-2s (vs 8-10s sin pre-fetch).
 */
export function useHouseFiller({
  venueId,
  queued,
  nowPlaying,
  enabled = true,
  silenceMs = 1500,
}: Args) {
  const prefetchedRef = useRef<ResolvedTrack | null>(null);
  const fetchingRef = useRef(false);
  const enqueueTimerRef = useRef<number | null>(null);

  // ─── Pre-fetch en background ───
  // Apenas la cola se queda vacía, busca y resuelve una canción para tenerla lista.
  useEffect(() => {
    if (!enabled) return;
    if (queued.length > 0) {
      // Cola tiene canciones, no necesitamos pre-fetch
      prefetchedRef.current = null;
      return;
    }
    if (prefetchedRef.current || fetchingRef.current) return;

    fetchingRef.current = true;
    console.log('[house-filler] pre-fetching backup track...');
    void (async () => {
      try {
        const track = await getRandomHouseTrack(new Set());
        if (!track) {
          console.warn('[house-filler] pre-fetch: no track found');
          return;
        }
        const resolved = await resolveOnYoutube(track);
        if (!resolved) {
          console.warn('[house-filler] pre-fetch: could not resolve', track.title);
          return;
        }
        prefetchedRef.current = resolved;
        console.log('[house-filler] ✓ pre-fetched:', resolved.title, 'by', resolved.artists[0]);
      } catch (e) {
        console.error('[house-filler] pre-fetch error:', e);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [queued.length, enabled]);

  // ─── Inject cuando hay silencio ───
  useEffect(() => {
    if (!enabled) return;
    const isSilence = !nowPlaying && queued.length === 0;
    if (!isSilence) {
      // Cancelar timer pendiente si la cola se llenó
      if (enqueueTimerRef.current) {
        window.clearTimeout(enqueueTimerRef.current);
        enqueueTimerRef.current = null;
      }
      return;
    }
    if (enqueueTimerRef.current) return;

    enqueueTimerRef.current = window.setTimeout(async () => {
      enqueueTimerRef.current = null;

      // Si tenemos pre-fetched, instant-inject
      if (prefetchedRef.current) {
        const track = prefetchedRef.current;
        prefetchedRef.current = null;
        try {
          await enqueueTrack({
            venueId,
            track,
            requestedBy: 'house',
            requestedByName: 'La casa',
          });
          console.log('[house-filler] ✓ instant-injected:', track.title);
        } catch (e) {
          console.error('[house-filler] inject failed:', e);
        }
        return;
      }

      // Fallback lento: no había pre-fetched, hacer el ciclo completo ahora
      console.log('[house-filler] no pre-fetched, doing slow path');
      try {
        const track = await getRandomHouseTrack(new Set());
        if (!track) return;
        const resolved = await resolveOnYoutube(track);
        if (!resolved) return;
        await enqueueTrack({
          venueId,
          track: resolved,
          requestedBy: 'house',
          requestedByName: 'La casa',
        });
        console.log('[house-filler] ✓ slow-path added:', resolved.title);
      } catch (e) {
        console.error('[house-filler] slow path error:', e);
      }
    }, silenceMs);

    return () => {
      if (enqueueTimerRef.current) {
        window.clearTimeout(enqueueTimerRef.current);
        enqueueTimerRef.current = null;
      }
    };
  }, [nowPlaying, queued.length, enabled, silenceMs, venueId]);
}
