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
        brand: { DEFAULT: '#2B7F86', light: '#D5EAEC' },
        danger: { DEFAULT: '#B3170B', light: '#FBE3E1' },
        warn: { DEFAULT: '#F2994A', light: '#FDEBD3' },
        surface: '#F4F6FA'
      }
    }
  },
  plugins: []
};
