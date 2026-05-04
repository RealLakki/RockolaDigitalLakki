import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import anime from 'animejs';

interface Props {
  slug: string;
  /** Tamaño del QR (default 180px). En TVs grandes considera subirlo. */
  size?: number;
}

/**
 * Panel del QR para mostrar en el reproductor (modo TV). Posicionado en
 * la esquina superior derecha, sutil pero suficientemente grande para
 * escanear desde mesas a 3-4 metros.
 */
export function PlayerQrPanel({ slug, size = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const url = `${window.location.origin}/v/${slug}`;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: '#0F0D0A', light: '#F5F0E8' },
    });
  }, [slug, size]);

  useEffect(() => {
    if (!cardRef.current) return;
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [-12, 0],
      scale: [0.95, 1],
      duration: 700,
      delay: 800,
      easing: 'easeOutCubic',
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className="absolute top-6 right-6 z-30 rounded-2xl p-4 flex flex-col items-center gap-2"
      style={{
        background: 'rgba(15, 13, 10, 0.78)',
        border: '1px solid rgba(200, 155, 60, 0.4)',
        boxShadow: '0 0 24px rgba(200, 155, 60, 0.25), 0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        opacity: 0,
      }}
    >
      <p className="text-gold font-heading uppercase tracking-[0.18em] text-[10px]">
        Pide tu canción
      </p>
      <div className="bg-[#F5F0E8] rounded-lg p-2">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-ink-mute text-[10px] uppercase tracking-wider font-heading">
        Escanea con tu celular
      </p>
    </div>
  );
}
