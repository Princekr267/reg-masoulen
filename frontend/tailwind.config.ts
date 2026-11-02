import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
        // Noir / detective section palette (shared by all noir-themed sections)
        noir: {
          bg: '#0d0a08',
          card: '#14110e',
          'card-hover': '#1a1510',
          border: '#2a2218',
          heading: '#f5f0e8',
          title: '#e8dcc8',
          body: '#8a8070',
          blood: {
            DEFAULT: '#8B0000',
            bright: '#B91C1C',
          },
        },
      },
      fontFamily: {
        noir: ["'Georgia'", "'Times New Roman'", 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
