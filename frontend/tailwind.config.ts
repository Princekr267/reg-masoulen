import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        gothic: ['Cinzel', 'serif'],
        serif: ['"EB Garamond"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        // Gothic murder-mystery crime-board palette
        gothic: {
          red: '#b0121b',
          'bright-red': '#e51a24',
          maroon: '#3a0608',
          deep: '#220305',
          black: '#0d0203',
          card: '#160406',
        },
        parchment: {
          light: '#f4e9de',
          DEFAULT: '#e8d5c4',
          mid: '#dfcdbb',
          dark: '#c4ab94',
          border: '#8a715a',
        },
        // Existing app colors (preserved for register, status, admin)
        theme: {
          bg: '#0a0a0c',
          panel: '#121217',
          surface: '#181820',
          border: '#2a2a35',
          'border-muted': '#1f1f28',
          text: '#f3f4f6',
          muted: '#9ca3af',
          red: {
            DEFAULT: '#e11d48',
            hover: '#be123c',
            dark: '#881337',
            light: '#fda4af',
          },
        },
      },
      boxShadow: {
        'glow-red-sm': '0 0 8px rgba(229, 26, 36, 0.5)',
        'glow-red': '0 0 16px rgba(229, 26, 36, 0.65)',
        'glow-red-lg': '0 0 30px rgba(229, 26, 36, 0.85)',
        'polaroid': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
      },
      dropShadow: {
        'glow-red': '0 0 10px rgba(229, 26, 36, 0.75)',
        'glow-red-lg': '0 0 20px rgba(229, 26, 36, 0.9)',
      },
      animation: {
        'slow-spin': 'spin 120s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(229, 26, 36, 0.5)' },
          '50%': { boxShadow: '0 0 24px rgba(229, 26, 36, 0.9)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
