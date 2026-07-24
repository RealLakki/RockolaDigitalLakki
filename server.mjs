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

// ─── Rate limiters ─────────────────────────────────────────────────────────────
// YouTube: cada call gasta cuota → más restrictivo
const ytLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas búsquedas. Espera un momento.' },
});

// Resto de APIs de proxy (iTunes, Last.fm)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// ─── YouTube proxy ─────────────────────────────────────────────────────────────
app.get('/api/youtube-search', ytLimiter, async (req, res) => {
  try {
    if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YouTube API key not configured' });
    const { q, maxResults = '25' } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing parameter: q' });

    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: String(maxResults),
      q: String(q),
    });

    const response = await fetch(`${YT_API}/search?${params}`, {
      headers: { Referer: 'https://musica.wailus.co/' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[YouTube Search]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/youtube-videos', ytLimiter, async (req, res) => {
  try {
    if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'YouTube API key not configured' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing parameter: id' });

    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: 'snippet,contentDetails,statistics',
      id: String(id),
    });

    const response = await fetch(`${YT_API}/videos?${params}`, {
      headers: { Referer: 'https://musica.wailus.co/' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[YouTube Videos]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── iTunes proxy ──────────────────────────────────────────────────────────────
app.get('/api/itunes-search', apiLimiter, async (req, res) => {
  try {
    const { term, limit = '20', country = 'US', allowExplicit } = req.query;
    if (!term) return res.status(400).json({ error: 'Missing required parameter: term' });

    const params = new URLSearchParams({
      term: String(term),
      media: 'music',
      entity: 'song',
      country: String(country),
      limit: String(limit),
      explicit: allowExplicit !== 'false' ? 'Yes' : 'No',
    });

    const response = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { 'User-Agent': 'CantinaMusica/1.0' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[iTunes]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Last.fm proxies ───────────────────────────────────────────────────────────
app.get('/api/lastfm-artist', apiLimiter, async (req, res) => {
  try {
    if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
    const { artist } = req.query;
    if (!artist) return res.status(400).json({ error: 'Missing required parameter: artist' });

    const params = new URLSearchParams({
      method: 'artist.getInfo',
      api_key: LASTFM_API_KEY,
      artist: String(artist),
      format: 'json',
      autocorrect: '1',
    });

    const response = await fetch(`${LASTFM_API}?${params}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[Last.fm artist]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lastfm-track', apiLimiter, async (req, res) => {
  try {
    if (!LASTFM_API_KEY) return res.status(500).json({ error: 'Last.fm API key not configured' });
    const { method, artist, track } = req.query;
    if (!method || !artist || !track)
      return res.status(400).json({ error: 'Missing required parameters: method, artist, track' });

    const params = new URLSearchParams({
      method: String(method),
      api_key: LASTFM_API_KEY,
      artist: String(artist),
      track: String(track),
      format: 'json',
      autocorrect: '1',
    });

    const response = await fetch(`${LASTFM_API}?${params}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[Last.fm track]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Data API (PostgreSQL) ───────────────────────────────────────────────────
app.get('/api/venues', apiLimiter, async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'Missing slug' });
    res.json(await db.getVenueBySlug(String(slug))); // null si no existe
  } catch (e) { console.error('[venues.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.patch('/api/venues/:id', apiLimiter, async (req, res) => {
  try {
    const venue = await db.updateVenue(req.params.id, req.body ?? {});
    if (!venue) return res.status(404).json({ error: 'venue not found' });
    emitVenue(venue.id, 'venue:changed');
    res.json(venue);
  } catch (e) { console.error('[venues.patch]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/queue', apiLimiter, async (req, res) => {
  try {
    const { venueId } = req.query;
    if (!venueId) return res.status(400).json({ error: 'Missing venueId' });
    res.json(await db.fetchActiveQueue(String(venueId)));
  } catch (e) { console.error('[queue.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.post('/api/queue', apiLimiter, async (req, res) => {
  try {
    const { venueId, track, requestedBy, requestedByName, boosted } = req.body ?? {};
    if (!venueId || !track || !requestedBy) return res.status(400).json({ error: 'Missing fields' });
    const item = await db.enqueueTrack({ venueId, track, requestedBy, requestedByName, boosted });
    emitVenue(venueId, 'queue:changed');
    res.json(item);
  } catch (e) { console.error('[queue.post]', e); res.status(500).json({ error: 'db error' }); }
});

app.patch('/api/queue/:id', apiLimiter, async (req, res) => {
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

app.delete('/api/queue/:id', apiLimiter, async (req, res) => {
  try {
    const vid = await db.removeQueueItem(req.params.id);
    if (vid) emitVenue(vid, 'queue:changed');
    res.json({ ok: true });
  } catch (e) { console.error('[queue.delete]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/youtube-resolutions/:providerId', apiLimiter, async (req, res) => {
  try {
    res.json(await db.getCachedYoutubeResolution(req.params.providerId));
  } catch (e) { console.error('[ytres.get]', e); res.status(500).json({ error: 'db error' }); }
});

app.put('/api/youtube-resolutions/:providerId', apiLimiter, async (req, res) => {
  try {
    const { youtubeVideoId, isOfficial, hasVideo } = req.body ?? {};
    if (!youtubeVideoId) return res.status(400).json({ error: 'Missing youtubeVideoId' });
    await db.cacheYoutubeResolution(req.params.providerId, { youtubeVideoId, isOfficial, hasVideo });
    res.json({ ok: true });
  } catch (e) { console.error('[ytres.put]', e); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/top-tracks', apiLimiter, async (req, res) => {
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
