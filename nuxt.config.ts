export default defineNuxtConfig({
  compatibilityDate: '2026-02-25',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/sitemap'],

  site: {
    url: 'https://yourdomain.com', // Replace with your production domain
    name: 'LoanCalc',
  },

  app: {
    head: {
      titleTemplate: '%s | LoanCalc',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Free online loan calculator with amortization schedules, loan consolidation, multi-currency support, and export features.' },
        { property: 'og:site_name', content: 'LoanCalc' },
        { property: 'og:type', content: 'website' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'LoanCalc' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
  },

  css: ['./app/assets/css/tailwind.css'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  vite: {
    optimizeDeps: {
      include: [
        '@tanstack/vue-form',
        'zod',
        '@vueuse/core'
      ]
    }
  }
})
