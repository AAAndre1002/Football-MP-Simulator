/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: { 950: '#101713', 900: '#151f19', 800: '#1c2921', 700: '#26372c' },
        lime: { 400: '#b8f36b', 500: '#9fe34d' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
