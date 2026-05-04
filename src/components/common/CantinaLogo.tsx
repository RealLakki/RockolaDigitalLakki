interface Props {
  size?: number;
  className?: string;
  /** Si true, agrega un glow dorado tras el logo (queda mejor en heroes). */
  glow?: boolean;
}

/**
 * Logo oficial de La Cantina Plus. El archivo vive en /public/logo.png.
 * Para spinners de carga usar `AnimatedLogo` (animado).
 */
export function CantinaLogo({ size = 64, className = '', glow = false }: Props) {
  return (
    <div
      className={['relative inline-block shrink-0', className].join(' ')}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(200,155,60,0.65) 0%, rgba(200,155,60,0) 70%)',
          }}
        />
      )}
      {/* WebP es ~10x más liviano que PNG. Fallback a PNG por si algún
          browser ancestral no soporta WebP (raro, pero el <picture>
          lo maneja sin código extra). */}
      <picture>
        <source srcSet="/logo.webp" type="image/webp" />
        <img
          src="/logo.png"
          alt="La Cantina Plus"
          className="relative w-full h-full object-contain select-none"
          draggable={false}
          // clip-path: recorta el cuadrado al círculo del logo,
          // eliminando las esquinas negras.
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
