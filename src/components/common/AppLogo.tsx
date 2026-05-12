interface Props {
  size?: number;
  className?: string;
  /** Si true, agrega un halo coral suave detrás del logo (para heroes). */
  glow?: boolean;
}

/**
 * Logo principal de la app — disco/vinilo con nota musical.
 * Renderizado inline en SVG, sin dependencias de assets externos.
 * Versión animada para spinners: `AnimatedLogo`.
 */
export function AppLogo({ size = 64, className = '', glow = false }: Props) {
  return (
    <div
      className={['relative inline-block shrink-0', className].join(' ')}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,106,170,0.55) 0%, rgba(255,218,193,0.25) 45%, rgba(94,195,194,0) 75%)',
          }}
        />
      )}
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        fill="none"
        className="relative w-full h-full"
      >
        <defs>
          <linearGradient id={`app-logo-bg-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFA0C4" />
            <stop offset="100%" stopColor="#FF6AAA" />
          </linearGradient>
        </defs>

        {/* Disco/vinilo principal */}
        <circle cx="32" cy="32" r="29" fill={`url(#app-logo-bg-${size})`} />
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          opacity="0.50"
        />
        <circle
          cx="32"
          cy="32"
          r="14"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          opacity="0.50"
        />

        {/* Etiqueta central teal */}
        <circle cx="32" cy="32" r="6" fill="#17A1B9" />
        <circle cx="32" cy="32" r="2" fill="#FFFADC" />

        {/* Nota musical superpuesta — sobresale del disco */}
        <g transform="translate(36 16)" fill="#FFFADC">
          <rect x="0" y="0" width="2.5" height="16" rx="1" />
          <ellipse cx="-2" cy="16" rx="4.5" ry="3.5" />
        </g>
      </svg>
    </div>
  );
}
