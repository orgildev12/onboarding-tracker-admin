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
        surface: '#F4F6FA'
      }
    }
  },
  plugins: []
};
