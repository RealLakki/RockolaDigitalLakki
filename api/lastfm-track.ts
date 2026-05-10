const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/';

const LASTFM_API_KEY = process.env.VITE_LASTFM_API_KEY || process.env.LASTFM_API_KEY;

export async function GET(req: Request) {
  try {
    if (!LASTFM_API_KEY) {
      return new Response(JSON.stringify({ error: 'Last.fm API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method');
    const artist = searchParams.get('artist');
    const track = searchParams.get('track');

    if (!method || !artist || !track) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: method, artist, track' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      method,
      api_key: LASTFM_API_KEY,
      artist,
      track,
      format: 'json',
      autocorrect: '1',
    });

    const res = await fetch(`${LASTFM_API}?${params}`);

    if (!res.ok) {
      console.error('[Last.fm] API error:', res.status, res.statusText);
      return new Response(JSON.stringify({ 
        error: `Last.fm API error: ${res.status}` 
      }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Last.fm] Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}