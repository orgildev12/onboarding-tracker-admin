/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  prefix: 'tw-',
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#297F87', light: '#D5EAEC' },
        danger: { DEFAULT: '#A10D00', light: '#F4DAD7' },
        warn: { DEFAULT: '#DE8405', light: '#F8E6CC' },
        // Microsoft (Fluent) neutral palette
        surface: '#F5F5F5',
        ink: '#323130',
        card: '#FAF9F8',
        line: { DEFAULT: '#C8C6C4', light: '#E1DFDD' },
        gray: {
          50: '#FAF9F8',
          100: '#F3F2F1',
          200: '#EDEBE9',
          300: '#D2D0CE',
          400: '#8A8886',
          500: '#605E5C',
          600: '#605E5C',
          700: '#484644',
          800: '#323130',
          900: '#201F1E'
        }
      }
    }
  },
  plugins: []
};
