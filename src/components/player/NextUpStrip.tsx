import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { joinArtists } from '../../utils/formatters';
import type { QueueItem } from '../../lib/types';

interface Props {
  items: QueueItem[];
}

export function NextUpStrip({ items }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.next-row');
    anime({
      targets: els,
      translateY: [12, 0],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(80),
      easing: 'easeOutCubic',
    });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center text-ink-dim text-sm py-8">
        Cola vacía — pídele al cliente que escanee el QR
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-gold font-heading mb-1">
        En cola
      </p>
      {items.slice(0, 6).map((item, i) => (
        <div key={item.id} className="next-row flex items-center gap-3 glass rounded-xl px-3 py-2">
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
            <img src={item.track.imageUrl} alt="" className="w-10 h-10 rounded-md shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-medium truncate">{item.track.title}</p>
            <p className="text-ink-mute text-xs truncate">
              {joinArtists(item.track.artists)}
              {item.requestedByName && ` · ${item.requestedByName}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
