// Supabase Edge Function (Deno).
// Devuelve un access_token de Spotify usando Client Credentials.
// Mantiene el client_secret en el servidor — NUNCA lo expone al frontend.
//
// Deploy:
//   supabase functions deploy spotify-token --no-verify-jwt
//
// Set secrets:
//   supabase secrets set SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy

// deno-lint-ignore-file no-explicit-any
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Cache simple en memoria del worker (se resetea al cold start)
let cached: { token: string; expiresAt: number } | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) {
    return new Response(
      JSON.stringify({
        access_token: cached.token,
        expires_in: Math.floor((cached.expiresAt - now) / 1000),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const id = Deno.env.get('SPOTIFY_CLIENT_ID');
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  if (!id || !secret) {
    return new Response(JSON.stringify({ error: 'missing secrets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = btoa(`${id}:${secret}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: 'spotify auth failed', detail: err }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return new Response(
    JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
