import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/app.vue',
    './app/components/**/*.{vue,ts}',
    './app/pages/**/*.vue'
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        border: '#cbd5e1',
        primary: '#0f766e',
        'primary-foreground': '#f8fafc',
        accent: '#f59e0b'
      }
    }
  },
  plugins: []
} satisfies Config
