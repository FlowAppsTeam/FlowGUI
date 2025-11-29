/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mc: {
          bg: '#1e1e1e',
          panel: '#2d2d2d',
          border: '#404040',
          text: '#e0e0e0',
          accent: '#3b82f6',
          success: '#22c55e',
          btn: '#3c3c3c',
          btnHover: '#4a4a4a',
          slot: '#8b8b8b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        mc: ['"Press Start 2P"', 'cursive'],
      }
    },
  },
  plugins: [],
}