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
        background: '#f0f4f8',
        foreground: '#1e293b',       // slate-800
        border: '#e2e8f0',           // slate-200
        primary: '#00c6fb',          // Vibrant cyan
        'primary-foreground': '#ffffff',
        accent: '#ff6b35',           // Warm orange (for charts)
        muted: '#f1f5f9',            // slate-100
        'muted-foreground': '#64748b' // slate-500
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.08)',
        'float': '0 10px 40px -10px rgba(0, 198, 251, 0.25)',
      }
    }
  },
  plugins: []
} satisfies Config
