import { useRef } from 'react';
import { confirmAdd } from '../../utils/animations';
import { formatDuration, joinArtists } from '../../utils/formatters';
import type { TrackSearchResult } from '../../lib/types';

interface Props {
  track: TrackSearchResult;
  disabled?: boolean;
  disabledReason?: string;
  onAdd: (track: TrackSearchResult) => Promise<void> | void;
}

export function SongResult({ track, disabled, disabledReason, onAdd }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleAdd = async () => {
    if (disabled) return;
    if (ref.current) confirmAdd(ref.current);
    await onAdd(track);
  };

  return (
    <div
      ref={ref}
      className="group flex items-center gap-3 glass rounded-xl p-3 hover:border-gold/50 transition-all"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-base-elevated shrink-0">
        {track.imageUrl ? (
          <img src={track.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold-deep/20" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-ink font-medium truncate">{track.title}</p>
          {track.explicit && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-ink-dim/30 text-ink-mute">E</span>
          )}
        </div>
        <p className="text-ink-mute text-sm truncate">{joinArtists(track.artists)}</p>
        <p className="text-ink-dim text-xs">{formatDuration(track.durationMs)}</p>
      </div>

      <button
        onClick={handleAdd}
        disabled={disabled}
        title={disabled ? disabledReason : 'Agregar a la cola'}
        className={[
          'shrink-0 rounded-full w-10 h-10 grid place-items-center transition-all',
          disabled
            ? 'bg-base-elevated text-ink-dim cursor-not-allowed'
            : 'bg-gradient-gold text-white shadow-gold-sm hover:shadow-gold hover:scale-110 active:scale-95',
        ].join(' ')}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
