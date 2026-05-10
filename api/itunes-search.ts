const ITUNES_API = 'https://itunes.apple.com/search';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');
    
    if (!term) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: term' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const limit = searchParams.get('limit') || '20';
    const country = searchParams.get('country') || 'US';
    const allowExplicit = searchParams.get('allowExplicit') !== 'false';

    const params = new URLSearchParams({
      term,
      media: 'music',
      entity: 'song',
      country,
      limit,
      explicit: allowExplicit ? 'Yes' : 'No',
    });

    const res = await fetch(`${ITUNES_API}?${params}`, {
      headers: {
        'User-Agent': 'CantinaMusica/1.0',
      },
    });

    if (!res.ok) {
      console.error('[iTunes] API error:', res.status, res.statusText);
      const errorBody = await res.text().catch(() => '');
      return new Response(JSON.stringify({ 
        error: `iTunes API error: ${res.status}`,
        details: errorBody,
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
    console.error('[iTunes] Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
