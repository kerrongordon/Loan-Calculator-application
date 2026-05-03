<script setup lang="ts">
import type { ThemeMode } from '~/composables/useTheme'

const { mode, setMode } = useTheme()

const options: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'auto', label: 'Auto', icon: 'desktop' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' }
]

const isOpen = ref(false)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const select = (m: ThemeMode) => {
  setMode(m)
  isOpen.value = false
}

// Close on outside click
const dropdownRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  document.addEventListener('click', (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      isOpen.value = false
    }
  })
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 bg-card border border-border text-foreground text-sm rounded-xl px-3 py-2 outline-none hover:border-primary/50 transition-colors cursor-pointer shadow-card"
      @click="toggle"
    >
      <!-- Current icon -->
      <svg v-if="mode === 'light'" class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg v-else-if="mode === 'dark'" class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg v-else class="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <svg class="w-3.5 h-3.5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" fill-rule="evenodd" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-36 rounded-xl bg-card border border-border shadow-card-hover overflow-hidden z-50"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-medium transition-colors text-left"
          :class="[
            mode === opt.value
              ? 'text-primary bg-primary/10'
              : 'text-foreground hover:bg-muted'
          ]"
          @click="select(opt.value)"
        >
          <!-- Sun -->
          <svg v-if="opt.icon === 'sun'" class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <!-- Moon -->
          <svg v-else-if="opt.icon === 'moon'" class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <!-- Desktop / Auto -->
          <svg v-else class="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {{ opt.label }}
          <!-- Checkmark -->
          <svg v-if="mode === opt.value" class="w-3.5 h-3.5 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}
</style>
