import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/app.vue',
    './app/components/**/*.{vue,ts}',
    './app/pages/**/*.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        background: '#020617', // slate-950
        foreground: '#f8fafc', // slate-50
        border: 'rgba(255, 255, 255, 0.1)', // highly transparent border
        primary: '#0ea5e9',    // Electric Blue
        'primary-foreground': '#ffffff',
        accent: '#0284c7',     // Deeper Electric Blue for hovers
        muted: 'rgba(255, 255, 255, 0.05)',
        'muted-foreground': '#94a3b8' // slate-400
      },
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.2)',
        'float': '0 10px 40px -10px rgba(14, 165, 233, 0.3)',
      }
    }
  },
  plugins: []
} satisfies Config
