import { itunesSearch, itunesSearchArtists } from './itunes';
import type { TrackSearchResult } from './types';

/**
 * Lista de artistas favoritos del bar — "Las de siempre".
 * Compartida entre la card del cliente y el auto-filler del reproductor.
 */
export const HOUSE_ARTISTS = [
  { name: 'Charrito Negro', searchTerm: 'Charrito Negro' },
  { name: 'Luis Alberto Posada', searchTerm: 'Luis Alberto Posada' },
  { name: 'Yeison Jiménez', searchTerm: 'Yeison Jimenez' },
  { name: 'Andariego', searchTerm: 'Andariego' },
  { name: 'Paola Jara', searchTerm: 'Paola Jara' },
  { name: 'Jessi Uribe', searchTerm: 'Jessi Uribe' },
];

/**
 * Devuelve una canción aleatoria de un artista aleatorio de la casa.
 * Usado para auto-fill cuando la cola se queda vacía — evita silencios.
 *
 * Estrategia:
 * 1. Pick artista al azar
 * 2. iTunes search (term=artist, entity=song) → 8 resultados
 * 3. Filtrar tracks del artista correcto (por si search devuelve features)
 * 4. Pick uno random
 *
 * Si falla, intenta con otro artista. Devuelve null si todos fallan.
 */
export async function getRandomHouseTrack(
  excludeProviderIds: Set<string> = new Set(),
): Promise<TrackSearchResult | null> {
  // Random shuffle de los artistas para no spammear siempre el mismo
  const shuffled = [...HOUSE_ARTISTS].sort(() => Math.random() - 0.5);

  for (const artist of shuffled) {
    try {
      const tracks = await itunesSearch(artist.searchTerm, { limit: 12 });
      // Filtrar al artista correcto (search puede traer features)
      const own = tracks.filter((t) =>
        t.artists.some((a) =>
          a.toLowerCase().includes(artist.searchTerm.toLowerCase().split(' ')[0]),
        ),
      );
      const candidates = own.filter((t) => !excludeProviderIds.has(t.providerId));
      if (candidates.length === 0) continue;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      return pick;
    } catch (e) {
      console.warn('[house-filler] failed for', artist.name, e);
      continue;
    }
  }

  // Fallback final: si iTunes search falla en todos, intentar resolver via lookup directo
  for (const artist of shuffled) {
    try {
      const artistResults = await itunesSearchArtists(artist.searchTerm, { limit: 1 });
      if (artistResults.length === 0) continue;
      // Buscar tracks de ese artistId
      const tracks = await itunesSearch(artist.name, { limit: 5 });
      const candidates = tracks.filter((t) => !excludeProviderIds.has(t.providerId));
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    } catch {
      continue;
    }
  }

  return null;
}
