<script setup lang="ts">
const mobileMenuOpen = ref(false)
const route = useRoute()

const navLinks = [
  { label: 'Home', to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'About', to: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Contact', to: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
]

// Close mobile menu on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <!-- Logo / Brand -->
        <NuxtLink to="/" class="flex items-center gap-2.5 group">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-lg font-extrabold tracking-tight text-foreground">
            Loan<span class="text-primary">Calc</span>
          </span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200"
            :class="[
              route.path === link.to
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            ]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right side: Theme + Mobile toggle -->
        <div class="flex items-center gap-2">
          <ThemeSwitcher />

          <!-- Mobile menu button -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors md:hidden"
            aria-label="Toggle menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Nav -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="border-t border-border bg-card px-4 py-3 md:hidden">
          <nav class="flex flex-col gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="[
                route.path === link.to
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              ]"
            >
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
              </svg>
              {{ link.label }}
            </NuxtLink>
            <div class="my-1 border-t border-border" />
            <NuxtLink
              v-for="link in legalLinks"
              :key="link.to"
              :to="link.to"
              class="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
      </Transition>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-card/50">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Brand -->
          <div class="sm:col-span-2 lg:col-span-1">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600">
                <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-bold text-foreground">LoanCalc</span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
              Free online loan calculator with amortization schedules, consolidation tools, and export features.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-foreground/70">Tools</h3>
            <ul class="mt-3 space-y-2">
              <li>
                <NuxtLink to="/" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Loan Calculator
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Loan Consolidation
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-foreground/70">Company</h3>
            <ul class="mt-3 space-y-2">
              <li>
                <NuxtLink to="/about" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-foreground/70">Legal</h3>
            <ul class="mt-3 space-y-2">
              <li>
                <NuxtLink to="/privacy-policy" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms-of-service" class="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </NuxtLink>
              </li>
              <li>
                <button
                  type="button"
                  class="text-sm text-muted-foreground hover:text-primary transition-colors"
                  @click="useCookieConsent().openSettings()"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p class="text-xs text-muted-foreground">
            &copy; {{ new Date().getFullYear() }} LoanCalc. All rights reserved.
          </p>
          <p class="text-xs text-muted-foreground/60">
            Not financial advice. For educational purposes only.
          </p>
        </div>
      </div>
    </footer>

    <!-- Cookie Consent Banner -->
    <CookieConsent />
  </div>
</template>

<style scoped>
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-leave-active {
  transition: all 0.2s ease-in;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
