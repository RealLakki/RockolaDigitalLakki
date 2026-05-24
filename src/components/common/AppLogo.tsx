interface Props {
  size?: number;
  className?: string;
  /** Si true, agrega un halo ámbar suave detrás del logo (para heroes). */
  glow?: boolean;
}

/**
 * Logo principal — bafle/parlante visto de frente.
 * Renderizado inline en SVG, sin dependencias de assets externos.
 */
export function AppLogo({ size = 64, className = '', glow = false }: Props) {
  const id = `bafle-${size}`;
  return (
    <div
      className={['relative inline-block shrink-0', className].join(' ')}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-70 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(232,184,0,0.65) 0%, rgba(255,214,51,0.25) 45%, rgba(168,134,0,0) 75%)',
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
          <radialGradient id={`cone-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD633" />
            <stop offset="42%" stopColor="#E8B800" />
            <stop offset="100%" stopColor="#2A1E06" />
          </radialGradient>
          <linearGradient id={`body-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#281A0A" />
            <stop offset="100%" stopColor="#1C1209" />
          </linearGradient>
        </defs>

        {/* Cuerpo del bafle */}
        <circle cx="32" cy="32" r="30" fill={`url(#body-${id})`} />
        {/* Borde exterior ámbar */}
        <circle cx="32" cy="32" r="30" fill="none" stroke="#E8B800" strokeWidth="1.5" />

        {/* Anillo de surround */}
        <circle cx="32" cy="32" r="25" fill="rgba(232,184,0,0.06)" stroke="#E8B800" strokeWidth="1" opacity="0.45" />

        {/* Cono del parlante (gradiente radial: ámbar brillante al centro, oscuro al borde) */}
        <circle cx="32" cy="32" r="20" fill={`url(#cone-${id})`} />

        {/* Anillo de voz (voice coil) */}
        <circle cx="32" cy="32" r="13" fill="none" stroke="#E8B800" strokeWidth="1.2" opacity="0.50" />

        {/* Dust cap oscuro */}
        <circle cx="32" cy="32" r="7.5" fill="#1C1209" />

        {/* Centro ámbar */}
        <circle cx="32" cy="32" r="4.5" fill="#E8B800" />

        {/* Agujero central */}
        <circle cx="32" cy="32" r="2" fill="#1C1209" />
      </svg>
    </div>
  );
}
