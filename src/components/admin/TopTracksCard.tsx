import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useTopTracks } from '../../hooks/useTopTracks';
import { joinArtists } from '../../utils/formatters';
import { GlowCard } from '../common/GlowCard';

interface Props {
  venueId: string;
}

/**
 * Ranking de canciones más pedidas en el bar. Útil para el dueño:
 * detectar hits, identificar patrones, decidir qué bloquear/promover.
 */
export function TopTracksCard({ venueId }: Props) {
  const { tracks, loading } = useTopTracks(venueId, 15);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const els = listRef.current.querySelectorAll('.top-row');
    if (els.length > 0) {
      anime({
        targets: els,
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(45),
        easing: 'easeOutCubic',
      });
    }
  }, [tracks.length]);

  return (
    <GlowCard>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-heading text-gold uppercase tracking-widest text-xs">
          Más pedidas
        </h3>
        <span className="text-ink-dim text-xs font-heading uppercase tracking-wider">
          {loading ? 'cargando...' : `${tracks.length} top`}
        </span>
      </div>

      {!loading && tracks.length === 0 && (
        <p className="text-ink-dim text-sm py-4 text-center">
          Aún no se ha reproducido nada — el ranking aparece cuando suene la primera canción.
        </p>
      )}

      <div ref={listRef} className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto">
        {tracks.map((t, i) => (
          <div
            key={t.providerId}
            className="top-row flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-base-card/50 transition"
          >
            <span
              className={[
                'w-6 text-center text-xs font-heading font-bold shrink-0',
                i < 3 ? 'text-gold' : 'text-ink-dim',
              ].join(' ')}
            >
              {i + 1}
            </span>
            {t.imageUrl ? (
              <img src={t.imageUrl} alt="" className="w-10 h-10 rounded-md shrink-0 object-cover" loading="lazy" />
            ) : (
              <div className="w-10 h-10 rounded-md bg-base-elevated shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium truncate">{t.title}</p>
              <p className="text-ink-mute text-xs truncate">{joinArtists(t.artists)}</p>
            </div>
            <div
              className="shrink-0 px-2.5 py-1 rounded-md text-xs font-heading font-bold tabular-nums"
              style={{
                background: i < 3 ? 'rgba(200,155,60,0.18)' : 'rgba(28,23,18,0.6)',
                color: i < 3 ? '#F0C060' : '#A89A82',
                border: '1px solid rgba(200,155,60,0.2)',
              }}
            >
              ×{t.requestCount}
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}
