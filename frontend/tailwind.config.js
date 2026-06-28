/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          deep: '#07090e',     // bg-deep
          surface: '#0e1320',  // bg-surface
          card: '#161c2e',     // card container
          border: '#1f2937'    // border-dim
        },
        neon: {
          mint: '#10b981',     // accent-primary
          cobalt: '#3b82f6',   // accent-blue
          gold: '#f59e0b'      // accent-gold
        }
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'Clash Display', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
