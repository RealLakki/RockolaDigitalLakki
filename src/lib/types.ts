export type Genre =
  | 'reggaeton'
  | 'salsa'
  | 'merengue'
  | 'bachata'
  | 'champeta'
  | 'vallenato'
  | 'cumbia'
  | 'popular'
  | 'ranchera'
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
  'cumbia', 'popular', 'ranchera', 'pop', 'rock', 'electronica', 'hiphop',
  'rnb', 'afrobeats', 'dembow', 'banda', 'corridos',
];

export const GENRE_LABEL: Record<Genre, string> = {
  reggaeton: 'Reggaetón',
  salsa: 'Salsa',
  merengue: 'Merengue',
  bachata: 'Bachata',
  champeta: 'Champeta',
  vallenato: 'Vallenato',
  cumbia: 'Cumbia',
  popular: 'Popular (despecho)',
  ranchera: 'Ranchera',
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
  popular: ['popular'],
  ranchera: ['ranchera', 'mariachi'],
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

/**
 * Mapeo de nuestros géneros a tags de Last.fm (mucho más granulares que iTunes).
 * Last.fm tiene tags por canción y artista — son "user-generated" pero los
 * más populares son confiables. Si el track tiene CUALQUIERA de estos tags,
 * lo consideramos del género.
 */
export const GENRE_LASTFM_TAGS: Record<Genre, string[]> = {
  reggaeton: ['reggaeton', 'reggaetón', 'perreo', 'urbano latino', 'latin urban', 'trap latino', 'reggaeton colombiano'],
  salsa: ['salsa', 'salsa colombiana', 'salsa cubana', 'salsa choke'],
  merengue: ['merengue'],
  bachata: ['bachata', 'bachata moderna'],
  champeta: ['champeta', 'champeta urbana'],
  vallenato: ['vallenato', 'vallenato moderno', 'vallenato romantico'],
  cumbia: ['cumbia', 'cumbia colombiana', 'cumbia villera', 'cumbia sonidera'],
  // Música popular colombiana — Yeison Jimenez, Pipe Bueno, Jessi Uribe,
  // Jhonny Rivera, Arelys Henao. Tags reales que devuelve Last.fm.
  popular: [
    'popular', 'musica popular', 'música popular', 'popular colombiano',
    'despecho', 'ranchera colombiana', 'colombian popular',
  ],
  // Ranchera mexicana tradicional — Vicente Fernández, Pedro Infante.
  ranchera: ['ranchera', 'mariachi', 'mexican folk', 'rancheras', 'mexican ranchera'],
  pop: ['pop', 'latin pop', 'pop latino', 'spanish pop', 'pop rock'],
  rock: ['rock', 'classic rock', 'hard rock', 'metal', 'alternative rock', 'indie rock', 'rock en español', 'rock latino'],
  electronica: ['electronic', 'electronica', 'electrónica', 'house', 'techno', 'edm', 'dance', 'electro'],
  hiphop: ['hip-hop', 'hip hop', 'rap', 'rap latino', 'rap español'],
  rnb: ['r&b', 'rnb', 'soul', 'neo soul'],
  afrobeats: ['afrobeats', 'afrobeat', 'afro', 'afropop'],
  dembow: ['dembow', 'dembow dominicano'],
  banda: ['banda', 'banda sinaloense', 'regional mexicano', 'banda mx'],
  corridos: ['corridos', 'corrido', 'corridos tumbados', 'norteño', 'narcocorridos', 'corridos belicos', 'sad sierreño', 'sierreño', 'sierreno'],
};

/** Géneros latinos urbanos/tropicales — los que iTunes a veces etiqueta
 * solo como "Latin" / "Música Latina" sin granularidad. Popular y ranchera
 * NO van aquí porque iTunes les pone genéricamente "Latin" pero realmente
 * son género distinto. */
const LATIN_NONREGIONAL: Genre[] = [
  'reggaeton', 'salsa', 'merengue', 'bachata', 'champeta',
  'vallenato', 'cumbia', 'dembow', 'popular', 'ranchera',
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

/**
 * Decide si un track con tags de Last.fm pasa el filtro de allowedGenres.
 * Más preciso que `genreAllowed` porque Last.fm tiene tags granulares.
 * - allowedGenres vacío → todo permitido
 * - Sin tags → fallback a `genreAllowed` con el itunesGenre original
 * - Con tags → matchea contra GENRE_LASTFM_TAGS de los géneros permitidos
 */
export function genreAllowedByTags(
  lastfmTags: string[],
  itunesGenre: string | undefined,
  allowedGenres: Genre[],
): boolean {
  if (allowedGenres.length === 0) return true;
  if (lastfmTags.length === 0) return genreAllowed(itunesGenre, allowedGenres);

  const tagSet = new Set(lastfmTags.map((t) => t.toLowerCase().trim()));
  return allowedGenres.some((ag) =>
    GENRE_LASTFM_TAGS[ag].some((tag) => tagSet.has(tag)),
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
