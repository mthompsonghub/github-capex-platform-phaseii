/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'union-red': '#C4161C',
        'union-red-dark': '#A11217',
        'union-gray': '#2F3640',
      },
    },
  },
  plugins: [],
};