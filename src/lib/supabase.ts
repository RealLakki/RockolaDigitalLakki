import { createClient } from '@supabase/supabase-js';
import type { Genre, QueueItem, ResolvedTrack, Venue } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url ?? '', key ?? '', {
  realtime: { params: { eventsPerSecond: 10 } },
});

/* ────────────────────────── DB shape (mapped) ────────────────────────── */

interface VenueRow {
  id: string;
  slug: string;
  name: string;
  allowed_genres: Genre[];
  blocked_track_ids: string[];
  request_cooldown_sec: number;
  allow_explicit: boolean;
  tip_enabled: boolean;
  tip_price_cop: number;
}

interface QueueRow {
  id: string;
  venue_id: string;
  track: ResolvedTrack;
  requested_by: string;
  requested_by_name: string | null;
  position: number;
  boosted: boolean;
  status: QueueItem['status'];
  created_at: string;
}

const mapVenue = (r: VenueRow): Venue => ({
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

const mapQueue = (r: QueueRow): QueueItem => ({
  id: r.id,
  venueId: r.venue_id,
  track: r.track,
  requestedBy: r.requested_by,
  requestedByName: r.requested_by_name ?? undefined,
  position: r.position,
  boosted: r.boosted,
  status: r.status,
  createdAt: r.created_at,
});

/* ────────────────────────── Venue ────────────────────────── */

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<VenueRow>();
  if (error) throw error;
  return data ? mapVenue(data) : null;
}

export async function updateVenue(
  id: string,
  patch: Partial<{
    allowedGenres: Genre[];
    blockedTrackIds: string[];
    requestCooldownSec: number;
    allowExplicit: boolean;
    tipEnabled: boolean;
    tipPriceCop: number;
    name: string;
  }>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.allowedGenres !== undefined) dbPatch.allowed_genres = patch.allowedGenres;
  if (patch.blockedTrackIds !== undefined) dbPatch.blocked_track_ids = patch.blockedTrackIds;
  if (patch.requestCooldownSec !== undefined) dbPatch.request_cooldown_sec = patch.requestCooldownSec;
  if (patch.allowExplicit !== undefined) dbPatch.allow_explicit = patch.allowExplicit;
  if (patch.tipEnabled !== undefined) dbPatch.tip_enabled = patch.tipEnabled;
  if (patch.tipPriceCop !== undefined) dbPatch.tip_price_cop = patch.tipPriceCop;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  const { error } = await supabase.from('venues').update(dbPatch).eq('id', id);
  if (error) throw error;
}

/* ────────────────────────── Queue ────────────────────────── */

export async function fetchActiveQueue(venueId: string): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('venue_id', venueId)
    .in('status', ['queued', 'playing'])
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapQueue(r as QueueRow));
}

export async function enqueueTrack(args: {
  venueId: string;
  track: ResolvedTrack;
  requestedBy: string;
  requestedByName?: string;
  boosted?: boolean;
}): Promise<QueueItem> {
  // Calculamos posición = max + 1 (boosted irá al frente vía DB function abajo).
  const { data: maxRow, error: maxErr } = await supabase
    .from('queue_items')
    .select('position')
    .eq('venue_id', args.venueId)
    .in('status', ['queued', 'playing'])
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  if (maxErr) throw maxErr;

  const nextPos = (maxRow?.position ?? 0) + 1;
  // Si es boosted: usamos posición negativa para que ordene primero (después del playing).
  const position = args.boosted ? -Date.now() : nextPos;

  const { data, error } = await supabase
    .from('queue_items')
    .insert({
      venue_id: args.venueId,
      track: args.track,
      requested_by: args.requestedBy,
      requested_by_name: args.requestedByName ?? null,
      position,
      boosted: args.boosted ?? false,
      status: 'queued',
    })
    .select()
    .single<QueueRow>();
  if (error) throw error;
  return mapQueue(data);
}

export async function setItemStatus(
  id: string,
  status: QueueItem['status'],
): Promise<void> {
  const { error } = await supabase.from('queue_items').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function removeQueueItem(id: string): Promise<void> {
  const { error } = await supabase.from('queue_items').delete().eq('id', id);
  if (error) throw error;
}

export async function boostItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('queue_items')
    .update({ boosted: true, position: -Date.now() })
    .eq('id', id);
  if (error) throw error;
}

/* ────────────────────────── Analytics ────────────────────────── */

export interface TopTrackRow {
  providerId: string;
  title: string;
  artists: string[];
  imageUrl: string | null;
  requestCount: number;
  lastRequested: string;
}

interface TopTrackDbRow {
  provider_id: string;
  title: string;
  artists: unknown; // jsonb — viene como string[] o JSON string según supabase-js
  image_url: string | null;
  request_count: number;
  last_requested: string;
}

/** Top canciones más pedidas en el venue (solo cuenta played/playing). */
export async function getTopTracks(
  venueId: string,
  limit = 20,
): Promise<TopTrackRow[]> {
  const { data, error } = await supabase.rpc('top_tracks_for_venue', {
    p_venue_id: venueId,
    p_limit: limit,
  });
  if (error) throw error;
  const rows = (data as TopTrackDbRow[] | null) ?? [];
  return rows.map((r) => ({
    providerId: r.provider_id,
    title: r.title,
    artists: Array.isArray(r.artists)
      ? (r.artists as string[])
      : typeof r.artists === 'string'
        ? (JSON.parse(r.artists) as string[])
        : [],
    imageUrl: r.image_url,
    requestCount: Number(r.request_count),
    lastRequested: r.last_requested,
  }));
}

/* ────────────────────────── YouTube cache ────────────────────────── */

interface CachedResolution {
  youtubeVideoId: string;
  isOfficial: boolean;
  hasVideo: boolean;
}

/**
 * Lee el cache de resolución YouTube para un providerId (iTunes trackId).
 * Si existe, evita una llamada de 100 unidades de cuota a YouTube API.
 */
export async function getCachedYoutubeResolution(
  providerId: string,
): Promise<CachedResolution | null> {
  const { data, error } = await supabase
    .from('youtube_resolutions')
    .select('youtube_video_id, is_official, has_video')
    .eq('provider_id', providerId)
    .maybeSingle<{ youtube_video_id: string; is_official: boolean; has_video: boolean }>();
  if (error) {
    console.warn('[yt-cache] read failed:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    youtubeVideoId: data.youtube_video_id,
    isOfficial: data.is_official,
    hasVideo: data.has_video,
  };
}

/**
 * Guarda una resolución exitosa al cache. Idempotente — si la canción ya
 * tenía cache (por race condition), el INSERT con upsert lo actualiza.
 */
export async function cacheYoutubeResolution(
  providerId: string,
  resolution: CachedResolution,
): Promise<void> {
  const { error } = await supabase.from('youtube_resolutions').upsert(
    {
      provider_id: providerId,
      youtube_video_id: resolution.youtubeVideoId,
      is_official: resolution.isOfficial,
      has_video: resolution.hasVideo,
      resolved_at: new Date().toISOString(),
    },
    { onConflict: 'provider_id' },
  );
  if (error) console.warn('[yt-cache] write failed:', error.message);
}

/** Revierte un boost: pone boosted=false y manda la canción al final de la cola. */
export async function unboostItem(id: string, venueId: string): Promise<void> {
  // Busca la posición máxima actual (excluyendo este item) para ponerla al final
  const { data: maxRow, error: maxErr } = await supabase
    .from('queue_items')
    .select('position')
    .eq('venue_id', venueId)
    .in('status', ['queued', 'playing'])
    .neq('id', id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  if (maxErr) throw maxErr;
  const newPos = (maxRow?.position ?? 0) + 1;

  const { error } = await supabase
    .from('queue_items')
    .update({ boosted: false, position: newPos })
    .eq('id', id);
  if (error) throw error;
}
