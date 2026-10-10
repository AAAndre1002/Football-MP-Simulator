/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: { 950: '#08090b', 900: '#101215', 800: '#191c20', 700: '#252a30' },
        lime: { 300: '#f7df75', 400: '#f2c94c', 500: '#d9ab18' },
        gold: { 300: '#f7df75', 400: '#f2c94c', 500: '#d9ab18' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
