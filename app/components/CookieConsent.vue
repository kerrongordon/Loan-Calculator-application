<script setup lang="ts">
const {
  showBanner,
  acceptAll,
  rejectNonEssential,
  savePreferences,
  preferences,
} = useCookieConsent()

const showDetails = ref(false)

const localPrefs = ref({
  analytics: false,
  advertising: false,
})

watch(showBanner, (visible) => {
  if (visible) {
    localPrefs.value = {
      analytics: preferences.value.analytics,
      advertising: preferences.value.advertising,
    }
    showDetails.value = false
  }
})

const handleSavePreferences = () => {
  savePreferences(localPrefs.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="consent-slide">
      <div
        v-if="showBanner"
        id="cookie-consent-banner"
        class="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6"
      >
        <div
          class="mx-auto max-w-4xl rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-6 shadow-2xl"
        >
          <!-- Header -->
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-base font-bold text-foreground">Cookie Preferences</h2>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                We use cookies to enhance your experience and serve personalized ads. You can choose which cookies to allow.
                Read our
                <NuxtLink to="/privacy-policy" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  Privacy Policy
                </NuxtLink>
                for more details.
              </p>
            </div>
          </div>

          <!-- Detailed Preferences (collapsible) -->
          <Transition name="expand">
            <div v-if="showDetails" class="mt-5 space-y-3 rounded-xl border border-border bg-muted/50 p-4">
              <!-- Functional (always on) -->
              <label class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-foreground">Essential Cookies</p>
                  <p class="text-xs text-muted-foreground">Required for the site to function properly</p>
                </div>
                <div class="relative">
                  <input type="checkbox" checked disabled class="sr-only peer" />
                  <div class="h-6 w-11 rounded-full bg-primary/60 cursor-not-allowed" />
                  <div class="absolute left-[22px] top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                </div>
              </label>

              <!-- Analytics -->
              <label class="flex items-center justify-between cursor-pointer group">
                <div>
                  <p class="text-sm font-semibold text-foreground">Analytics Cookies</p>
                  <p class="text-xs text-muted-foreground">Help us understand how visitors use the site</p>
                </div>
                <div class="relative">
                  <input v-model="localPrefs.analytics" type="checkbox" class="sr-only peer" />
                  <div class="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary group-hover:ring-2 ring-primary/20" />
                  <div class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </div>
              </label>

              <!-- Advertising -->
              <label class="flex items-center justify-between cursor-pointer group">
                <div>
                  <p class="text-sm font-semibold text-foreground">Advertising Cookies</p>
                  <p class="text-xs text-muted-foreground">Used to show you relevant ads via Google AdSense</p>
                </div>
                <div class="relative">
                  <input v-model="localPrefs.advertising" type="checkbox" class="sr-only peer" />
                  <div class="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary group-hover:ring-2 ring-primary/20" />
                  <div class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </Transition>

          <!-- Actions -->
          <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              @click="showDetails = !showDetails"
            >
              {{ showDetails ? 'Hide details' : 'Manage preferences' }}
            </button>
            <div class="flex gap-2">
              <button
                v-if="!showDetails"
                id="cookie-reject-btn"
                type="button"
                class="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:border-primary/30"
                @click="rejectNonEssential"
              >
                Reject All
              </button>
              <button
                v-if="showDetails"
                id="cookie-save-prefs-btn"
                type="button"
                class="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:border-primary/30"
                @click="handleSavePreferences"
              >
                Save Preferences
              </button>
              <button
                id="cookie-accept-btn"
                type="button"
                class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
                @click="acceptAll"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.consent-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.consent-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.consent-slide-enter-from,
.consent-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
