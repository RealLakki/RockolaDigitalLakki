import anime from 'animejs';

/** Entra desde abajo con bounce + fade. Para tarjetas de canciones que aparecen. */
export const enterFromBottom = (target: anime.AnimeParams['targets'], delay = 0) =>
  anime({
    targets: target,
    translateY: [24, 0],
    opacity: [0, 1],
    duration: 600,
    delay,
    easing: 'cubicBezier(0.16, 1, 0.3, 1)',
  });

/** Pulso de glow dorado — para botones primarios o el "now playing". */
export const goldPulse = (target: anime.AnimeParams['targets']) =>
  anime({
    targets: target,
    boxShadow: [
      '0 0 18px rgba(0, 212, 255, 0.35)',
      '0 0 45px rgba(0, 212, 255, 0.85), 0 0 90px rgba(0, 212, 255, 0.30)',
      '0 0 18px rgba(0, 212, 255, 0.35)',
    ],
    duration: 2400,
    easing: 'easeInOutSine',
    loop: true,
  });

/** Confirmación cuando se agrega canción — flash + bounce. */
export const confirmAdd = (target: anime.AnimeParams['targets']) =>
  anime({
    targets: target,
    scale: [
      { value: 0.92, duration: 120, easing: 'easeOutQuad' },
      { value: 1.05, duration: 200, easing: 'easeOutBack' },
      { value: 1, duration: 250, easing: 'easeOutQuad' },
    ],
  });

/** Sale al fondo y se desvanece. */
export const exitToTop = (target: anime.AnimeParams['targets']) =>
  anime({
    targets: target,
    translateY: -32,
    opacity: 0,
    duration: 400,
    easing: 'easeInQuad',
  });

/** Sweep de entrada para títulos grandes. */
export const titleSweep = (target: anime.AnimeParams['targets']) =>
  anime({
    targets: target,
    translateX: [-40, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'cubicBezier(0.22, 1, 0.36, 1)',
  });

/** Stagger de items en cola con efecto cascada. */
export const staggerList = (targets: anime.AnimeParams['targets']) =>
  anime({
    targets,
    translateX: [-20, 0],
    opacity: [0, 1],
    duration: 500,
    delay: anime.stagger(60),
    easing: 'easeOutCubic',
  });
