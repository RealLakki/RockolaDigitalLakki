/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        // Paleta El Bafle — negro cálido profundo + ámbar eléctrico
        base: {
          DEFAULT:  '#0F0A06',   // Negro cálido profundo (página)
          elevated: '#1C1209',   // Superficie oscura cálida (cards)
          card:     '#1C1209',
          border:   '#3A2A18',   // Borde café cálido
        },
        // `gold` = ámbar eléctrico (CTA, glow, brand)
        gold: {
          DEFAULT: '#E8B800',    // Ámbar eléctrico principal
          light:   '#FFD633',    // Hover / activo
          dim:     '#A88600',    // Shade oscuro
          deep:    '#4A3800',    // Gradient end
        },
        ink: {
          DEFAULT: '#F2E8D0',    // Crema cálida (texto principal)
          mute:    '#D4C4A0',    // Beige papel (texto secundario)
          dim:     '#8A7A60',    // Texto muy tenue
        },
        // Verde eléctrico — acento EQ / secundario
        teal: {
          DEFAULT: '#0ABD4A',
          light:   '#14E85A',
          dim:     '#077A30',
        },
        // Stub compat
        peach: '#1C1209',
        mint:  '#0F2A18',
        cream: '#F2E8D0',

        danger:  '#B62828',
        success: '#3FB87A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold:         '0 0 18px rgba(232,184,0,0.50), 0 0 36px rgba(232,184,0,0.20)',
        'gold-sm':    '0 0 8px rgba(232,184,0,0.40)',
        'gold-lg':    '0 0 28px rgba(232,184,0,0.60), 0 0 56px rgba(232,184,0,0.25)',
        'gold-inset': 'inset 0 0 18px rgba(232,184,0,0.12)',
        'red-glow':   '0 0 18px rgba(182,40,40,0.55)',
        'teal':       '0 0 18px rgba(10,189,74,0.45)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(ellipse at top, rgba(232,184,0,0.16), transparent 60%)',
        'gradient-gold':    'linear-gradient(135deg, #FFD633 0%, #E8B800 55%, #A88600 100%)',
        'gradient-warmth':  'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(232,184,0,0.18), transparent 70%)',
        'gradient-teal':    'linear-gradient(135deg, #14E85A 0%, #0ABD4A 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(232,184,0,0.40)' },
          '50%':      { boxShadow: '0 0 36px rgba(232,184,0,0.80)' },
        },
      },
    },
  },
  plugins: [],
};
