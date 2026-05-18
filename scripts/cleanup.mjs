/**
 * Limpieza semanal de la base de datos.
 * - Borra youtube_resolutions con más de 30 días (cache viejo)
 * - Borra queue_items played/skipped con más de 7 días (histórico viejo)
 *
 * Ejecutar manualmente: node scripts/cleanup.mjs
 * Cron semanal (domingos 3am): 0 3 * * 0 node /home/ubuntu/RockolaDigitalLakki/scripts/cleanup.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[cleanup] ERROR: Faltan variables VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[cleanup] WARN: Usando anon key. Para borrar youtube_resolutions agrega SUPABASE_SERVICE_ROLE_KEY al .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString();

async function cleanYoutubeCache() {
  const { error, count } = await supabase
    .from('youtube_resolutions')
    .delete({ count: 'exact' })
    .lt('resolved_at', thirtyDaysAgo);

  if (error) console.error('[cleanup] youtube_resolutions ERROR:', error.message);
  else       console.log(`[cleanup] youtube_resolutions: ${count ?? 0} entradas eliminadas (>30 días)`);
}

async function cleanQueueHistory() {
  const { error, count } = await supabase
    .from('queue_items')
    .delete({ count: 'exact' })
    .in('status', ['played', 'skipped'])
    .lt('created_at', sevenDaysAgo);

  if (error) console.error('[cleanup] queue_items ERROR:', error.message);
  else       console.log(`[cleanup] queue_items: ${count ?? 0} items eliminados (played/skipped >7 días)`);
}

const start = Date.now();
console.log(`[cleanup] Iniciando — ${new Date().toISOString()}`);

await cleanYoutubeCache();
await cleanQueueHistory();

console.log(`[cleanup] Listo en ${Date.now() - start}ms`);
