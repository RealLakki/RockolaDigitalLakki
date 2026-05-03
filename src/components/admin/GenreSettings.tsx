import { ALL_GENRES, GENRE_LABEL, type Genre, type Venue } from '../../lib/types';
import { updateVenue } from '../../lib/supabase';
import { GlowCard } from '../common/GlowCard';

interface Props {
  venue: Venue;
  onUpdate: (patch: Partial<Venue>) => void;
}

export function GenreSettings({ venue, onUpdate }: Props) {
  const toggleGenre = async (g: Genre) => {
    const next = venue.allowedGenres.includes(g)
      ? venue.allowedGenres.filter((x) => x !== g)
      : [...venue.allowedGenres, g];
    await updateVenue(venue.id, { allowedGenres: next });
    onUpdate({ allowedGenres: next });
  };

  return (
    <GlowCard>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-heading text-gold uppercase tracking-widest text-xs">
          Géneros permitidos
        </h3>
        <span className="text-ink-dim text-xs">
          {venue.allowedGenres.length === 0 ? 'Todos' : `${venue.allowedGenres.length} activos`}
        </span>
      </div>
      <p className="text-ink-mute text-xs mb-3">
        Si no marcas ninguno, se permiten todos. La detección de género depende de Spotify y es mejor esfuerzo.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_GENRES.map((g) => {
          const active = venue.allowedGenres.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                active
                  ? 'bg-gradient-gold text-[#0F0D0A] shadow-gold-sm'
                  : 'bg-base-card border border-base-border text-ink-mute hover:border-gold/40 hover:text-ink',
              ].join(' ')}
            >
              {GENRE_LABEL[g]}
            </button>
          );
        })}
      </div>
    </GlowCard>
  );
}
