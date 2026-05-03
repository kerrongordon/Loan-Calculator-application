import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/app.vue',
    './app/layouts/**/*.vue',
    './app/components/**/*.{vue,ts}',
    './app/pages/**/*.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-foreground': '#ffffff',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        card: 'var(--color-card)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'float': '0 10px 40px -10px rgba(0, 198, 251, 0.25)',
      }
    }
  },
  plugins: []
} satisfies Config
