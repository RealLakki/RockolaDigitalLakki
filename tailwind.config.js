/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Garantizamos que las clases custom de gradient/sombra estén en el bundle
  // aunque Tailwind no las detecte por análisis estático.
  safelist: [
    'bg-gradient-gold',
    'bg-gradient-radial',
    'bg-gradient-warmth',
    'shadow-gold',
    'shadow-gold-sm',
    'shadow-gold-lg',
    'gold-text',
    'gold-border',
  ],
  theme: {
    extend: {
      colors: {
        // La Cantina Plus — paleta dorada sobre negro cálido
        base: {
          DEFAULT: '#0F0D0A',   // Negro Cantina (fondo)
          elevated: '#1C1712',  // Oscuro Cálido (cards, nav)
          card: '#1C1712',
          border: '#2C2418',    // Borde sutil
        },
        gold: {
          DEFAULT: '#C89B3C',   // Dorado principal
          light: '#F0C060',     // Hover / activo
          dim: '#9A7728',       // shade más oscuro para apoyo
          deep: '#7A5C1A',      // gradient end
        },
        ink: {
          DEFAULT: '#F5F0E8',   // Crema texto
          mute: '#8A7A60',      // Barro muted
          dim: '#5C4F3C',       // muy tenue
        },
        danger: '#B91C1C',      // Rojo Despecho
        success: '#5C8A3C',     // verde tierra (no muy saturado)
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 18px rgba(200, 155, 60, 0.45), 0 0 36px rgba(200, 155, 60, 0.18)',
        'gold-sm': '0 0 8px rgba(200, 155, 60, 0.35)',
        'gold-lg': '0 0 28px rgba(200, 155, 60, 0.55), 0 0 56px rgba(200, 155, 60, 0.25)',
        'gold-inset': 'inset 0 0 18px rgba(200, 155, 60, 0.12)',
        'red-glow': '0 0 18px rgba(185, 28, 28, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at top, rgba(200,155,60,0.14), transparent 60%)',
        'gradient-gold': 'linear-gradient(135deg, #F0C060 0%, #C89B3C 50%, #7A5C1A 100%)',
        'gradient-warmth': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(200,155,60,0.18), transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(200, 155, 60, 0.4)' },
          '50%':      { boxShadow: '0 0 36px rgba(200, 155, 60, 0.75)' },
        },
      },
    },
  },
  plugins: [],
};
