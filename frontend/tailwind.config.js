const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: colors.emerald,
        'primary': '#4CAF50',
        'secondary': '#8BC34A',
        'accent': '#FFEB3B',
      }
    },
  },
  plugins: [],
}
