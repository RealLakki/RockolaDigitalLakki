/**
 * Last.fm API — usado para enriquecer tracks con tags de género reales.
 * iTunes solo etiqueta a nivel "Latin" / "Música Mexicana" (muy grueso).
 * Last.fm tiene tags por canción/artista mucho más granulares: "reggaeton",
 * "vallenato", "perreo", "corridos tumbados", etc.
 *
 * Las llamadas ahora pasan por el backend proxy para evitar problemas CORS
 * en iOS Safari y ocultar la API key.
 */

interface LastfmTag {
  name: string;
  count?: number;
  url?: string;
}

interface LastfmTrackInfo {
  track?: {
    name: string;
    artist?: { name: string };
    toptags?: { tag: LastfmTag[] };
  };
}

interface LastfmArtistInfo {
  artist?: {
    name: string;
    tags?: { tag: LastfmTag[] };
  };
}

/** Cache en memoria por sesión. Key normalizada para evitar dupes. */
const trackCache = new Map<string, string[]>();
const artistCache = new Map<string, string[]>();

const cacheKey = (artist: string, title: string) =>
  `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`;

/**
 * Devuelve los tags más populares de un track. Si Last.fm no encuentra el
 * track exacto (común para releases nuevos o muy nicho), hace fallback a los
 * tags del artista.
 */
export async function getTrackTags(artist: string, title: string): Promise<string[]> {
  const ck = cacheKey(artist, title);
  const cached = trackCache.get(ck);
  if (cached) return cached;

  try {
    // Intento 1: track exacto
    const trackTags = await fetchTrackTags(artist, title);
    if (trackTags.length > 0) {
      trackCache.set(ck, trackTags);
      return trackTags;
    }

    // Intento 2: tags del artista (fallback)
    const artistTags = await fetchArtistTags(artist);
    trackCache.set(ck, artistTags);
    return artistTags;
  } catch (e) {
    console.warn('[lastfm] error for', artist, title, e);
    trackCache.set(ck, []);
    return [];
  }
}

async function fetchTrackTags(artist: string, title: string): Promise<string[]> {
  const params = new URLSearchParams({
    method: 'track.getInfo',
    artist,
    track: title,
    format: 'json',
    autocorrect: '1',
  });
  const res = await fetch(`/api/lastfm-track?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as LastfmTrackInfo;
  const tags = data.track?.toptags?.tag ?? [];
  return tags.map((t) => t.name.toLowerCase()).filter((t) => t && t.length > 1);
}

async function fetchArtistTags(artist: string): Promise<string[]> {
  const ak = artist.toLowerCase().trim();
  const cached = artistCache.get(ak);
  if (cached) return cached;

  const params = new URLSearchParams({
    method: 'artist.getInfo',
    artist,
    format: 'json',
    autocorrect: '1',
  });
  const res = await fetch(`/api/lastfm-artist?${params}`);
  if (!res.ok) {
    artistCache.set(ak, []);
    return [];
  }
  const data = (await res.json()) as LastfmArtistInfo;
  const tags = data.artist?.tags?.tag ?? [];
  const result = tags.map((t) => t.name.toLowerCase()).filter((t) => t && t.length > 1);
  artistCache.set(ak, result);
  return result;
}

/**
 * Bulk: obtiene tags para muchos tracks en paralelo. Limita la concurrencia
 * a 5 simultáneos para no sobrepasar el rate limit de Last.fm.
 */
export async function getTrackTagsBulk(
  tracks: Array<{ artist: string; title: string }>,
): Promise<string[][]> {
  const CONCURRENCY = 5;
  const results: string[][] = new Array(tracks.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < tracks.length) {
      const i = cursor++;
      const t = tracks[i];
      results[i] = await getTrackTags(t.artist, t.title);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

/** Si la integración está disponible. Siempre true ya que el proxy maneja la key. */
export function isLastfmEnabled(): boolean {
  return true;
}
