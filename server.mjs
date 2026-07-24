import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rateLimit } from 'express-rate-limit';
import 'dotenv/config';
import * as db from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3100;

// Necesario para que express-rate-limit lea la IP real detrás de Nginx
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// ─── HTTP + WebSocket (socket.io): realtime de la cola y control del player ───
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true } });

/** Emite un evento a los clientes suscritos a un venue. */
const emitVenue = (venueId, event, extra = {}) =>
  io.to(`venue:${venueId}`).emit(event, { venueId, ...extra });

io.on('connection', (socket) => {
  // Cada cliente se une al room de su venue para recibir sus eventos.
  socket.on('join', (venueId) => {
    if (typeof venueId === 'string' && venueId) socket.join(`venue:${venueId}`);
  });
  // Relay de comandos del reproductor (admin -> player), sin persistencia.
  socket.on('player:cmd', (msg) => {
    const { venueId, command } = msg ?? {};
    if (venueId && command) socket.to(`venue:${venueId}`).emit('player:cmd', { command });
  });
});

// ─── API keys (server-only, nunca expuestas al cliente) ───────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const LASTFM_API_KEY  = process.env.VITE_LASTFM_API_KEY || process.env.LASTFM_API_KEY;
const YT_API          = 'https://www.googleapis.com/youtube/v3';
const LASTFM_API      = 'https://ws.audioscrobbler.com/2.0/';

// ─── Rate limiters ───────────────────────────────────────────────────────────
// Generosos a propósito: el cache + dedup + stale de abajo son lo que protege a
// las APIs upstream. En un bar TODOS los celulares salen por la misma IP del
// WiFi, así que límites bajos por-IP romperían el servicio en horas pico.
const mkLimiter = (max, message) => rateLimit({
  windowMs: 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: message },
  validate: { xForwardedForHeader: false }, // detrás de Nginx (trust proxy=1)
});
const ytLimiter     = mkLimiter(120,  'Demasiadas búsquedas de video. Espera un momento.');
const itunesLimiter = mkLimiter(600,  'Demasiadas búsquedas. Espera un momento.');
const lastfmLimiter = mkLimiter(2000, 'Too many requests');
// Endpoints de datos propios (Postgres local, baratos): límite muy alto — se
// llaman seguido (carga de venue, refresh de cola por realtime, etc.).
const dataLimiter   = mkLimiter(2000, 'Too many requests');

// ─── Cache TTL + dedup de in-flight + retry con backoff + serve-stale ──────────
// Esto es lo que hace que el sistema NO se caiga cuando las APIs upstream se
// saturan (Apple rate-limita por IP del servidor; Last.fm tiene límite bajo).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeCache(ttlMs, max = 5000) {
  const store = new Map(); // key -> { at, status, data }
  const inflight = new Map();
  return {
    fresh(key) { const e = store.get(key); return e && Date.now() - e.at < ttlMs ? e : null; },
    stale(key) { return store.get(key) || null; }, // cualquier entrada, aunque vencida
    set(key, status, data) {
      if (store.size >= max && !store.has(key)) store.delete(store.keys().next().value);
      store.set(key, { at: Date.now(), status, data });
    },
    inflight,
  };
}

/** fetch upstream con reintentos ante 429/5xx/red/no-JSON (throttle de Apple). */
async function fetchJsonRetry(url, opts = {}, tries = 3) {
  let delay = 300;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, opts);
      if ((r.status === 429 || r.status >= 500) && i < tries - 1) { await sleep(delay); delay *= 2; continue; }
      const text = await r.text();
      try {
        return { status: r.status, data: JSON.parse(text) };
      } catch {
        // Respuesta no-JSON = casi siempre página de throttle → reintentar.
        if (i < tries - 1) { await sleep(delay); delay *= 2; continue; }
        return { status: 503, data: { error: 'upstream non-JSON' } };
      }
    } catch {
      if (i < tries - 1) { await sleep(delay); delay *= 2; continue; }
      return { status: 503, data: { error: 'upstream fetch failed' } };
    }
  }
}

/**
 * Proxy cacheado: sirve cache fresco si existe; dedup de requests idénticas
 * en vuelo (10 personas buscando lo mismo = 1 call upstream); y si upstream
 * falla, sirve cache VIEJO en vez de reventar. `isOk` evita cachear respuestas
 * de error (p.ej. rate-limit de Last.fm devuelto con HTTP 200).
 */
async function cachedProxy(cache, key, fetcher, isOk = () => true) {
  const fresh = cache.fresh(key);
  if (fresh) return { status: fresh.status, data: fresh.data };
  if (cache.inflight.has(key)) return cache.inflight.get(key);
  const p = (async () => {
    try {
      const res = await fetcher();
      if (res.status >= 200 && res.status < 300 && isOk(res.data)) {
        cache.set(key, res.status, res.data);
        return res;
      }
      const stale = cache.stale(key); // upstream falló → cache viejo si hay
      if (stale) return { status: stale.status, data: stale.data };
      return res;
    } finally {
      cache.inflight.delete(key);
    }
  })();
  cache.inflight.set(key, p);
  return p;
}

const itunesCache   = makeCache(10 * 60 * 1000);       // 10 min
const lastfmCache   = makeCache(24 * 60 * 60 * 1000);  // 24 h (tags casi no cambian)
const ytSearchCache = makeCache(60 * 60 * 1000);       // 1 h
const ytVideosCache = makeCache(24 * 60 * 60 * 1000);  // 24 h

// Predicados de "respuesta válida" (no cachear errores upstream).
const itunesOk = (d) => d && typeof d.resultCount === 'number';
const lastfmOk = (d) => d && (d.error === undefined || d.error === 6); // 6 = not found (cacheable)
const ytOk     = (d) => d && !d.error;

// ─── YouTube proxy ─────────────────────────────────────────────────────────────
app.get('/api/youtube-search', ytLimiter, async (req, res) => {
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YouTube API key not configured' });
  const q = String(req.query.q ?? '');
  const maxResults = String(req.query.maxResults ?? '25');
  if (!q) return res.status(400).json({ error: 'Missing parameter: q' });
  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY, part: 'snippet', type: 'video',
    videoCategoryId: '10', maxResults, q,
  });
  const out = await cachedProxy(ytSearchCache, `${q}|${maxResults}`,
    () => fetchJsonRetry(`${YT_API}/search?${params}`, { headers: { Referer: 'https://musica.wailus.co/' } }),
    ytOk);
  res.status(out.status).json(out.data);
});

app.get('/api/youtube-videos', ytLimiter, async (req, res) => {
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YouTube API key not configured' });
  const id = String(req.query.id ?? '');
  if (!id) return res.status(400).json({ error: 'Missing parameter: id' });
  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY, part: 'snippet,contentDetails,statistics', id,
  });
  const out = await cachedProxy(ytVideosCache, id,
    () => fetchJsonRetry(`${YT_API}/videos?${params}`, { headers: { Referer: 'https://musica.wailus.co/' } }),
    ytOk);
  res.status(out.status).json(out.data);
});

// ─── iTunes proxy ──────────────────────────────────────────────────────────────
app.get('/api/itunes-search', itunesLimiter, async (req, res) => {
  const term = String(req.query.term ?? '');
  if (!term) return res.status(400).json({ error: 'Missing required parameter: term' });
  const limit = String(req.query.limit ?? '20');
  const country = String(req.query.country ?? 'US');
  const allowExplicit = req.query.allowExplicit !== 'false';
  const params = new URLSearchParams({
    term, media: 'music', entity: 'song', country, limit,
    explicit: allowExplicit ? 'Yes' : 'No',
  });
  const out = await cachedProxy(itunesCache, `${term}|${limit}|${country}|${allowExplicit}`,
    () => fetchJsonRetry(`https://itunes.apple.com/search?${params}`, { headers: { 'User-Agent': 'CantinaMusica/1.0' } }),
    itunesOk);
  // Nunca devolver error de búsqueda al cliente: si upstream falló y no hay
  // cache, devolvemos set vacío (la UI ofrece "Buscar en YouTube") en vez de
  // "Error de búsqueda — revisa la conexión".
  if (out.status < 200 || out.status >= 300 || !itunesOk(out.data)) {
    return res.json({ resultCount: 0, results: [] });
  }
  res.json(out.data);
});

// ─── Last.fm proxies ───────────────────────────────────────────────────────────
app.get('/api/lastfm-artist', lastfmLimiter, async (req, res) => {
  if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
  const artist = String(req.query.artist ?? '');
  if (!artist) return res.status(400).json({ error: 'Missing required parameter: artist' });
  const params = new URLSearchParams({
    method: 'artist.getInfo', api_key: LASTFM_API_KEY, artist, format: 'json', autocorrect: '1',
  });
  const out = await cachedProxy(lastfmCache, `artist|${artist.toLowerCase()}`,
    () => fetchJsonRetry(`${LASTFM_API}?${params}`), lastfmOk);
  res.status(out.status).json(out.data);
});

app.get('/api/lastfm-track', lastfmLimiter, async (req, res) => {
  if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
  const method = String(req.query.method ?? '');
  const artist = String(req.query.artist ?? '');
  const track = String(req.query.track ?? '');
  if (!method || !artist || !track)
    return res.status(400).json({ error: 'Missing required parameters: method, artist, track' });
  const params = new URLSearchParams({
    method, api_key: LASTFM_API_KEY, artist, track, format: 'json', autocorrect: '1',
  });
  const out = await cachedProxy(lastfmCache, `track|${artist.toLowerCase()}|${track.toLowerCase()}`,
    () => fetchJsonRetry(`${LASTFM_API}?${params}`), lastfmOk);
  res.status(out.status).json(out.data);
});

// ─── Data API (PostgreSQL) ───────────────────────────────────────────────────
app.get('/api/venues', dataLimiter, async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'Missing slug' });
    res.json(await db.getVenueBySlug(String(slug))); // null si no existe
  } catch (e) { console.error('[venues.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.patch('/api/venues/:id', dataLimiter, async (req, res) => {
  try {
    const venue = await db.updateVenue(req.params.id, req.body ?? {});
    if (!venue) return res.status(404).json({ error: 'venue not found' });
    emitVenue(venue.id, 'venue:changed');
    res.json(venue);
  } catch (e) { console.error('[venues.patch]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/queue', dataLimiter, async (req, res) => {
  try {
    const { venueId } = req.query;
    if (!venueId) return res.status(400).json({ error: 'Missing venueId' });
    res.json(await db.fetchActiveQueue(String(venueId)));
  } catch (e) { console.error('[queue.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.post('/api/queue', dataLimiter, async (req, res) => {
  try {
    const { venueId, track, requestedBy, requestedByName, boosted } = req.body ?? {};
    if (!venueId || !track || !requestedBy) return res.status(400).json({ error: 'Missing fields' });
    const item = await db.enqueueTrack({ venueId, track, requestedBy, requestedByName, boosted });
    emitVenue(venueId, 'queue:changed');
    res.json(item);
  } catch (e) { console.error('[queue.post]', e); res.status(500).json({ error: 'db error' }); }
});

app.patch('/api/queue/:id', dataLimiter, async (req, res) => {
  try {
    const { action, status, venueId } = req.body ?? {};
    let vid = null;
    if (action === 'boost') vid = await db.boostItem(req.params.id);
    else if (action === 'unboost') vid = await db.unboostItem(req.params.id, venueId);
    else if (status) vid = await db.setItemStatus(req.params.id, status);
    else return res.status(400).json({ error: 'Missing action/status' });
    if (vid) emitVenue(vid, 'queue:changed');
    res.json({ ok: true });
  } catch (e) { console.error('[queue.patch]', e); res.status(500).json({ error: 'db error' }); }
});

app.delete('/api/queue/:id', dataLimiter, async (req, res) => {
  try {
    const vid = await db.removeQueueItem(req.params.id);
    if (vid) emitVenue(vid, 'queue:changed');
    res.json({ ok: true });
  } catch (e) { console.error('[queue.delete]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/youtube-resolutions/:providerId', dataLimiter, async (req, res) => {
  try {
    res.json(await db.getCachedYoutubeResolution(req.params.providerId));
  } catch (e) { console.error('[ytres.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.put('/api/youtube-resolutions/:providerId', dataLimiter, async (req, res) => {
  try {
    const { youtubeVideoId, isOfficial, hasVideo } = req.body ?? {};
    if (!youtubeVideoId) return res.status(400).json({ error: 'Missing youtubeVideoId' });
    await db.cacheYoutubeResolution(req.params.providerId, { youtubeVideoId, isOfficial, hasVideo });
    res.json({ ok: true });
  } catch (e) { console.error('[ytres.put]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/top-tracks', dataLimiter, async (req, res) => {
  try {
    const { venueId, limit } = req.query;
    if (!venueId) return res.status(400).json({ error: 'Missing venueId' });
    res.json(await db.getTopTracks(String(venueId), Number(limit) || 20));
  } catch (e) { console.error('[top-tracks]', e); res.status(500).json({ error: 'db error' }); }
});

// ─── Frontend estático ─────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));

app.get('/{*path}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!YOUTUBE_API_KEY) console.warn('[WARN] YOUTUBE_API_KEY not set — YouTube search will fail');
});
