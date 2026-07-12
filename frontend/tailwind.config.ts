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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7cc8fc',
          400: '#38aaf8',
          500: '#0e90e9',
          600: '#0272c7',
          700: '#035ba1',
          800: '#074e85',
          900: '#0c426e',
          950: '#082a4a',
        },
        dark: {
          bg: '#0B0F19',
          card: '#151D30',
          border: '#1E293B',
          text: '#F1F5F9',
          muted: '#94A3B8'
        }
      },
    },
  },
  plugins: [],
};
export default config;
