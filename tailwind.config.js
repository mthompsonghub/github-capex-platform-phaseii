/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'union-red': '#E31837',
        'union-red-dark': '#B31329',
        'union-gray': '#333333',
        'union-blue': '#0066B3',
      },
    },
  },
  plugins: [],
};