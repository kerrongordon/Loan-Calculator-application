import { computed, onMounted, watch } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const useTheme = () => {
  const mode = useState<ThemeMode>('app/theme-mode', () => 'auto')

  const applyTheme = (m: ThemeMode) => {
    if (!import.meta.client) return

    const root = document.documentElement
    if (m === 'dark') {
      root.classList.add('dark')
    } else if (m === 'light') {
      root.classList.remove('dark')
    } else {
      // auto — follow system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }

  const setMode = (m: ThemeMode) => {
    mode.value = m
    if (import.meta.client) {
      localStorage.setItem('theme-mode', m)
    }
    applyTheme(m)
  }

  const isDark = computed(() => {
    if (!import.meta.client) return false
    return document.documentElement.classList.contains('dark')
  })

  onMounted(() => {
    // Restore from localStorage
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null
    if (stored && ['auto', 'light', 'dark'].includes(stored)) {
      mode.value = stored
    }
    applyTheme(mode.value)

    // Listen for system preference changes (only matters in auto mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', () => {
      if (mode.value === 'auto') {
        applyTheme('auto')
      }
    })
  })

  watch(mode, (m) => applyTheme(m))

  return { mode, setMode, isDark }
}
