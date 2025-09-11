/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clean professional color palette - NO magenta/purple/pink
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          turquoise: '#06d6a0',
          gold: '#ffd60a',
          blue: '#3b82f6',
          emerald: '#10b981',
        },
        magical: {
          dark: '#0f172a',
          deep: '#1e293b',
          teal: '#0f766e',
          emerald: '#059669',
        }
      },
      backgroundImage: {
        'magical-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'premium-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'cta-gradient': 'linear-gradient(135deg, #06d6a0 0%, #ffd60a 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'magical': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'premium': '0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
