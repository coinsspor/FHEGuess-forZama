/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
 theme: {
  extend: {
    fontFamily: {
      fallout: ['VT323', 'monospace'],
    },
  },
},

  plugins: [],
}
