import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { joinArtists } from '../../utils/formatters';
import type { QueueItem } from '../../lib/types';

interface Props {
  nowPlaying: QueueItem | null;
}

export function NowPlayingMini({ nowPlaying }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nowPlaying || !ref.current) return;
    anime({
      targets: ref.current,
      scale: [0.95, 1],
      opacity: [0, 1],
      boxShadow: [
        '0 0 0 rgba(0,212,255,0)',
        '0 0 35px rgba(0,212,255,0.55)',
        '0 0 14px rgba(0,212,255,0.25)',
      ],
      duration: 900,
      easing: 'easeOutCubic',
    });
  }, [nowPlaying?.id]);

  if (!nowPlaying) {
    return (
      <div className="glass rounded-2xl p-4 text-center">
        <p className="text-ink-dim text-sm">Sin música por ahora</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="glass-elevated rounded-2xl p-4 flex items-center gap-3 gold-border">
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        {nowPlaying.track.imageUrl && (
          <img src={nowPlaying.track.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 grid place-items-center bg-base/40">
          <Bars />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-gold font-heading">Sonando</p>
        <p className="text-ink font-medium truncate">{nowPlaying.track.title}</p>
        <p className="text-ink-mute text-xs truncate">{joinArtists(nowPlaying.track.artists)}</p>
      </div>
    </div>
  );
}

const Bars = () => (
  <div className="flex items-end gap-0.5 h-5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1 bg-gold rounded-sm animate-pulse"
        style={{
          height: '100%',
          animationDelay: `${i * 150}ms`,
          animationDuration: '700ms',
        }}
      />
    ))}
  </div>
);
