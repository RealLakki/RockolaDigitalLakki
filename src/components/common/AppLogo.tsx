interface Props {
  size?: number;
  className?: string;
  /** Si true, agrega un halo dorado suave detrás del logo (para heroes). */
  glow?: boolean;
}

/**
 * Logo principal de La Cantina Plus — el medallón oficial (/public/logo.png).
 * Se mantiene el nombre AppLogo por compatibilidad con los call-sites.
 * Para spinners de carga usar `AnimatedLogo` (animado).
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
              'radial-gradient(circle, rgba(200,155,60,0.65) 0%, rgba(200,155,60,0) 70%)',
          }}
        />
      )}
      {/* WebP es ~10x más liviano que PNG; <picture> hace fallback a PNG solo. */}
      <picture>
        <source srcSet="/logo.webp" type="image/webp" />
        <img
          src="/logo.png"
          alt="La Cantina Plus"
          className="relative w-full h-full object-contain select-none"
          draggable={false}
          style={{
            clipPath: 'circle(48%)',
            WebkitClipPath: 'circle(48%)',
            mixBlendMode: 'screen',
          }}
        />
      </picture>
    </div>
  );
}
