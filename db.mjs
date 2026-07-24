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
