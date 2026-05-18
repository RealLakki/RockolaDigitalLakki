import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AppLogo } from './AppLogo';

interface Props {
  onDone: () => void;
  duration?: number;
}

const TITLE_LETTERS = 'JUKEBOX'.split('');
const SUBTITLE = 'TU MÚSICA · TU MESA';
const RAY_COUNT = 14;
const PARTICLE_COUNT = 36;

export function IntroSplash({ onDone, duration = 3500 }: Props) {
  const rootRef      = useRef<HTMLDivElement>(null);
  const flashRef     = useRef<HTMLDivElement>(null);
  const logoWrapRef  = useRef<HTMLDivElement>(null);
  const raysRef      = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const titleRef     = useRef<HTMLHeadingElement>(null);
  const subtitleRef  = useRef<HTMLParagraphElement>(null);
  const ringRef      = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(rootRef.current, {
            opacity: 0,
            duration: 0.65,
            ease: 'power2.inOut',
            onComplete: () => { setDone(true); onDone(); },
          });
        },
      });

      // Estado inicial
      gsap.set([flashRef.current, ringRef.current], { opacity: 0 });
      gsap.set(logoWrapRef.current, { opacity: 0, scale: 0, rotation: -18 });
      gsap.set(raysRef.current?.querySelectorAll('.ray') ?? [], { scaleY: 0, opacity: 0 });
      gsap.set(particlesRef.current?.querySelectorAll('.particle') ?? [], { opacity: 0, scale: 0 });
      gsap.set(titleRef.current?.querySelectorAll('.letter') ?? [], { opacity: 0, y: 28, scale: 0.8 });
      gsap.set(subtitleRef.current, { opacity: 0, letterSpacing: '0.04em' });

      // 1. Flash explosión inicial
      tl.fromTo(flashRef.current,
        { opacity: 0, scale: 0 },
        { opacity: 0.85, scale: 28, duration: 0.55, ease: 'expo.out' }
      ).to(flashRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.1');

      // 2. Logo aparece con elastic bounce
      tl.to(logoWrapRef.current, {
        scale: 1, opacity: 1, rotation: 0,
        duration: 0.75, ease: 'back.out(1.8)',
      }, '-=0.45');

      // 3. Anillo dorado se expande y desvanece
      tl.fromTo(ringRef.current,
        { scale: 0.4, opacity: 0.9 },
        { scale: 1.8, opacity: 0, duration: 0.9, ease: 'power2.out' },
        '-=0.6'
      );

      // 4. Rayos radiales — stagger muy rápido
      tl.to(raysRef.current?.querySelectorAll('.ray') ?? [], {
        scaleY: 1, opacity: 0.7,
        duration: 0.5, stagger: 0.022, ease: 'power2.out',
      }, '-=0.75')
      .to(raysRef.current?.querySelectorAll('.ray') ?? [], {
        opacity: 0, duration: 0.5, stagger: 0.022, ease: 'power2.in',
      }, '-=0.2');

      // 5. Partículas explotan desde el centro
      const particles = particlesRef.current?.querySelectorAll('.particle') ?? [];
      particles.forEach((p, i) => {
        const angle = (360 / PARTICLE_COUNT) * i;
        const dist  = 70 + Math.random() * 90;
        const dx    = Math.cos((angle * Math.PI) / 180) * dist;
        const dy    = Math.sin((angle * Math.PI) / 180) * dist;
        tl.to(p, {
          opacity: 0.9, scale: 0.6 + Math.random() * 0.8,
          x: dx, y: dy,
          duration: 0.7 + Math.random() * 0.5,
          ease: 'power2.out',
          delay: i * 0.012,
        }, '-=0.9');
      });
      tl.to(particles, { opacity: 0, duration: 0.5 }, '-=0.3');

      // 6. Letras caen una a una con bounce
      tl.to(titleRef.current?.querySelectorAll('.letter') ?? [], {
        opacity: 1, y: 0, scale: 1,
        duration: 0.45, stagger: 0.045, ease: 'back.out(2)',
      }, '-=0.5');

      // 7. Subtítulo barre con letter-spacing
      tl.to(subtitleRef.current, {
        opacity: 1, letterSpacing: '0.28em',
        duration: 0.65, ease: 'power3.out',
      }, '-=0.2');

      // 8. Hold para que se aprecie
      const hold = Math.max(0, duration - 3500);
      if (hold > 0) tl.to({}, { duration: hold / 1000 });

    }, rootRef);

    return () => ctx.revert();
  }, [duration, onDone]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden"
      style={{ background: '#050510' }}
    >
      {/* Halo de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,212,255,0.28) 0%, rgba(10,10,15,0.95) 45%, #050510 75%)',
        }}
      />

      {/* Flash */}
      <div
        ref={flashRef}
        className="absolute w-32 h-32 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(91,226,255,0.9) 0%, rgba(0,212,255,0.5) 40%, transparent 80%)',
          filter: 'blur(6px)',
        }}
      />

      {/* Rayos radiales */}
      <div
        ref={raysRef}
        className="absolute w-[600px] h-[600px] pointer-events-none"
        style={{ transformOrigin: 'center' }}
      >
        {Array.from({ length: RAY_COUNT }).map((_, i) => (
          <div
            key={i}
            className="ray absolute left-1/2 top-1/2"
            style={{
              width: '2px',
              height: '300px',
              background:
                'linear-gradient(to top, rgba(0,212,255,0) 0%, rgba(91,226,255,0.9) 50%, rgba(0,212,255,0) 100%)',
              transform: `translate(-50%, -100%) rotate(${(360 / RAY_COUNT) * i}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        ))}
      </div>

      {/* Anillo expansivo */}
      <div
        ref={ringRef}
        className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          border: '2px solid rgba(0,212,255,0.7)',
          boxShadow: '0 0 30px rgba(0,212,255,0.45), inset 0 0 30px rgba(91,226,255,0.20)',
        }}
      />

      {/* Partículas */}
      <div ref={particlesRef} className="absolute w-0 h-0 pointer-events-none">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              width: 4 + Math.random() * 3,
              height: 4 + Math.random() * 3,
              background: i % 3 === 0 ? '#5BE2FF' : '#00D4FF',
              boxShadow: '0 0 8px rgba(91,226,255,0.9)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Logo central */}
      <div
        ref={logoWrapRef}
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 0 32px rgba(0,212,255,0.7))' }}
      >
        <AppLogo size={240} glow />
      </div>

      {/* Texto */}
      <div className="absolute bottom-[18vh] flex flex-col items-center px-4">
        <h1
          ref={titleRef}
          className="font-display italic font-bold text-3xl md:text-5xl text-ink mb-3 tracking-wide"
        >
          {TITLE_LETTERS.map((letter, i) => (
            <span key={i} className="letter inline-block">
              {letter}
            </span>
          ))}
        </h1>
        <p
          ref={subtitleRef}
          className="text-gold font-heading uppercase text-[11px] md:text-xs"
          style={{ letterSpacing: '0.28em' }}
        >
          {SUBTITLE}
        </p>
      </div>
    </div>
  );
}
