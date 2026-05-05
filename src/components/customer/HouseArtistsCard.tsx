import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { itunesSearchArtists, type ArtistResult } from '../../lib/itunes';
import { GlowCard } from '../common/GlowCard';

interface Props {
  onSelectArtist: (artist: ArtistResult) => void;
}

/**
 * Lista de "Las de siempre" — artistas favoritos del bar. Click en cualquiera
 * te lleva a su perfil para ver todas sus canciones sin tener que buscar.
 *
 * Lista hardcoded para La Cantina Plus. En el futuro: configurable por venue.
 */
const HOUSE_ARTISTS = [
  { name: 'Charrito Negro', searchTerm: 'Charrito Negro' },
  { name: 'Luis Alberto Posada', searchTerm: 'Luis Alberto Posada' },
  { name: 'Yeison Jiménez', searchTerm: 'Yeison Jimenez' },
  { name: 'Andariego', searchTerm: 'Andariego' },
  { name: 'Paola Jara', searchTerm: 'Paola Jara' },
  { name: 'Jessi Uribe', searchTerm: 'Jessi Uribe' },
];

export function HouseArtistsCard({ onSelectArtist }: Props) {
  const [resolved, setResolved] = useState<Map<string, ArtistResult | null>>(new Map());
  const ref = useRef<HTMLDivElement>(null);

  // Resuelve cada artista a un ArtistResult (con itunesId real) en background.
  // Una vez resuelto, queda cacheado en el Map.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const a of HOUSE_ARTISTS) {
        if (cancelled) return;
        if (resolved.has(a.name)) continue;
        try {
          const results = await itunesSearchArtists(a.searchTerm, { limit: 1 });
          if (cancelled) return;
          setResolved((m) => new Map(m).set(a.name, results[0] ?? null));
        } catch {
          if (!cancelled) setResolved((m) => new Map(m).set(a.name, null));
        }
      }
    };
    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.artist-chip');
    if (els.length > 0) {
      anime({
        targets: els,
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(40),
        easing: 'easeOutBack',
      });
    }
  }, []);

  return (
    <GlowCard>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-heading text-gold uppercase tracking-widest text-xs">
          Las de siempre
        </h3>
        <span className="text-ink-dim text-[10px] font-heading uppercase tracking-wider">
          Artistas de la casa
        </span>
      </div>
      <p className="text-ink-mute text-xs mb-3 leading-snug">
        Toca un artista para ver sus canciones y agregarlas directo.
      </p>

      <div ref={ref} className="flex flex-wrap gap-2">
        {HOUSE_ARTISTS.map((a) => {
          const artist = resolved.get(a.name);
          const ready = artist !== undefined;
          const found = !!artist;

          return (
            <button
              key={a.name}
              onClick={() => artist && onSelectArtist(artist)}
              disabled={!found}
              className="artist-chip group flex items-center gap-2 px-3 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: found
                  ? 'linear-gradient(135deg, rgba(240,192,96,0.15) 0%, rgba(200,155,60,0.06) 100%)'
                  : 'rgba(28,23,18,0.5)',
                border: '1px solid rgba(200,155,60,0.30)',
              }}
            >
              <div
                className="w-7 h-7 rounded-full grid place-items-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(240,192,96,0.4), rgba(122,92,26,0.5))',
                }}
              >
                <span className="text-[10px] font-heading font-bold text-[#0F0D0A]">
                  {a.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
              <span className="text-ink text-sm font-medium pr-1">
                {a.name}
              </span>
              {!ready && (
                <span className="text-ink-dim text-[10px]">...</span>
              )}
            </button>
          );
        })}
      </div>
    </GlowCard>
  );
}
