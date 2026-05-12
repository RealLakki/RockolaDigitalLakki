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
        // Versión genérica — paleta pastel (cream / teal / coral / mint / peach)
        // Conservamos los nombres `base`, `gold`, `ink` por compat con todas
        // las clases existentes; cambia solo el hex que cada slot representa.
        base: {
          DEFAULT:  '#FFFADC',   // Cream (página)
          elevated: '#FFFFFF',   // Cards
          card:     '#FFFFFF',
          border:   '#F0E4C8',   // Borde sutil cream-oscuro
        },
        // `gold` actúa como el acento principal de pop / CTA → coral pink.
        gold: {
          DEFAULT: '#FF6AAA',    // Coral principal
          light:   '#FFA0C4',    // Hover / activo
          dim:     '#E04A85',    // shade más oscuro
          deep:    '#C82F6F',    // gradient end
        },
        ink: {
          DEFAULT: '#0F2A33',    // Texto principal (teal-black)
          mute:    '#6A8590',    // Texto secundario
          dim:     '#A0B5BC',    // Texto muy tenue
        },
        // Secundario / brand cool — teal del palette
        teal: {
          DEFAULT: '#17A1B9',
          light:   '#5EC3C2',
          dim:     '#0D7A8C',
        },
        // Soft accents directos (uso ocasional para chips, badges, glows)
        peach: '#FFDAC1',
        mint:  '#E6FCD8',
        cream: '#FFFADC',

        danger:  '#E63A6A',     // pink-red, casa con el coral
        success: '#6FBF7E',     // mint-derived
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold:        '0 0 18px rgba(255,106,170,0.35), 0 0 36px rgba(255,106,170,0.12)',
        'gold-sm':   '0 0 8px rgba(255,106,170,0.28)',
        'gold-lg':   '0 0 28px rgba(255,106,170,0.45), 0 0 56px rgba(255,106,170,0.20)',
        'gold-inset':'inset 0 0 18px rgba(255,106,170,0.10)',
        'red-glow':  '0 0 18px rgba(230,58,106,0.45)',
        'teal':      '0 0 18px rgba(23,161,185,0.30)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(ellipse at top, rgba(94,195,194,0.20), transparent 60%)',
        'gradient-gold':    'linear-gradient(135deg, #FFA0C4 0%, #FF6AAA 50%, #C82F6F 100%)',
        'gradient-warmth':  'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,218,193,0.55), transparent 70%)',
        'gradient-teal':    'linear-gradient(135deg, #5EC3C2 0%, #17A1B9 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(255, 106, 170, 0.35)' },
          '50%':      { boxShadow: '0 0 36px rgba(255, 106, 170, 0.65)' },
        },
      },
    },
  },
  plugins: [],
};
