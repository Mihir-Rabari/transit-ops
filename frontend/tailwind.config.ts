import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design system — named by intent, not value
        base:   { DEFAULT: '#12161D' },          // deep slate-navy bg
        surface: { DEFAULT: '#1B222C', raised: '#232B37' }, // panel / modal
        border: { DEFAULT: '#2A3340' },
        text: { primary: '#EDF1F6', muted: '#8993A4' },

        // Signal system — status semantics, consistent across every screen
        signal: {
          amber: '#FFB020',   // dispatched / active / pending CTA
          green: '#3ECF8E',   // available / completed / success
          red:   '#FF5C5C',   // suspended / cancelled / expired
          slate: '#4A5568',   // in-shop / neutral / off-duty
        },

        // Legacy brand shim (keep for any component that still refs brand-xxx)
        brand: {
          50: '#fff8e6', 100: '#feefc3', 200: '#fdd882',
          300: '#fcc141', 400: '#FFB020', 500: '#e09800',
          600: '#b87800', 700: '#8c5a00', 800: '#663f00', 900: '#402700', 950: '#1a0f00',
        },

        // Deprecated dark-* palette — alias to new tokens
        dark: {
          bg:     '#12161D',
          card:   '#1B222C',
          border: '#2A3340',
          text:   '#EDF1F6',
          muted:  '#8993A4',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        sans:    ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
      fontSize: {
        // Rigid type scale: 12 / 14 / 16 / 20 / 28 / 40 / 56
        'scale-xs':  ['12px', { lineHeight: '18px' }],
        'scale-sm':  ['14px', { lineHeight: '20px' }],
        'scale-md':  ['16px', { lineHeight: '24px' }],
        'scale-lg':  ['20px', { lineHeight: '28px' }],
        'scale-xl':  ['28px', { lineHeight: '36px' }],
        'scale-2xl': ['40px', { lineHeight: '48px' }],
        'scale-3xl': ['56px', { lineHeight: '64px' }],
      },
      letterSpacing: {
        display: '-0.02em', // headings
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-amber': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'count-up': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in':     'fade-in 200ms ease forwards',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
