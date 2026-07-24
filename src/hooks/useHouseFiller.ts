import { useEffect, useRef } from 'react';
import { getRandomHouseTrack } from '../lib/houseArtists';
import { getTrackTags, isLastfmEnabled } from '../lib/lastfm';
import { resolveOnYoutube } from '../lib/youtube';
import { enqueueTrack } from '../lib/api';
import { genreMatchedFor, type Genre, type QueueItem, type ResolvedTrack } from '../lib/types';

interface Args {
  venueId: string;
  queued: QueueItem[];
  nowPlaying: QueueItem | null;
  /** Si está poblado, las canciones del filler se filtran por estos géneros. */
  allowedGenres?: Genre[];
  /** Si false, no auto-fill (modo silencio voluntario). */
  enabled?: boolean;
  /** Cuántos ms esperar antes de inyectar el pre-fetched cuando hay silencio
   *  (margen para que admin meta algo manualmente). Default 1500ms. */
  silenceMs?: number;
}

/** Verifica que un track candidato del house-filler pase el filtro de género
 * si hay filtros activos. Si Last.fm no está habilitado, no podemos filtrar
 * y dejamos pasar (mejor 1 canción "off-genre" que silencio total). */
async function passesFilter(
  artist: string,
  title: string,
  itunesGenre: string | undefined,
  allowedGenres: Genre[],
): Promise<boolean> {
  if (allowedGenres.length === 0) return true;
  if (!isLastfmEnabled()) return true;
  try {
    const tags = await getTrackTags(artist, title);
    const result = genreMatchedFor(tags, itunesGenre, allowedGenres);
    return result.allowed;
  } catch {
    return true; // fail-open
  }
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
  allowedGenres = [],
  enabled = true,
  silenceMs = 1500,
}: Args) {
  // Memo del key para deps stable
  const genresKey = allowedGenres.slice().sort().join(',');
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
        // Hasta 5 intentos para encontrar uno que pase el filtro de género
        let track = null;
        let attempts = 0;
        while (attempts < 5) {
          attempts++;
          const candidate = await getRandomHouseTrack(new Set());
          if (!candidate) continue;
          const ok = await passesFilter(
            candidate.artists[0] ?? '',
            candidate.title,
            candidate.genres?.[0],
            allowedGenres,
          );
          if (ok) {
            track = candidate;
            break;
          }
          console.log('[house-filler] candidate filtered:', candidate.title, 'by', candidate.artists[0]);
        }

        if (!track) {
          console.warn('[house-filler] pre-fetch: no candidate passed filter after', attempts, 'tries');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued.length, enabled, genresKey]);

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
