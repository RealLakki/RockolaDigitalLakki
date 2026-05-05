import { useEffect, useRef } from 'react';
import { getRandomHouseTrack } from '../lib/houseArtists';
import { resolveOnYoutube } from '../lib/youtube';
import { enqueueTrack } from '../lib/supabase';
import type { QueueItem } from '../lib/types';

interface Args {
  venueId: string;
  queued: QueueItem[];
  nowPlaying: QueueItem | null;
  /** Si false, no auto-fill (modo silencio voluntario). */
  enabled?: boolean;
  /** Cuántos segundos esperar antes de auto-fill (default 4s). */
  silenceMs?: number;
}

/**
 * Cuando la cola se queda vacía Y no hay canción sonando, agrega una canción
 * de "Las de siempre" automáticamente. Evita silencios prolongados.
 *
 * Reglas:
 * - Solo se ejecuta si NO hay nowPlaying NI queued.
 * - Espera `silenceMs` antes de actuar (por si el admin va a meter algo).
 * - Solo agrega 1 canción a la vez (lock con ref).
 * - Tracks de respaldo se marcan con `requestedBy: 'house'` y `requestedByName: 'La casa'`.
 * - Cuando alguien agrega manualmente, el filler NO interfiere (el effect detecta
 *   que ya no está vacía y no hace nada).
 */
export function useHouseFiller({
  venueId,
  queued,
  nowPlaying,
  enabled = true,
  silenceMs = 4000,
}: Args) {
  const fillingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const isEmpty = !nowPlaying && queued.length === 0;
    if (!isEmpty) {
      // Si la cola se llenó, cancelar timer pendiente
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Cola vacía — esperar `silenceMs` antes de auto-fill
    if (timerRef.current) return; // ya hay timer programado

    console.log('[house-filler] queue empty, will fill in', silenceMs, 'ms');
    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null;
      if (fillingRef.current) return;
      fillingRef.current = true;

      try {
        const exclude = new Set<string>(queued.map((q) => q.track.providerId));
        console.log('[house-filler] picking random track from house artists...');
        const track = await getRandomHouseTrack(exclude);
        if (!track) {
          console.warn('[house-filler] no track found for any artist');
          return;
        }
        console.log('[house-filler] picked:', track.title, 'by', track.artists[0]);

        const resolved = await resolveOnYoutube(track);
        if (!resolved) {
          console.warn('[house-filler] could not resolve on YouTube:', track.title);
          return;
        }

        await enqueueTrack({
          venueId,
          track: resolved,
          requestedBy: 'house',
          requestedByName: 'La casa',
        });
        console.log('[house-filler] ✓ added:', resolved.title);
      } catch (e) {
        console.error('[house-filler] error:', e);
      } finally {
        fillingRef.current = false;
      }
    }, silenceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [venueId, queued, nowPlaying, enabled, silenceMs]);
}
