export default defineNuxtConfig({
  compatibilityDate: '2026-02-25',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['./app/assets/css/tailwind.css'],
  typescript: {
    strict: true,
    typeCheck: true
  }
})
