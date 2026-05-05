import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { staggerList } from '../../utils/animations';
import { joinArtists } from '../../utils/formatters';
import type { QueueItem } from '../../lib/types';

interface Props {
  items: QueueItem[];
  highlightClientId?: string;
}

export function QueueList({ items, highlightClientId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const allRows = containerRef.current.querySelectorAll('.queue-row');

    if (isFirstRenderRef.current) {
      // Primer render: stagger entry
      if (allRows.length > 0) staggerList(allRows);
      isFirstRenderRef.current = false;
    } else {
      // Renders subsiguientes: solo highlight a los nuevos
      const newRows: Element[] = [];
      allRows.forEach((row) => {
        const id = row.getAttribute('data-id');
        if (id && !prevIdsRef.current.has(id)) newRows.push(row);
      });
      if (newRows.length > 0) {
        anime({
          targets: newRows,
          translateX: [-20, 0],
          opacity: [0, 1],
          backgroundColor: [
            'rgba(240, 192, 96, 0.25)',
            'rgba(28, 23, 18, 0.4)',
          ],
          duration: 1100,
          easing: 'easeOutCubic',
        });
      }
    }
    prevIdsRef.current = new Set(items.map((i) => i.id));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <p className="text-2xl mb-2">🎙️</p>
        <p className="text-ink font-medium text-sm mb-1">La cantina te escucha</p>
        <p className="text-ink-dim text-xs leading-relaxed">
          Nadie ha pedido música todavía. Busca tu canción arriba y sé tú el que rompa el silencio.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isMine = item.requestedBy === highlightClientId;
        return (
          <div
            key={item.id}
            data-id={item.id}
            className={[
              'queue-row flex items-center gap-3 rounded-xl px-3 py-2 transition-all',
              isMine ? 'bg-gold/10 border border-gold/30' : 'bg-base-card/40 border border-transparent',
            ].join(' ')}
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
              <img
                src={item.track.imageUrl}
                alt=""
                className="w-9 h-9 rounded-md object-cover shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium truncate">{item.track.title}</p>
              <p className="text-ink-mute text-xs truncate">{joinArtists(item.track.artists)}</p>
            </div>
            {isMine && <span className="text-gold text-xs font-display shrink-0">tu pick</span>}
          </div>
        );
      })}
    </div>
  );
}
