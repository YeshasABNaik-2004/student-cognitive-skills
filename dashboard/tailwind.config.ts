import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5b6cff',
          50: '#eef0ff',
          100: '#dfe3ff',
          200: '#bfc5ff',
          300: '#9fa8ff',
          400: '#8090ff',
          500: '#5b6cff',
          600: '#3a4bf0',
          700: '#2c39be',
          800: '#222c91',
          900: '#1b236f'
        }
      },
      boxShadow: {
        soft: '0 6px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '14px'
      }
    }
  },
  plugins: []
} satisfies Config


