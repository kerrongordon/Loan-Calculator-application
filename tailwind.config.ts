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
        background: '#fafafa', // pure minimalist white/gray
        foreground: '#09090b', // sharp dark gray/black
        border: '#e4e4e7',     // soft border
        primary: '#0ea5e9',    // Electric Blue
        'primary-foreground': '#ffffff',
        accent: '#0284c7',     // Deeper Electric Blue for hovers
        muted: '#f4f4f5',
        'muted-foreground': '#71717a'
      },
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 40px -10px rgba(14, 165, 233, 0.15)',
      }
    }
  },
  plugins: []
} satisfies Config
