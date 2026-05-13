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
        // Paleta tech — negro profundo + azul neón.
        // Mantenemos los nombres de slot (`base`, `gold`, `ink`) por compat
        // con todas las utilities existentes; solo cambia el hex que cada
        // slot representa.
        base: {
          DEFAULT:  '#0A0A0F',   // Negro profundo (página)
          elevated: '#13131C',   // Cards / superficies
          card:     '#13131C',
          border:   '#23232E',   // Borde sutil
        },
        // `gold` actúa como el acento principal (CTA, glow, brand) → azul neón.
        gold: {
          DEFAULT: '#00D4FF',    // Cian neón principal
          light:   '#5BE2FF',    // Hover / activo
          dim:     '#0099CC',    // shade más oscuro
          deep:    '#005F80',    // gradient end
        },
        ink: {
          DEFAULT: '#E8F4FF',    // Texto principal (blanco-azulado)
          mute:    '#7A8B99',    // Texto secundario
          dim:     '#3D4754',    // Texto muy tenue
        },
        // Acento cool secundario (azul más sólido para gradients)
        teal: {
          DEFAULT: '#1FB8FF',
          light:   '#5BE2FF',
          dim:     '#0077BB',
        },
        // Stub colors mantenidos para compat (peach/mint/cream se usan poco):
        peach: '#1A2440',
        mint:  '#16323A',
        cream: '#13131C',

        danger:  '#FF3B5C',     // rojo neón
        success: '#3FE8A9',     // verde menta neón
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold:        '0 0 18px rgba(0,212,255,0.45), 0 0 36px rgba(0,212,255,0.18)',
        'gold-sm':   '0 0 8px rgba(0,212,255,0.35)',
        'gold-lg':   '0 0 28px rgba(0,212,255,0.55), 0 0 56px rgba(0,212,255,0.22)',
        'gold-inset':'inset 0 0 18px rgba(0,212,255,0.12)',
        'red-glow':  '0 0 18px rgba(255,59,92,0.50)',
        'teal':      '0 0 18px rgba(31,184,255,0.40)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(ellipse at top, rgba(0,212,255,0.20), transparent 60%)',
        'gradient-gold':    'linear-gradient(135deg, #5BE2FF 0%, #00D4FF 50%, #0099CC 100%)',
        'gradient-warmth':  'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,212,255,0.22), transparent 70%)',
        'gradient-teal':    'linear-gradient(135deg, #5BE2FF 0%, #1FB8FF 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(0, 212, 255, 0.40)' },
          '50%':      { boxShadow: '0 0 36px rgba(0, 212, 255, 0.80)' },
        },
      },
    },
  },
  plugins: [],
};
