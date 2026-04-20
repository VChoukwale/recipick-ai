/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: {
          50:  '#FFFBF7',
          100: '#FFF8F0',
          200: '#FFF0DC',
        },
        charcoal: {
          700: '#3D3835',
          800: '#2C2825',
          900: '#1C1917',
          950: '#0F0E0D',
        },
        // Primary accent — burnt orange
        brand: {
          50:  '#FFF3EC',
          100: '#FFE4CC',
          200: '#FFC99A',
          300: '#FFA768',
          400: '#F08040',
          500: '#E8713A',
          600: '#D05A20',
          700: '#A8440F',
          800: '#7A3009',
          900: '#4C1E05',
        },
        // Secondary — sage green
        sage: {
          50:  '#F2F7F2',
          100: '#DDEEDD',
          200: '#B8D8B8',
          300: '#8FB88F',
          400: '#6B8F6B',
          500: '#507050',
          600: '#3B543B',
          700: '#283A28',
        },
        // Cuisine tints
        cuisine: {
          indian:       '#FFF3E0',
          korean:       '#E0F4F4',
          italian:      '#F0F4E8',
          mexican:      '#FFF8E1',
          chinese:      '#FDECEA',
          thai:         '#F3E5F5',
          japanese:     '#E8EAF6',
          mediterranean:'#E8F5E9',
        },
      },
      fontFamily: {
        display: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        '400': '400',
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      animation: {
        'pulse-green': 'pulseGreen 0.4s ease-out',
        'glow-gold':   'glowGold 0.5s ease-out forwards',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.25s ease-out',
        'simmer':      'simmer 1.8s ease-in-out infinite',
        'blob':        'blob 9s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'card-enter':  'cardEnter 0.4s ease-out both',
        'pop':         'pop 0.2s ease-out',
        'cta-pulse':   'ctaPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%':   { boxShadow: '0 0 0 0 rgba(107,143,107,0.6)' },
          '100%': { boxShadow: '0 0 0 8px rgba(107,143,107,0)' },
        },
        glowGold: {
          '0%':   { filter: 'drop-shadow(0 0 0 #F59E0B)' },
          '50%':  { filter: 'drop-shadow(0 0 6px #F59E0B)', transform: 'scale(1.15)' },
          '100%': { filter: 'drop-shadow(0 0 3px #F59E0B)', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        simmer: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%':      { transform: 'translate(25px, -18px) scale(1.06)' },
          '66%':      { transform: 'translate(-15px, 12px) scale(0.94)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-10px) rotate(5deg)' },
        },
        cardEnter: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%':   { transform: 'scale(1)' },
          '45%':  { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        ctaPulse: {
          '0%, 100%': { boxShadow: '0 4px 14px 0 rgba(232,113,58,0.35)' },
          '50%':      { boxShadow: '0 4px 22px 4px rgba(232,113,58,0.55)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
