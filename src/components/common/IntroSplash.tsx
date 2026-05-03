import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { CantinaLogo } from './CantinaLogo';

interface Props {
  onDone: () => void;
  /** Duración total de la animación en ms (default 3500). */
  duration?: number;
}

const TITLE_LETTERS = 'LA CANTINA PLUS'.split('');
const SUBTITLE = 'CARTAGENA · DESPECHO & POPULAR';
const RAY_COUNT = 14;
const PARTICLE_COUNT = 36;

/**
 * Splash de entrada espectacular: rayos radiantes salen del logo, particles
 * doradas flotan, el título aparece letra por letra, todo sobre fondo negro
 * profundo. Después de `duration` se hace fade out y llama onDone().
 */
export function IntroSplash({ onDone, duration = 3500 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return;

    const tl = anime.timeline({
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      complete: () => {
        // Fade out final
        anime({
          targets: rootRef.current,
          opacity: [1, 0],
          duration: 700,
          easing: 'easeInOutQuad',
          complete: () => {
            setDone(true);
            onDone();
          },
        });
      },
    });

    // 1. Flash inicial blanco/dorado que abre la escena
    tl.add({
      targets: flashRef.current,
      opacity: [0, 0.8, 0],
      scale: [0, 30],
      duration: 700,
      easing: 'easeOutExpo',
    });

    // 2. Logo aparece con back bounce
    tl.add(
      {
        targets: logoWrapRef.current,
        scale: [0, 1],
        opacity: [0, 1],
        rotate: [-20, 0],
        duration: 900,
        easing: 'easeOutBack',
      },
      '-=400',
    );

    // 3. Anillo dorado se expande alrededor del logo
    tl.add(
      {
        targets: ringRef.current,
        scale: [0, 1.6],
        opacity: [0.9, 0],
        duration: 1100,
        easing: 'easeOutQuad',
      },
      '-=600',
    );

    // 4. Rayos radiantes salen del logo
    tl.add(
      {
        targets: raysRef.current?.querySelectorAll('.ray'),
        scaleY: [0, 1],
        opacity: [0, 0.7, 0],
        duration: 900,
        delay: anime.stagger(40, { from: 'first' }),
        easing: 'easeOutQuad',
      },
      '-=900',
    );

    // 5. Particles doradas suben con drift
    tl.add(
      {
        targets: particlesRef.current?.querySelectorAll('.particle'),
        translateY: () => anime.random(-180, -60),
        translateX: () => anime.random(-80, 80),
        scale: [0, () => anime.random(0.4, 1.2)],
        opacity: [0, 0.9, 0],
        duration: () => anime.random(1200, 2200),
        delay: anime.stagger(30),
        easing: 'easeOutSine',
      },
      '-=1100',
    );

    // 6. Título letra por letra
    tl.add(
      {
        targets: titleRef.current?.querySelectorAll('.letter'),
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.8, 1],
        duration: 600,
        delay: anime.stagger(50),
        easing: 'easeOutBack',
      },
      '-=700',
    );

    // 7. Subtítulo aparece elegante
    tl.add(
      {
        targets: subtitleRef.current,
        opacity: [0, 1],
        letterSpacing: ['0.05em', '0.28em'],
        duration: 800,
        easing: 'easeOutCubic',
      },
      '-=300',
    );

    // 8. Hold para que se aprecie
    tl.add({
      targets: rootRef.current,
      opacity: 1,
      duration: Math.max(0, duration - 3500),
    });
  }, [duration, onDone]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden"
      style={{ background: '#050403' }}
    >
      {/* Background con grain sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(200,155,60,0.18) 0%, rgba(15,13,10,0.95) 45%, #050403 75%)',
        }}
      />

      {/* Flash inicial */}
      <div
        ref={flashRef}
        className="absolute w-32 h-32 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(240,192,96,0.8) 0%, rgba(200,155,60,0.4) 40%, transparent 80%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Rayos radiantes */}
      <div
        ref={raysRef}
        className="absolute w-[600px] h-[600px] pointer-events-none"
        style={{ transformOrigin: 'center' }}
      >
        {Array.from({ length: RAY_COUNT }).map((_, i) => {
          const angle = (360 / RAY_COUNT) * i;
          return (
            <div
              key={i}
              className="ray absolute left-1/2 top-1/2"
              style={{
                width: '2px',
                height: '300px',
                background:
                  'linear-gradient(to top, rgba(200,155,60,0) 0%, rgba(240,192,96,0.85) 50%, rgba(200,155,60,0) 100%)',
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
          );
        })}
      </div>

      {/* Anillo expansivo */}
      <div
        ref={ringRef}
        className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          border: '2px solid rgba(200,155,60,0.6)',
          boxShadow:
            '0 0 30px rgba(200,155,60,0.4), inset 0 0 30px rgba(200,155,60,0.2)',
        }}
      />

      {/* Particles flotando */}
      <div
        ref={particlesRef}
        className="absolute w-[500px] h-[500px] pointer-events-none"
      >
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
          const angle = (360 / PARTICLE_COUNT) * i;
          const r = 60 + Math.random() * 80;
          const x = Math.cos((angle * Math.PI) / 180) * r;
          const y = Math.sin((angle * Math.PI) / 180) * r;
          return (
            <div
              key={i}
              className="particle absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 4,
                height: 4,
                marginLeft: x,
                marginTop: y,
                background: '#F0C060',
                boxShadow: '0 0 6px rgba(240,192,96,0.85)',
              }}
            />
          );
        })}
      </div>

      {/* Logo central */}
      <div
        ref={logoWrapRef}
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 0 30px rgba(200,155,60,0.5))' }}
      >
        <CantinaLogo size={240} glow />
      </div>

      {/* Texto debajo del logo */}
      <div className="absolute bottom-[18vh] flex flex-col items-center px-4">
        <h1
          ref={titleRef}
          className="font-display italic font-bold text-3xl md:text-5xl text-ink mb-3 tracking-wide"
        >
          {TITLE_LETTERS.map((letter, i) => (
            <span
              key={i}
              className="letter inline-block"
              style={{ opacity: 0 }}
            >
              {letter === ' ' ? ' ' : letter}
            </span>
          ))}
        </h1>
        <p
          ref={subtitleRef}
          className="text-gold font-heading uppercase text-[11px] md:text-xs"
          style={{ opacity: 0, letterSpacing: '0.28em' }}
        >
          {SUBTITLE}
        </p>
      </div>
    </div>
  );
}
