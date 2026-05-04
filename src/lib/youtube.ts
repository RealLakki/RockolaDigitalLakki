import type { ResolvedTrack, TrackSearchResult } from './types';
import { pickBestCandidate, type YoutubeCandidate } from '../utils/youtubeFilter';
import { cacheYoutubeResolution, getCachedYoutubeResolution } from './supabase';

export const YT_PROVIDER_PREFIX = 'yt:';

/**
 * Resuelve un TrackSearchResult (de Spotify) al mejor video oficial de YouTube.
 * Pasos:
 *  1) Búsqueda en Music category (videoCategoryId=10) — query: "artist title"
 *  2) Trae detalles (duration, viewCount, channel) en una sola call
 *  3) Scoring vía youtubeFilter.ts
 *  4) Devuelve el ganador o null si nadie pasa el umbral mínimo
 *
 * Nota: la API key debe estar restringida por HTTP referrer en Google Cloud
 * Console — de lo contrario cualquiera puede agotarte la cuota.
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';
const MIN_ACCEPTABLE_SCORE = 28;
const MAX_RESULTS = 15;

interface YtSearchItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; channelId: string; publishedAt: string };
}

interface YtVideosItem {
  id: string;
  snippet: { title: string; channelTitle: string; channelId: string; publishedAt: string };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
}

/** PT3M21S → 201000 */
function isoDurationToMs(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return ((h * 60 + min) * 60 + s) * 1000;
}

async function searchVideos(query: string): Promise<string[]> {
  const params = new URLSearchParams({
    key: import.meta.env.VITE_YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    maxResults: String(MAX_RESULTS),
    q: query,
  });
  const res = await fetch(`${YT_API}/search?${params}`);
  if (!res.ok) throw new Error(`YT search failed: ${res.status}`);
  const data = (await res.json()) as { items: YtSearchItem[] };
  return data.items.map((i) => i.id.videoId).filter(Boolean);
}

async function getVideoDetails(ids: string[]): Promise<YoutubeCandidate[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    key: import.meta.env.VITE_YOUTUBE_API_KEY,
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
  });
  const res = await fetch(`${YT_API}/videos?${params}`);
  if (!res.ok) throw new Error(`YT videos failed: ${res.status}`);
  const data = (await res.json()) as { items: YtVideosItem[] };

  return data.items.map((v) => ({
    videoId: v.id,
    title: v.snippet.title,
    channelTitle: v.snippet.channelTitle,
    channelId: v.snippet.channelId,
    durationMs: isoDurationToMs(v.contentDetails.duration),
    viewCount: parseInt(v.statistics.viewCount ?? '0', 10),
    publishedAt: v.snippet.publishedAt,
    // Heurística simple — verificación real requiere channels.list con auth
    channelLooksOfficial:
      /\bofficial\b/i.test(v.snippet.channelTitle) ||
      /VEVO$/i.test(v.snippet.channelTitle) ||
      /Music$/i.test(v.snippet.channelTitle),
  }));
}

/**
 * Búsqueda directa en YouTube como fallback cuando iTunes no tiene la canción.
 * Devuelve TrackSearchResult[] con providerId = "yt:VIDEOID" para que el
 * handleAdd sepa saltarse el resolver (el videoId ya lo tenemos).
 *
 * Filtra duro: solo videos oficiales (VEVO, "official", canal verificado),
 * descarta covers/karaoke/lives. Asi el fallback no abre la puerta a basura.
 */
export async function youtubeSearchAsTracks(query: string): Promise<TrackSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const ids = await searchVideos(q);
  const candidates = await getVideoDetails(ids);

  // Filtro: descartamos covers/karaoke/live/etc evaluando keywords negativos
  const NEGATIVES = /\b(karaoke|cover|tutorial|reaction|sped up|slowed|nightcore|8d|bass boosted|mashup|parody)\b/i;

  const usable = candidates
    .filter((c) => !NEGATIVES.test(c.title))
    .filter((c) => c.durationMs >= 60_000 && c.durationMs <= 600_000) // 1-10 min razonable
    .sort((a, b) => b.viewCount - a.viewCount); // por popularidad

  return usable.slice(0, 12).map((c) => {
    // Parseamos "Artista - Titulo" del título de YouTube si lo tiene formato común
    const dashSplit = c.title.split(/\s+[-–—]\s+/);
    let artist = c.channelTitle.replace(/VEVO$/i, '').replace(/Music$/i, '').trim();
    let title = c.title;
    if (dashSplit.length >= 2) {
      // "Karol G - PROVENZA (Official Video)" → artist="Karol G", title="PROVENZA"
      artist = dashSplit[0].trim();
      title = dashSplit.slice(1).join(' - ').trim();
    }
    // Limpia sufijos comunes
    title = title.replace(/\s*\((official|video|audio|music|lyric|hd|4k)[^)]*\)\s*/gi, '').trim();
    title = title.replace(/\s*\[(official|video|audio|music|lyric|hd|4k)[^\]]*\]\s*/gi, '').trim();

    return {
      providerId: `${YT_PROVIDER_PREFIX}${c.videoId}`,
      title,
      artists: [artist],
      durationMs: c.durationMs,
      // YouTube thumbnail más grande
      imageUrl: `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg`,
      explicit: false,
    } satisfies TrackSearchResult;
  });
}

/** Detecta si un track viene de YouTube fallback (skip resolver). */
export function isYoutubeProvidedTrack(track: TrackSearchResult): boolean {
  return track.providerId.startsWith(YT_PROVIDER_PREFIX);
}

/** Convierte un YT-provided track a ResolvedTrack sin pasar por resolver. */
export function ytTrackToResolved(track: TrackSearchResult): ResolvedTrack {
  return {
    ...track,
    youtubeVideoId: track.providerId.slice(YT_PROVIDER_PREFIX.length),
    isOfficial: false, // no garantizamos oficialidad cuando viene de fallback
    hasVideo: true,    // asumimos video; si es solo audio el visualizer no aplica
  };
}

export async function resolveOnYoutube(
  track: TrackSearchResult,
): Promise<ResolvedTrack | null> {
  // Cache hit: si ya resolvimos esta canción antes (cualquier bar, alguna vez),
  // devolvemos el videoId guardado sin gastar cuota de YouTube API.
  // Esto es lo que permite escalar — canciones populares se resuelven 1 vez.
  const cached = await getCachedYoutubeResolution(track.providerId);
  if (cached) {
    if (import.meta.env.DEV) {
      console.log(`[youtube] CACHE HIT for "${track.title}" → ${cached.youtubeVideoId}`);
    }
    return { ...track, ...cached };
  }

  // Query LIMPIA — sin "official" en el query, eso sesga a YT a devolver
  // los videos más populares oficiales del artista (aunque no sean la canción
  // pedida). El bonus por "official" se aplica en el scoring, no en la query.
  const query = `${track.artists[0] ?? ''} ${track.title}`.trim();
  const ids = await searchVideos(query);
  const candidates = await getVideoDetails(ids);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { scoreCandidate } = await import('../utils/youtubeFilter');
    const allScored = candidates.map((c) => scoreCandidate(c, track));
    allScored.sort((a, b) => b.score - a.score);
    console.log(
      `[youtube] resolving "${track.artists[0]} - ${track.title}" — top 3:`,
      allScored.slice(0, 3).map((s) => ({
        title: s.candidate.title,
        channel: s.candidate.channelTitle,
        score: Math.round(s.score),
        reasons: s.reasons,
      })),
    );
  }

  const best = pickBestCandidate(candidates, track);
  if (!best || best.score < MIN_ACCEPTABLE_SCORE) {
    console.warn(
      `[youtube] no acceptable match for "${track.title}" (best score: ${best?.score?.toFixed(1) ?? 'none'}, threshold: ${MIN_ACCEPTABLE_SCORE})`,
      best ? { title: best.candidate.title, channel: best.candidate.channelTitle, reasons: best.reasons } : undefined,
    );
    return null;
  }
  const resolution = {
    youtubeVideoId: best.candidate.videoId,
    isOfficial: best.isOfficial,
    hasVideo: best.hasVideo,
  };

  // Guardar al cache (fire-and-forget — no esperar para no demorar al user)
  void cacheYoutubeResolution(track.providerId, resolution);

  return { ...track, ...resolution };
}
