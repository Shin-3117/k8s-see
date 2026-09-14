/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        k8s: {
          blue: '#326CE5',
          lightBlue: '#6196FF',
          darkBlue: '#1D4ED8',
          navy: '#0B1120',
          card: '#1E293B',
          border: '#334155',
          accent: '#38BDF8'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'dash 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(50, 108, 229, 0.8))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(50, 108, 229, 0.2))' },
        },
        dash: {
          to: { strokeDashoffset: '-1000' }
        }
      }
    },
  },
  plugins: [],
}
