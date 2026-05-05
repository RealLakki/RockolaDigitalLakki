import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Control remoto del reproductor TV desde otra pestaña/dispositivo.
 * Usa Supabase Realtime Broadcast — mensajes one-shot, sin persistencia,
 * latencia <500ms. Perfecto para comandos de control.
 *
 * Patrón:
 * - Admin: `useSendPlayerCommand(venueId)` → llama send('play'), send('skip')
 * - Player: `useReceivePlayerCommand(venueId, handlers)` → escucha y ejecuta
 */

export type PlayerCommand =
  | 'play'
  | 'pause'
  | 'skip'
  | 'mute'
  | 'unmute'
  | 'volume-up'
  | 'volume-down';

const channelName = (venueId: string) => `player-control:${venueId}`;

/** Hook para ENVIAR comandos al player (usar en admin). */
export function useSendPlayerCommand(venueId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!venueId) return;
    const ch = supabase.channel(channelName(venueId), {
      config: { broadcast: { self: false } },
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      void supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [venueId]);

  const send = useCallback((command: PlayerCommand) => {
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: 'broadcast',
      event: 'cmd',
      payload: { command, ts: Date.now() },
    });
  }, []);

  return send;
}

/** Hook para RECIBIR comandos del player (usar en reproductor). */
export function useReceivePlayerCommand(
  venueId: string | undefined,
  onCommand: (cmd: PlayerCommand) => void,
) {
  // Mantener referencia estable al callback para no re-suscribir cada render
  const handlerRef = useRef(onCommand);
  useEffect(() => { handlerRef.current = onCommand; }, [onCommand]);

  useEffect(() => {
    if (!venueId) return;
    const ch = supabase.channel(channelName(venueId), {
      config: { broadcast: { self: false } },
    });
    ch.on('broadcast', { event: 'cmd' }, ({ payload }) => {
      const cmd = (payload as { command?: PlayerCommand })?.command;
      if (cmd) handlerRef.current(cmd);
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [venueId]);
}
