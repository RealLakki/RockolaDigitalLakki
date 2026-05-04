export type Genre =
  | 'reggaeton'
  | 'salsa'
  | 'merengue'
  | 'bachata'
  | 'champeta'
  | 'vallenato'
  | 'cumbia'
  | 'pop'
  | 'rock'
  | 'electronica'
  | 'hiphop'
  | 'rnb'
  | 'afrobeats'
  | 'dembow'
  | 'banda'
  | 'corridos';

export const ALL_GENRES: Genre[] = [
  'reggaeton', 'salsa', 'merengue', 'bachata', 'champeta', 'vallenato',
  'cumbia', 'pop', 'rock', 'electronica', 'hiphop', 'rnb', 'afrobeats',
  'dembow', 'banda', 'corridos',
];

export const GENRE_LABEL: Record<Genre, string> = {
  reggaeton: 'Reggaetón',
  salsa: 'Salsa',
  merengue: 'Merengue',
  bachata: 'Bachata',
  champeta: 'Champeta',
  vallenato: 'Vallenato',
  cumbia: 'Cumbia',
  pop: 'Pop',
  rock: 'Rock',
  electronica: 'Electrónica',
  hiphop: 'Hip-Hop',
  rnb: 'R&B',
  afrobeats: 'Afrobeats',
  dembow: 'Dembow',
  banda: 'Banda',
  corridos: 'Corridos',
};

/**
 * Mapeo de nuestros géneros a palabras clave que aparecen en
 * `primaryGenreName` de iTunes. Como iTunes no es granular para
 * salsa/bachata/vallenato (todo cae en "Latin" o "Salsa & Tropical"),
 * el matching es aproximado.
 */
export const GENRE_KEYWORDS: Record<Genre, string[]> = {
  reggaeton: ['reggaeton', 'reggaetón', 'urban latin', 'urbano latino', 'reggaeton y hip-hop'],
  salsa: ['salsa', 'tropical'],
  merengue: ['merengue', 'tropical'],
  bachata: ['bachata', 'tropical'],
  champeta: ['champeta', 'tropical'],
  vallenato: ['vallenato'],
  cumbia: ['cumbia', 'tropical'],
  pop: ['pop'],
  rock: ['rock', 'alternative', 'metal'],
  electronica: ['electronic', 'electrónica', 'dance', 'house', 'edm'],
  hiphop: ['hip-hop', 'rap', 'hip hop'],
  rnb: ['r&b', 'soul', 'r&b/soul'],
  afrobeats: ['afrobeats', 'afro', 'african'],
  dembow: ['dembow'],
  banda: ['banda', 'regional mexican', 'regional mexicano', 'música mexicana', 'musica mexicana'],
  corridos: ['corridos', 'norteño', 'regional mexican', 'regional mexicano', 'música mexicana', 'musica mexicana'],
};

/** Géneros latinos urbanos/tropicales — los que iTunes a veces etiqueta
 * solo como "Latin" / "Música Latina" sin granularidad. */
const LATIN_NONREGIONAL: Genre[] = [
  'reggaeton', 'salsa', 'merengue', 'bachata', 'champeta',
  'vallenato', 'cumbia', 'dembow',
];

/** Géneros regionales mexicanos — iTunes los etiqueta como "Música Mexicana"
 * o "Regional Mexican", NUNCA como "Latin" puro. */
const REGIONAL_MEXICAN_GENRES: Genre[] = ['banda', 'corridos'];

/**
 * Decide si un primaryGenreName de iTunes pasa el filtro de allowedGenres.
 * - allowedGenres vacío → todo permitido
 * - Sin género en iTunes + filtros activos → RECHAZAR (no podemos confirmar)
 * - "Música Mexicana" / "Regional Mexican" → solo si admin tiene banda/corridos
 * - "Latin" / "Música Latina" puro → solo si admin tiene latino NO-regional
 *   (banda/corridos no aplican porque iTunes los etiqueta específicamente)
 * - Cualquier otro → match por substring contra GENRE_KEYWORDS
 */
export function genreAllowed(
  itunesGenre: string | undefined,
  allowedGenres: Genre[],
): boolean {
  if (allowedGenres.length === 0) return true;
  if (!itunesGenre) return false;
  const g = itunesGenre.toLowerCase();

  // Regional Mexicano explícito (banda, corridos, norteño)
  if (/regional mexican(o)?|música mexicana|musica mexicana/.test(g)) {
    return allowedGenres.some((ag) => REGIONAL_MEXICAN_GENRES.includes(ag));
  }

  // Latin / Música Latina puro (ambiguo) → solo permitir si admin tiene un
  // género latino NO-regional. iTunes nunca etiqueta banda/corridos como
  // "Latin" puro; les pone "Música Mexicana".
  if (/^(latin|música latina|musica latina)$/.test(g)) {
    return allowedGenres.some((ag) => LATIN_NONREGIONAL.includes(ag));
  }

  // Match por keywords
  return allowedGenres.some((ag) =>
    GENRE_KEYWORDS[ag].some((kw) => g.includes(kw)),
  );
}

/** Resultado normalizado de una búsqueda (sea Spotify o cualquier otro provider). */
export interface TrackSearchResult {
  /** ID estable en el provider de búsqueda. */
  providerId: string;
  /** Nombre del track. */
  title: string;
  /** Artistas (1+). */
  artists: string[];
  /** Álbum si aplica. */
  album?: string;
  /** Duración en milisegundos. */
  durationMs: number;
  /** Imagen — usar el más grande disponible. */
  imageUrl?: string;
  /** ISRC para matching cross-provider de alta precisión. */
  isrc?: string;
  /** Géneros si el provider los expone. */
  genres?: string[];
  /** Año de release. */
  year?: number;
  /** Marcador explícito. */
  explicit?: boolean;
}

/** Track resuelto a un video reproducible. */
export interface ResolvedTrack extends TrackSearchResult {
  /** ID del video en YouTube ya filtrado y validado. */
  youtubeVideoId: string;
  /** Si la resolución se considera "official" (canal verificado / VEVO). */
  isOfficial: boolean;
  /** Si encontró videoclip o solo audio (para activar visualizer). */
  hasVideo: boolean;
}

export interface QueueItem {
  id: string;
  venueId: string;
  track: ResolvedTrack;
  /** Identificador opaco del cliente que la pidió (sessionStorage). */
  requestedBy: string;
  /** Display name opcional ("Cami", "Mesa 7"). */
  requestedByName?: string;
  /** Posición efectiva en la cola; menor = antes. */
  position: number;
  /** Si fue boostada por tip; rompe el orden FIFO. */
  boosted: boolean;
  status: 'queued' | 'playing' | 'played' | 'skipped';
  createdAt: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  /** Géneros permitidos — si está vacío, todo permitido. */
  allowedGenres: Genre[];
  /** Lista de spotifyId bloqueados explícitamente por el bar. */
  blockedTrackIds: string[];
  /** Cooldown en segundos entre requests del mismo cliente. */
  requestCooldownSec: number;
  /** Permitir explicit content. */
  allowExplicit: boolean;
  /** Habilitar tip-to-skip. */
  tipEnabled: boolean;
  /** Costo simulado del tip (display). */
  tipPriceCop: number;
}
