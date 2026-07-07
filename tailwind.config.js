/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy/indigo — the institutional primary
        ink: {
          50: '#f2f5fb',
          100: '#e2e8f5',
          200: '#c7d3ea',
          300: '#9fb2d9',
          400: '#6f8ac4',
          500: '#4c67ad',
          600: '#3a4f91',
          700: '#2f3f75',
          800: '#1f2a52', // primary
          900: '#151d3b',
          950: '#0c1226',
        },
        // Saffron accent (Government of India tone)
        saffron: {
          50: '#fff8ed',
          100: '#ffedd0',
          200: '#ffd79f',
          300: '#ffba64',
          400: '#ff9838',
          500: '#ff7d10', // accent
          600: '#f05f06',
          700: '#c74607',
          800: '#9e380e',
          900: '#7f300f',
        },
        // Indian green (used sparingly, resolved states / trust)
        ashoka: {
          500: '#0f8a4f',
          600: '#0b7343',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)',
        lift: '0 8px 30px rgba(15,23,42,0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
