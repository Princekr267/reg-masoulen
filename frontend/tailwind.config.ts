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
      },
    },
  },
  plugins: [],
} satisfies Config;
