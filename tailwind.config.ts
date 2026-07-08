import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        // Surface scale — backgrounds and containers
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fa',
          muted: '#f1f3f5',
        },
        // Border scale
        border: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1',
        },
        // Text scale
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
          inverse: '#ffffff',
        },
        // Accent — single interactive color, no brand name
        accent: {
          DEFAULT: '#2563eb',
          hover:   '#1d4ed8',
          subtle:  '#eff6ff',
        },
        // Semantic feedback — generic names, no domain coupling
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
        header: '56px',
      },
      keyframes: {
        // Skeleton shimmer — sweeps a highlight across loading placeholders
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Fade + slide up — used for page entry and card reveals
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade in only — used for overlays and panels
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Scale + fade — used for dialogs opening
        dialogIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        shimmer:   'shimmer 1.8s ease-in-out infinite',
        'fade-up': 'fadeUp 200ms ease-out both',
        'fade-in': 'fadeIn 150ms ease-out both',
        'dialog-in': 'dialogIn 180ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
