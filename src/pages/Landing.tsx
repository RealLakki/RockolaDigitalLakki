import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import { AppLogo } from '../components/common/AppLogo';
import { NeonButton } from '../components/common/NeonButton';

export function Landing() {
  const logoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = anime.timeline({ easing: 'cubicBezier(0.16, 1, 0.3, 1)' });
    tl.add({ targets: logoRef.current, scale: [0.85, 1], opacity: [0, 1], duration: 900, easing: 'easeOutBack' })
      .add({ targets: badgeRef.current, opacity: [0, 1], translateY: [10, 0], duration: 500 }, '-=400')
      .add({ targets: titleRef.current, translateY: [40, 0], opacity: [0, 1], duration: 900 }, '-=300')
      .add({ targets: subRef.current, translateY: [20, 0], opacity: [0, 1], duration: 700 }, '-=600')
      .add({ targets: ctasRef.current, translateY: [20, 0], opacity: [0, 1], duration: 700 }, '-=500')
      .add({ targets: featuresRef.current?.children ?? [], translateY: [16, 0], opacity: [0, 1], duration: 600, delay: anime.stagger(80) }, '-=400');
  }, []);

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Glow ornamentales en las esquinas */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,90,26,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,90,26,0.14) 0%, transparent 70%)' }}
      />

      <div className="min-h-screen bg-gradient-radial flex flex-col relative">
        <nav className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size={42} />
            <span className="font-heading text-ink text-lg tracking-[0.18em] uppercase hidden sm:inline">Jukebox</span>
          </div>
          <Link
            to="/admin/demo"
            className="text-ink-mute hover:text-gold transition text-sm font-heading tracking-wide uppercase"
          >
            Soy un local →
          </Link>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl text-center flex flex-col items-center">
            {/* Logo */}
            <div ref={logoRef} className="mb-6">
              <AppLogo size={220} glow />
            </div>

            {/* Badge superior con líneas decorativas */}
            <div ref={badgeRef} className="flex items-center gap-3 mb-6">
              <span
                className="block h-px w-10 sm:w-16"
                style={{ background: 'linear-gradient(to right, transparent, #F05A1A)' }}
              />
              <span className="text-gold font-heading uppercase tracking-[0.28em] text-[11px] whitespace-nowrap">
                Rocola digital · Tu mesa, tu música
              </span>
              <span
                className="block h-px w-10 sm:w-16"
                style={{ background: 'linear-gradient(to left, transparent, #F05A1A)' }}
              />
            </div>

            {/* Título */}
            <h1
              ref={titleRef}
              className="text-5xl md:text-7xl font-display italic font-bold text-ink leading-[1.05]"
            >
              La música la pones <span className="gold-text not-italic">tú</span>.
            </h1>

            {/* Subtítulo */}
            <p
              ref={subRef}
              className="mt-6 text-lg md:text-xl text-ink-mute max-w-xl leading-relaxed"
            >
              Escanea el QR de tu mesa, busca lo que quieras escuchar y agrégalo
              a la cola del local. Sin instalar nada, sin esperas, sin que el DJ te ignore.
            </p>

            {/* CTAs centrados */}
            <div ref={ctasRef} className="mt-10 flex gap-3 justify-center flex-wrap w-full">
              <Link to="/v/demo">
                <NeonButton variant="primary" size="lg">🎵 Probar la demo</NeonButton>
              </Link>
              <Link to="/admin/demo">
                <NeonButton variant="ghost" size="lg">Panel del local</NeonButton>
              </Link>
            </div>

            {/* Divider ornamental con diamond */}
            <div className="flex items-center gap-3 mt-16 w-full max-w-md">
              <span className="flex-1 h-px bg-gold/20" />
              <span className="text-gold/60 text-lg">◆</span>
              <span className="flex-1 h-px bg-gold/20" />
            </div>

            {/* Features grid */}
            <div ref={featuresRef} className="mt-12 grid sm:grid-cols-3 gap-4 w-full">
              <Feature icon="📲" title="Escanea el QR" body="Sin app. Solo cámara y a pedir." />
              <Feature icon="🎶" title="Tu música" body="La cola la arma la gente, no el algoritmo." />
              <Feature icon="⚡" title="Pasa al frente" body="Propina al mesero y tu canción suena ya." />
            </div>
          </div>
        </main>

        <footer className="px-6 py-6 border-t" style={{ borderColor: 'rgba(240,90,26,0.20)' }}>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-ink-dim text-xs uppercase tracking-[0.2em] font-heading">
              <span className="text-gold/60">◆</span>
              <span>Jukebox · Rocola digital para bares y restaurantes</span>
              <span className="text-gold/60">◆</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      className="rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
      style={{
        background: 'rgba(19, 19, 28, 0.65)',
        border: '1px solid rgba(0, 212, 255, 0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-heading uppercase tracking-wide text-sm text-gold mb-1">{title}</h3>
      <p className="text-ink-mute text-sm leading-relaxed">{body}</p>
    </div>
  );
}
