// Capa de datos PostgreSQL del server. Reemplaza a src/lib/supabase.ts.
// Devuelve objetos ya mapeados a la forma de la app (camelCase) para que el
// frontend consuma la API sin re-mapear.
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Connection string o piezas sueltas. Por defecto: socket local del VPS.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'rockola',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'rockola',
  max: 10,
});

const q = (text, params) => pool.query(text, params);

const HOUSE_TRACKS = [
  {
    genre: 'popular',
    track: {
      providerId: 'house:popular:arelys-henao:amante-y-amigo',
      title: 'Amante y Amigo',
      artists: ['Arelys Henao'],
      durationMs: 185000,
      imageUrl: 'https://i.ytimg.com/vi/FpMmpJrQIJA/hqdefault.jpg',
      genres: ['Música popular'],
      explicit: false,
      youtubeVideoId: 'FpMmpJrQIJA',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'popular',
    track: {
      providerId: 'house:popular:luis-alberto-posada:me-tomas-y-me-dejas',
      title: 'Me Tomas y Me Dejas',
      artists: ['Luis Alberto Posada'],
      durationMs: 203000,
      imageUrl: 'https://i.ytimg.com/vi/JoSRCwCkan4/hqdefault.jpg',
      genres: ['Música popular'],
      explicit: false,
      youtubeVideoId: 'JoSRCwCkan4',
      isOfficial: false,
      hasVideo: false,
    },
  },
  {
    genre: 'popular',
    track: {
      providerId: 'house:popular:jessi-uribe:dulce-pecado',
      title: 'Dulce Pecado',
      artists: ['Jessi Uribe'],
      durationMs: 180000,
      imageUrl: 'https://i.ytimg.com/vi/-b21-NCfNzM/hqdefault.jpg',
      genres: ['Música popular'],
      explicit: false,
      youtubeVideoId: '-b21-NCfNzM',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'ranchera',
    track: {
      providerId: 'house:ranchera:vicente-fernandez:aca-entre-nos',
      title: 'Acá Entre Nos',
      artists: ['Vicente Fernández'],
      durationMs: 196000,
      imageUrl: 'https://i.ytimg.com/vi/Zy89cMj4W68/hqdefault.jpg',
      genres: ['Ranchera'],
      explicit: false,
      youtubeVideoId: 'Zy89cMj4W68',
      isOfficial: true,
      hasVideo: false,
    },
  },
  {
    genre: 'ranchera',
    track: {
      providerId: 'house:ranchera:vicente-fernandez:volver-volver',
      title: 'Volver Volver',
      artists: ['Vicente Fernández'],
      durationMs: 181000,
      imageUrl: 'https://i.ytimg.com/vi/mmS_sqZBXVQ/hqdefault.jpg',
      genres: ['Ranchera'],
      explicit: false,
      youtubeVideoId: 'mmS_sqZBXVQ',
      isOfficial: true,
      hasVideo: false,
    },
  },
  {
    genre: 'ranchera',
    track: {
      providerId: 'house:ranchera:pedro-infante:cielito-lindo',
      title: 'Cielito Lindo',
      artists: ['Pedro Infante'],
      durationMs: 184000,
      imageUrl: 'https://i.ytimg.com/vi/HPF44uH3M88/hqdefault.jpg',
      genres: ['Ranchera'],
      explicit: false,
      youtubeVideoId: 'HPF44uH3M88',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'banda',
    track: {
      providerId: 'house:banda:banda-ms:el-color-de-tus-ojos',
      title: 'El Color de Tus Ojos',
      artists: ['Banda MS'],
      durationMs: 249000,
      imageUrl: 'https://i.ytimg.com/vi/Mfv1thwO0hw/hqdefault.jpg',
      genres: ['Banda'],
      explicit: false,
      youtubeVideoId: 'Mfv1thwO0hw',
      isOfficial: true,
      hasVideo: true,
    },
  },
  {
    genre: 'banda',
    track: {
      providerId: 'house:banda:arrolladora:el-ruido-de-tus-zapatos',
      title: 'El Ruido de Tus Zapatos',
      artists: ['La Arrolladora Banda El Limón'],
      durationMs: 266000,
      imageUrl: 'https://i.ytimg.com/vi/aR5f59K8R5w/hqdefault.jpg',
      genres: ['Banda'],
      explicit: false,
      youtubeVideoId: 'aR5f59K8R5w',
      isOfficial: true,
      hasVideo: true,
    },
  },
  {
    genre: 'banda',
    track: {
      providerId: 'house:banda:banda-ms:mi-mayor-anhelo',
      title: 'Mi Mayor Anhelo',
      artists: ['Banda MS'],
      durationMs: 218000,
      imageUrl: 'https://i.ytimg.com/vi/WmlJHCzvs_Y/hqdefault.jpg',
      genres: ['Banda'],
      explicit: false,
      youtubeVideoId: 'WmlJHCzvs_Y',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'corridos',
    track: {
      providerId: 'house:corridos:tigres-del-norte:la-puerta-negra',
      title: 'La Puerta Negra',
      artists: ['Los Tigres del Norte'],
      durationMs: 203000,
      imageUrl: 'https://i.ytimg.com/vi/rryDND06LHU/hqdefault.jpg',
      genres: ['Corridos'],
      explicit: false,
      youtubeVideoId: 'rryDND06LHU',
      isOfficial: true,
      hasVideo: true,
    },
  },
  {
    genre: 'corridos',
    track: {
      providerId: 'house:corridos:eslabon-peso-pluma:ella-baila-sola',
      title: 'Ella Baila Sola',
      artists: ['Eslabon Armado', 'Peso Pluma'],
      durationMs: 166000,
      imageUrl: 'https://i.ytimg.com/vi/7WNwGkgjKV8/hqdefault.jpg',
      genres: ['Corridos'],
      explicit: false,
      youtubeVideoId: '7WNwGkgjKV8',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'corridos',
    track: {
      providerId: 'house:corridos:natanael-cano:disfruto-lo-malo',
      title: 'Disfruto Lo Malo',
      artists: ['Natanael Cano'],
      durationMs: 202000,
      imageUrl: 'https://i.ytimg.com/vi/1VsfWqiSBBg/hqdefault.jpg',
      genres: ['Corridos'],
      explicit: false,
      youtubeVideoId: '1VsfWqiSBBg',
      isOfficial: false,
      hasVideo: true,
    },
  },
  {
    genre: 'corridos',
    track: {
      providerId: 'house:corridos:el-fantasma:soy-buen-amigo',
      title: 'Soy Buen Amigo',
      artists: ['El Fantasma'],
      durationMs: 156000,
      imageUrl: 'https://i.ytimg.com/vi/cPKAmxB4tzk/hqdefault.jpg',
      genres: ['Corridos'],
      explicit: false,
      youtubeVideoId: 'cPKAmxB4tzk',
      isOfficial: false,
      hasVideo: false,
    },
  },
];

export async function ensureOperationalTables() {
  await q(`
    create table if not exists external_api_cache (
      namespace text not null,
      cache_key text not null,
      status integer not null,
      data jsonb not null,
      expires_at timestamptz not null,
      updated_at timestamptz not null default now(),
      primary key (namespace, cache_key)
    );
    create index if not exists external_api_cache_exp
      on external_api_cache (namespace, expires_at);
    create table if not exists api_circuit_breakers (
      namespace text primary key,
      blocked_until timestamptz not null,
      reason text,
      updated_at timestamptz not null default now()
    );
    create table if not exists house_tracks (
      provider_id text primary key,
      genre text not null,
      track jsonb not null,
      active boolean not null default true,
      weight integer not null default 1,
      last_picked_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists house_tracks_active_genre
      on house_tracks (active, genre, last_picked_at);
  `);

  for (const item of HOUSE_TRACKS) {
    await q(
      `insert into house_tracks (provider_id, genre, track, active, weight, updated_at)
       values ($1, $2, $3, true, 1, now())
       on conflict (provider_id) do update set
         genre = excluded.genre,
         track = excluded.track,
         active = true,
         updated_at = now()`,
      [item.track.providerId, item.genre, item.track],
    );
  }
}

/* ───────────────────── operational cache / house tracks ───────────────────── */

export async function getApiCache(namespace, cacheKey, { allowStale = false } = {}) {
  const { rows } = await q(
    `select status, data
       from external_api_cache
      where namespace = $1
        and cache_key = $2
        and ($3::boolean or expires_at > now())
      limit 1`,
    [namespace, cacheKey, allowStale],
  );
  return rows[0] ? { status: rows[0].status, data: rows[0].data } : null;
}

export async function setApiCache(namespace, cacheKey, status, data, ttlMs) {
  const ttlSeconds = Math.max(1, Math.ceil(Number(ttlMs) / 1000));
  await q(
    `insert into external_api_cache (namespace, cache_key, status, data, expires_at, updated_at)
     values ($1, $2, $3, $4, now() + ($5::text || ' seconds')::interval, now())
     on conflict (namespace, cache_key) do update set
       status = excluded.status,
       data = excluded.data,
       expires_at = excluded.expires_at,
       updated_at = now()`,
    [namespace, cacheKey, status, data, ttlSeconds],
  );
}

export async function getCircuitBreaker(namespace) {
  const { rows } = await q(
    `select namespace, blocked_until, reason
       from api_circuit_breakers
      where namespace = $1 and blocked_until > now()
      limit 1`,
    [namespace],
  );
  if (!rows[0]) return null;
  return {
    namespace: rows[0].namespace,
    blockedUntil: rows[0].blocked_until instanceof Date
      ? rows[0].blocked_until.toISOString()
      : rows[0].blocked_until,
    reason: rows[0].reason,
  };
}

export async function tripCircuitBreaker(namespace, ms, reason) {
  const blockSeconds = Math.max(1, Math.ceil(Number(ms) / 1000));
  await q(
    `insert into api_circuit_breakers (namespace, blocked_until, reason, updated_at)
     values ($1, now() + ($2::text || ' seconds')::interval, $3, now())
     on conflict (namespace) do update set
       blocked_until = greatest(api_circuit_breakers.blocked_until, excluded.blocked_until),
       reason = excluded.reason,
       updated_at = now()`,
    [namespace, blockSeconds, reason],
  );
}

export async function getRandomHouseTrack({ allowedGenres = [], excludeProviderIds = [] } = {}) {
  const allowed = Array.isArray(allowedGenres) ? allowedGenres.filter(Boolean) : [];
  const excluded = Array.isArray(excludeProviderIds) ? excludeProviderIds.filter(Boolean) : [];
  const { rows } = await q(
    `select provider_id, track
       from house_tracks
      where active = true
        and (cardinality($1::text[]) = 0 or genre = any($1::text[]))
        and not (provider_id = any($2::text[]))
      order by last_picked_at asc nulls first, random()
      limit 1`,
    [allowed, excluded],
  );
  const row = rows[0];
  if (!row) return null;
  await q('update house_tracks set last_picked_at = now() where provider_id = $1', [row.provider_id]);
  return row.track;
}

/* ───────────────────────────── mappers ───────────────────────────── */

const mapVenue = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  allowedGenres: r.allowed_genres ?? [],
  blockedTrackIds: r.blocked_track_ids ?? [],
  requestCooldownSec: r.request_cooldown_sec,
  allowExplicit: r.allow_explicit,
  tipEnabled: r.tip_enabled,
  tipPriceCop: r.tip_price_cop,
});

const mapQueue = (r) => ({
  id: r.id,
  venueId: r.venue_id,
  track: r.track,
  requestedBy: r.requested_by,
  requestedByName: r.requested_by_name ?? undefined,
  position: Number(r.position),
  boosted: r.boosted,
  status: r.status,
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
});

/* ───────────────────────────── venues ───────────────────────────── */

export async function getVenueBySlug(slug) {
  const { rows } = await q('select * from venues where slug = $1 limit 1', [slug]);
  return rows[0] ? mapVenue(rows[0]) : null;
}

export async function getVenueById(id) {
  const { rows } = await q('select * from venues where id = $1 limit 1', [id]);
  return rows[0] ? mapVenue(rows[0]) : null;
}

const VENUE_COLS = {
  allowedGenres: 'allowed_genres',
  blockedTrackIds: 'blocked_track_ids',
  requestCooldownSec: 'request_cooldown_sec',
  allowExplicit: 'allow_explicit',
  tipEnabled: 'tip_enabled',
  tipPriceCop: 'tip_price_cop',
  name: 'name',
};

export async function updateVenue(id, patch) {
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of Object.entries(VENUE_COLS)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = $${i++}`);
      vals.push(patch[key]);
    }
  }
  if (sets.length === 0) return getVenueById(id);
  vals.push(id);
  const { rows } = await q(
    `update venues set ${sets.join(', ')} where id = $${i} returning *`,
    vals,
  );
  return rows[0] ? mapVenue(rows[0]) : null;
}

/* ───────────────────────────── queue ───────────────────────────── */

export async function fetchActiveQueue(venueId) {
  const { rows } = await q(
    `select * from queue_items
      where venue_id = $1 and status in ('queued','playing')
      order by position asc`,
    [venueId],
  );
  return rows.map(mapQueue);
}

export async function enqueueTrack({ venueId, track, requestedBy, requestedByName, boosted }) {
  // position = max+1; boosted usa posicion negativa para ir al frente.
  const { rows: maxRows } = await q(
    `select coalesce(max(position), 0) as max from queue_items
      where venue_id = $1 and status in ('queued','playing')`,
    [venueId],
  );
  const nextPos = Number(maxRows[0].max) + 1;
  const position = boosted ? -Date.now() : nextPos;

  const { rows } = await q(
    `insert into queue_items
       (venue_id, track, requested_by, requested_by_name, position, boosted, status)
     values ($1, $2, $3, $4, $5, $6, 'queued')
     returning *`,
    [venueId, track, requestedBy, requestedByName ?? null, position, boosted ?? false],
  );
  return mapQueue(rows[0]);
}

export async function setItemStatus(id, status) {
  const { rows } = await q(
    'update queue_items set status = $2 where id = $1 returning venue_id',
    [id, status],
  );
  return rows[0]?.venue_id ?? null;
}

export async function removeQueueItem(id) {
  const { rows } = await q(
    'delete from queue_items where id = $1 returning venue_id',
    [id],
  );
  return rows[0]?.venue_id ?? null;
}

export async function boostItem(id) {
  const { rows } = await q(
    'update queue_items set boosted = true, position = $2 where id = $1 returning venue_id',
    [id, -Date.now()],
  );
  return rows[0]?.venue_id ?? null;
}

export async function unboostItem(id, venueId) {
  const { rows: maxRows } = await q(
    `select coalesce(max(position), 0) as max from queue_items
      where venue_id = $1 and status in ('queued','playing') and id <> $2`,
    [venueId, id],
  );
  const newPos = Number(maxRows[0].max) + 1;
  const { rows } = await q(
    'update queue_items set boosted = false, position = $2 where id = $1 returning venue_id',
    [id, newPos],
  );
  return rows[0]?.venue_id ?? null;
}

/* ───────────────────────────── youtube cache ───────────────────────────── */

export async function getCachedYoutubeResolution(providerId) {
  const { rows } = await q(
    'select youtube_video_id, is_official, has_video from youtube_resolutions where provider_id = $1',
    [providerId],
  );
  if (!rows[0]) return null;
  return {
    youtubeVideoId: rows[0].youtube_video_id,
    isOfficial: rows[0].is_official,
    hasVideo: rows[0].has_video,
  };
}

export async function cacheYoutubeResolution(providerId, { youtubeVideoId, isOfficial, hasVideo }) {
  await q(
    `insert into youtube_resolutions (provider_id, youtube_video_id, is_official, has_video, resolved_at)
     values ($1, $2, $3, $4, now())
     on conflict (provider_id) do update set
       youtube_video_id = excluded.youtube_video_id,
       is_official      = excluded.is_official,
       has_video        = excluded.has_video,
       resolved_at      = now()`,
    [providerId, youtubeVideoId, isOfficial, hasVideo],
  );
}

/* ───────────────────────────── analytics ───────────────────────────── */

export async function getTopTracks(venueId, limit = 20) {
  const { rows } = await q(
    `select
        track->>'providerId' as provider_id,
        track->>'title'      as title,
        track->'artists'     as artists,
        track->>'imageUrl'   as image_url,
        coalesce((track->>'durationMs')::int, 0) as duration_ms,
        count(*)::bigint     as request_count,
        max(created_at)      as last_requested
       from queue_items
      where venue_id = $1 and status in ('played','playing')
      group by track->>'providerId', track->>'title', track->'artists',
               track->>'imageUrl', (track->>'durationMs')::int
      order by request_count desc, last_requested desc
      limit $2`,
    [venueId, limit],
  );
  return rows.map((r) => ({
    providerId: r.provider_id,
    title: r.title,
    artists: Array.isArray(r.artists) ? r.artists : [],
    imageUrl: r.image_url,
    durationMs: Number(r.duration_ms ?? 0),
    requestCount: Number(r.request_count),
    lastRequested: r.last_requested instanceof Date ? r.last_requested.toISOString() : r.last_requested,
  }));
}
