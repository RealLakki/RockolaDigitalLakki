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
        // Paleta vintage jukebox — marino profundo + naranja intenso
        base: {
          DEFAULT:  '#061B4A',   // Azul marino profundo (página)
          elevated: '#0A2C67',   // Azul noche (cards / superficies)
          card:     '#0A2C67',
          border:   '#1E5D8F',   // Azul medio (borde sutil)
        },
        // `gold` = naranja intenso (CTA, glow, brand)
        gold: {
          DEFAULT: '#F05A1A',    // Naranja intenso principal
          light:   '#FF7A3D',    // Hover / activo
          dim:     '#C44A14',    // Shade más oscuro
          deep:    '#7A2D0A',    // Gradient end
        },
        ink: {
          DEFAULT: '#EED9B8',    // Crema vintage (texto principal)
          mute:    '#D8B08A',    // Beige papel (texto secundario)
          dim:     '#8B6E50',    // Texto muy tenue
        },
        // Azul petróleo — acento secundario frío
        teal: {
          DEFAULT: '#2D7CA3',
          light:   '#3D9FCC',
          dim:     '#1E5D8F',
        },
        // Stub compat
        peach: '#0A2C67',
        mint:  '#0D3A5C',
        cream: '#EED9B8',

        danger:  '#B62828',     // Rojo sello postal
        success: '#3FB87A',     // Verde cálido
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold:         '0 0 18px rgba(240,90,26,0.50), 0 0 36px rgba(240,90,26,0.20)',
        'gold-sm':    '0 0 8px rgba(240,90,26,0.40)',
        'gold-lg':    '0 0 28px rgba(240,90,26,0.60), 0 0 56px rgba(240,90,26,0.25)',
        'gold-inset': 'inset 0 0 18px rgba(240,90,26,0.12)',
        'red-glow':   '0 0 18px rgba(182,40,40,0.55)',
        'teal':       '0 0 18px rgba(45,124,163,0.45)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(ellipse at top, rgba(240,90,26,0.18), transparent 60%)',
        'gradient-gold':    'linear-gradient(135deg, #FF7A3D 0%, #F05A1A 55%, #C44A14 100%)',
        'gradient-warmth':  'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(240,90,26,0.20), transparent 70%)',
        'gradient-teal':    'linear-gradient(135deg, #3D9FCC 0%, #2D7CA3 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(240,90,26,0.40)' },
          '50%':      { boxShadow: '0 0 36px rgba(240,90,26,0.80)' },
        },
      },
    },
  },
  plugins: [],
};
