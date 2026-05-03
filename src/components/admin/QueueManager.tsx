import { boostItem, removeQueueItem, setItemStatus, unboostItem, updateVenue } from '../../lib/supabase';
import { joinArtists } from '../../utils/formatters';
import type { QueueItem, Venue } from '../../lib/types';
import { NeonButton } from '../common/NeonButton';

interface Props {
  venue: Venue;
  queued: QueueItem[];
  nowPlaying: QueueItem | null;
  onVenueUpdate: (patch: Partial<Venue>) => void;
}

export function QueueManager({ venue, queued, nowPlaying, onVenueUpdate }: Props) {
  const blockTrack = async (trackId: string) => {
    const next = Array.from(new Set([...venue.blockedTrackIds, trackId]));
    await updateVenue(venue.id, { blockedTrackIds: next });
    onVenueUpdate({ blockedTrackIds: next });
  };

  return (
    <div className="space-y-2">
      {nowPlaying && (
        <div className="glass-elevated rounded-xl p-3 flex items-center gap-3 gold-border">
          <span className="text-[10px] uppercase tracking-widest text-gold font-heading">
            Sonando
          </span>
          {nowPlaying.track.imageUrl && (
            <img src={nowPlaying.track.imageUrl} alt="" className="w-10 h-10 rounded-md" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-medium truncate">{nowPlaying.track.title}</p>
            <p className="text-ink-mute text-xs truncate">{joinArtists(nowPlaying.track.artists)}</p>
          </div>
          <NeonButton
            size="sm"
            variant="danger"
            onClick={() => setItemStatus(nowPlaying.id, 'skipped')}
          >
            Saltar
          </NeonButton>
        </div>
      )}

      {queued.length === 0 && (
        <p className="text-ink-dim text-center text-sm py-6">Cola vacía</p>
      )}

      {queued.map((item, i) => (
        <div
          key={item.id}
          className="glass rounded-xl p-3 flex items-center gap-3 hover:border-gold/30 transition"
        >
          <div
            className={[
              'w-7 h-7 rounded-md grid place-items-center text-xs font-bold shrink-0',
              item.boosted
                ? 'bg-gradient-gold text-[#0F0D0A] shadow-gold-sm'
                : 'bg-base-elevated text-ink-mute',
            ].join(' ')}
          >
            {item.boosted ? '⚡' : i + 1}
          </div>
          {item.track.imageUrl && (
            <img src={item.track.imageUrl} alt="" className="w-9 h-9 rounded-md shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-medium truncate">{item.track.title}</p>
            <p className="text-ink-mute text-xs truncate">
              {joinArtists(item.track.artists)}
              {item.requestedByName && ` · ${item.requestedByName}`}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {item.boosted ? (
              <NeonButton
                size="sm"
                variant="ghost"
                onClick={() => unboostItem(item.id, venue.id)}
                title="Quitar boost — vuelve al final de la cola"
              >
                ↓
              </NeonButton>
            ) : (
              <NeonButton size="sm" variant="ghost" onClick={() => boostItem(item.id)} title="Subir al frente">
                ⚡
              </NeonButton>
            )}
            <NeonButton
              size="sm"
              variant="ghost"
              onClick={() => blockTrack(item.track.providerId)}
              title="Bloquear esta canción para siempre"
            >
              ⛔
            </NeonButton>
            <NeonButton size="sm" variant="danger" onClick={() => removeQueueItem(item.id)}>
              ✕
            </NeonButton>
          </div>
        </div>
      ))}
    </div>
  );
}
